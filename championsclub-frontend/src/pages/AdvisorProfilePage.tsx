import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Mail, ShieldCheck, Trophy, UserRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import AppShell from "../app/layouts/AppShell";
import Card from "../components/ui/Card";
import KPIStatCard from "../features/dashboard/KPIStatCard";
import {
  getAdvisorProfileKpis,
  type KpiInterval,
  type UserKpiResponse,
} from "../services/api/managerStatisticsService";

type StoredUser = {
  email: string;
  user_id: number;
  role: string;
};

const intervalOptions: KpiInterval[] = ["all", "day", "week", "month"];

function getCurrentUserFromStorage(): StoredUser | null {
  const currentUserRaw = localStorage.getItem("currentUser");

  if (!currentUserRaw) {
    return null;
  }

  try {
    return JSON.parse(currentUserRaw) as StoredUser;
  } catch {
    return null;
  }
}

function formatCurrency(value: number) {
  return `€${Number(value).toLocaleString()}`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "No transactions yet";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function toTitleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");
}

function buildChatGeneratedMessage(advisor: UserKpiResponse, interval: KpiInterval) {
  const intervalLabel = interval === "all" ? "all tracked periods" : `the selected ${interval} interval`;
  const lastTransaction = advisor.last_transaction_date
    ? `The most recent transaction was recorded on ${formatDate(advisor.last_transaction_date)}.`
    : "There is no recorded transaction yet for this advisor.";

  return `${advisor.first_name} ${advisor.last_name} is currently ranked ${advisor.current_rank} with ${Number(
    advisor.total_points
  ).toLocaleString()} total points and ${Number(advisor.credit).toLocaleString()} credit. Across ${intervalLabel}, the advisor closed ${advisor.total_transactions} transactions, generated ${formatCurrency(
    advisor.total_sales_amount
  )} in sales, and sold ${advisor.total_products_sold} products for ${Number(
    advisor.total_points_earned
  ).toLocaleString()} earned points. ${lastTransaction}`;
}

