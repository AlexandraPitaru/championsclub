import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Mail, ShieldCheck, Trophy, UserRound, X } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import AppShell from "../app/layouts/AppShell";
import Card from "../components/ui/Card";
import AdvisorAIActivitySummary from "../features/advisor/AdvisorAIActivitySummary";
import KPIStatCard from "../features/dashboard/KPIStatCard";
import {
  getAdvisorProfileKpis,
  type KpiInterval,
} from "../services/api/managerStatisticsService";
import { useAdvisorActivitySummary } from "../services/hooks/useAdvisorActivitySummary";

type StoredUser = {
  email: string;
  user_id: number;
  role: string;
};

type AlertNavigationState = {
  fromAlert?: boolean;
  alertTitle?: string;
  alertMessage?: string;
  alertPriority?: "high" | "medium" | "low" | string;
};

type AlertPopupContent = {
  title: string;
  message: string;
  priority: "high" | "medium" | "low";
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

function getRankTrophyColor(rank: string) {
  const normalizedRank = rank.trim().toLowerCase();

  if (normalizedRank === "gold") {
    return "text-amber-300";
  }

  if (normalizedRank === "silver") {
    return "text-slate-300";
  }

  if (normalizedRank === "bronze") {
    return "text-orange-400";
  }

  return "text-cyan-300";
}

function normalizeAlertPriority(priority?: string): "high" | "medium" | "low" {
  if (priority === "high" || priority === "medium" || priority === "low") {
    return priority;
  }

  return "medium";
}

function buildAlertPopupContent(state: AlertNavigationState | null): AlertPopupContent | null {
  if (!state?.fromAlert || !state.alertMessage?.trim()) {
    return null;
  }

  return {
    title: state.alertTitle?.trim() || "Alert context",
    message: state.alertMessage.trim(),
    priority: normalizeAlertPriority(state.alertPriority),
  };
}

function getAlertPopupTone(priority: "high" | "medium" | "low") {
  if (priority === "high") {
    return {
      border: "border-rose-500/45",
      badge: "border-rose-400/40 bg-rose-500/15 text-rose-200",
    };
  }

  if (priority === "low") {
    return {
      border: "border-cyan-500/45",
      badge: "border-cyan-400/40 bg-cyan-500/15 text-cyan-200",
    };
  }

  return {
    border: "border-amber-500/45",
    badge: "border-amber-400/40 bg-amber-500/15 text-amber-200",
  };
}

export default function AdvisorProfilePage() {
  const { id } = useParams();
  const location = useLocation();
  const [interval, setInterval] = useState<KpiInterval>("all");
  const alertHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alertRemoveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [alertPopup, setAlertPopup] = useState<AlertPopupContent | null>(() =>
    buildAlertPopupContent(location.state as AlertNavigationState | null)
  );
  const [isAlertPopupVisible, setIsAlertPopupVisible] = useState(Boolean(alertPopup));

  const dismissAlertPopup = (withFade = true) => {
    if (alertHideTimeoutRef.current) {
      clearTimeout(alertHideTimeoutRef.current);
      alertHideTimeoutRef.current = null;
    }

    if (alertRemoveTimeoutRef.current) {
      clearTimeout(alertRemoveTimeoutRef.current);
      alertRemoveTimeoutRef.current = null;
    }

    if (!withFade) {
      setIsAlertPopupVisible(false);
      setAlertPopup(null);
      return;
    }

    setIsAlertPopupVisible(false);
    alertRemoveTimeoutRef.current = setTimeout(() => {
      setAlertPopup(null);
      alertRemoveTimeoutRef.current = null;
    }, 450);
  };

  useEffect(() => {
    const popup = buildAlertPopupContent(location.state as AlertNavigationState | null);
    setAlertPopup(popup);
    setIsAlertPopupVisible(Boolean(popup));
  }, [location.key, location.state]);

  useEffect(() => {
    if (!alertPopup) {
      return;
    }

    setIsAlertPopupVisible(true);

    alertHideTimeoutRef.current = setTimeout(() => {
      dismissAlertPopup(true);
    }, 7000);

    return () => {
      if (alertHideTimeoutRef.current) {
        clearTimeout(alertHideTimeoutRef.current);
        alertHideTimeoutRef.current = null;
      }

      if (alertRemoveTimeoutRef.current) {
        clearTimeout(alertRemoveTimeoutRef.current);
        alertRemoveTimeoutRef.current = null;
      }
    };
  }, [alertPopup]);

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

  const {
    data: activitySummary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
  } = useAdvisorActivitySummary({
    managerId,
    advisorId,
    interval,
    enabled: Boolean(managerId) && hasValidAdvisorId,
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
  const alertPopupTone = alertPopup ? getAlertPopupTone(alertPopup.priority) : null;

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

        {alertPopup && alertPopupTone && (
          <section className="pointer-events-none fixed right-4 top-8 z-30 w-full max-w-md md:right-6 md:top-6">
            <div
              role="status"
              aria-live="polite"
              className={`pointer-events-auto rounded-2xl border ${alertPopupTone.border} bg-[#0f2239]/65 p-4 shadow-[0_18px_40px_rgba(2,8,23,0.4)] backdrop-blur transition-all duration-[450ms] ${
                isAlertPopupVisible
                  ? "translate-y-0 opacity-100"
                  : "-translate-y-1 opacity-0"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${alertPopupTone.badge}`}
                  >
                    Opened from alert
                  </span>
                  <p className="mt-2 text-sm font-semibold text-slate-100">{alertPopup.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{alertPopup.message}</p>
                </div>

                <button
                  type="button"
                  onClick={() => dismissAlertPopup(true)}
                  aria-label="Close alert context"
                  className="rounded-lg border border-white/15 bg-white/5 p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>
        )}

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
                        <Trophy className={`h-4 w-4 ${getRankTrophyColor(advisor.current_rank)}`} />
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
              <AdvisorAIActivitySummary
                summary={activitySummary?.summary ?? null}
                isLoading={isSummaryLoading}
                isError={isSummaryError}
                isFallback={Boolean(activitySummary?.fallback)}
              />
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}