export default function AdvisorProfilePage() {
  const { id } = useParams();
  const [interval, setInterval] = useState<KpiInterval>("all");

  const currentUser = useMemo(() => getCurrentUserFromStorage(), []);
  const managerId =
    currentUser?.role?.toLowerCase() === "manager"
      ? Number(currentUser.user_id)
      : null;
  const advisorId = Number(id);
  const hasValidAdvisorId = Number.isInteger(advisorId) && advisorId > 0;

  const {
    data: advisor,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["advisor-profile-kpis", managerId, advisorId, interval],
    queryFn: () => getAdvisorProfileKpis(managerId as number, advisorId, interval),
    enabled: Boolean(managerId) && hasValidAdvisorId,
    retry: false,
  });

  const stats = advisor
    ? [
        {
          title: "Total Points",
          value: Number(advisor.total_points).toLocaleString(),
          delta: advisor.current_rank,
          status: "positive" as const,
        },
        {
          title: "Credit",
          value: Number(advisor.credit).toLocaleString(),
          delta: "Redeemable balance",
          status: "neutral" as const,
        },
        {
          title: "Total Transactions",
          value: String(advisor.total_transactions),
          delta: `${toTitleCase(interval)} interval`,
          status: "neutral" as const,
        },
        {
          title: "Sales Amount",
          value: formatCurrency(advisor.total_sales_amount),
          delta: `${advisor.total_products_sold} products sold`,
          status: "positive" as const,
        },
      ]
    : [];

  const showAccessError = !hasValidAdvisorId || !managerId || isError;
  const chatGeneratedMessage = advisor
    ? buildChatGeneratedMessage(advisor, interval)
    : "";

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-medium text-cyan-300 transition hover:text-cyan-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>

            <h1 className="mt-3 text-2xl font-bold text-cyan-100 md:text-3xl">
              Advisor Profile
            </h1>
            <p className="mt-2 text-sm text-slate-400 md:text-base">
              Review advisor performance, current standing, and recent activity.
            </p>
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {intervalOptions.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={interval === option}
                onClick={() => setInterval(option)}
                className={`min-w-[58px] rounded-full border px-4 py-2 text-sm font-semibold capitalize leading-none transition ${
                  interval === option
                    ? "border-cyan-500/60 bg-cyan-500/18 text-cyan-100 shadow-[0_0_18px_rgba(6,182,212,0.18)]"
                    : "border-[#29405b] bg-[#081322] text-slate-300 hover:border-cyan-500/30 hover:bg-[#112238] hover:text-cyan-100"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </section>

        {isLoading && (
          <>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="h-56 animate-pulse rounded-2xl border border-[#29405b] bg-[#0d1a2b]" />
              <div className="h-56 animate-pulse rounded-2xl border border-[#29405b] bg-[#0d1a2b]" />
            </div>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-32 animate-pulse rounded-2xl border border-[#29405b] bg-[#0d1a2b]"
                />
              ))}
            </section>
          </>
        )}

        {showAccessError && !isLoading && (
          <Card className="border border-rose-500/40 bg-rose-500/10">
            <h2 className="text-lg font-semibold text-rose-200">
              Advisor could not be loaded
            </h2>
            <p className="mt-2 text-sm text-rose-100/90">
              The advisor does not exist, is not assigned to the current manager, or the current manager session is missing.
            </p>
          </Card>
        )}

        {advisor && !isLoading && !showAccessError && (
          <>
            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <Card className="border border-[#28415f] bg-[#0d1a2b]">
                <div className="flex flex-col items-center gap-6 text-center">
                  <div className="flex flex-col items-center">
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-200">
                      <UserRound className="h-7 w-7" />
                    </div>
                    <h2 className="mt-4 text-2xl font-bold text-slate-100">
                      {advisor.first_name} {advisor.last_name}
                    </h2>
                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-300">
                      <Mail className="h-4 w-4 text-cyan-300" />
                      {advisor.email}
                    </p>
                  </div>

                  <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-[#29405b] bg-[#081322] p-4">
                      <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Role
                      </p>
                      <p className="mt-2 flex items-center justify-center gap-2 text-sm font-medium text-slate-100">
                        <ShieldCheck className="h-4 w-4 text-cyan-300" />
                        {toTitleCase(advisor.role)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#29405b] bg-[#081322] p-4">
                      <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Status
                      </p>
                      <p className="mt-2 text-center text-sm font-medium text-slate-100">
                        {toTitleCase(advisor.status)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#29405b] bg-[#081322] p-4 sm:col-span-2">
                      <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Current Rank
                      </p>
                      <p className="mt-2 flex items-center justify-center gap-2 text-sm font-medium text-slate-100">
                        <Trophy className="h-4 w-4 text-amber-300" />
                        {advisor.current_rank}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="border border-[#28415f] bg-[#0d1a2b]">
                <h2 className="text-lg font-semibold text-cyan-100">
                  Profile Snapshot
                </h2>
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border border-[#29405b] bg-[#081322] p-4">
                    <p className="text-sm text-slate-400">Advisor ID</p>
                    <p className="mt-2 text-2xl font-bold text-slate-100">
                      {advisor.user_id}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#29405b] bg-[#081322] p-4">
                    <p className="text-sm text-slate-400">Last Transaction Date</p>
                    <p className="mt-2 text-lg font-semibold text-slate-100">
                      {formatDate(advisor.last_transaction_date)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#29405b] bg-[#081322] p-4">
                    <p className="text-sm text-slate-400">Selected Interval</p>
                    <p className="mt-2 text-lg font-semibold capitalize text-cyan-100">
                      {interval}
                    </p>
                  </div>
                </div>
              </Card>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <KPIStatCard
                  key={stat.title}
                  title={stat.title}
                  value={stat.value}
                  delta={stat.delta}
                  status={stat.status}
                />
              ))}
            </section>

            <section>
              <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-cyan-500/30 bg-cyan-500/5 px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-cyan-100">
                    Performance Popup Slot
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Reserved trigger area for the upcoming advisor performance popup.
                  </p>
                </div>

                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  aria-haspopup="dialog"
                  data-popup-slot="advisor-performance"
                  className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 opacity-70"
                >
                  Open performance details
                </button>
              </div>
            </section>

            <section>
              <Card className="border border-[#28415f] bg-[#0d1a2b]">
                <h2 className="text-lg font-semibold text-cyan-100">
                  Activity Summary
                </h2>
                <div className="mt-4">
                  <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4">
                    <p className="text-sm font-semibold text-cyan-100">
                      Chat Generated Message
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      {chatGeneratedMessage}
                    </p>
                  </div>
                </div>
              </Card>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}