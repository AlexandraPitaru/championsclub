import { useMemo } from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, Mail, ShieldCheck, Trophy, UserRound } from "lucide-react";
import AppShell from "../app/layouts/AppShell";
import Card from "../components/ui/Card";

type StoredUser = {
  email: string;
  user_id: number;
  role: string;
};

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

function toTitleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");
}

export default function AdvisorDashboardPage() {
  const currentUser = useMemo(() => getCurrentUserFromStorage(), []);
  const isAdvisor = currentUser?.role?.toLowerCase() === "sales_advisor";

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-cyan-100">Advisor Dashboard</h1>
            <p className="mt-2 text-slate-400">
              Personal workspace for account details and self-service progress overview.
            </p>
          </div>

          <Card className="w-full max-w-md border-[#28415f] bg-[#0d1a2b]">
            <p className="text-sm font-semibold text-cyan-100">Session Status</p>
            <p className="mt-2 text-sm text-slate-300">
              {isAdvisor
                ? "You are signed in as sales advisor."
                : "Current session is not a sales advisor account."}
            </p>
          </Card>
        </section>

        {!currentUser && (
          <Card className="border border-rose-500/40 bg-rose-500/10">
            <h2 className="text-lg font-semibold text-rose-200">Session not found</h2>
            <p className="mt-2 text-sm text-rose-100/90">
              The advisor dashboard requires an authenticated advisor session.
            </p>
          </Card>
        )}

        {currentUser && (
          <>
            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <Card className="border border-[#28415f] bg-[#0d1a2b]">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-200">
                      <UserRound className="h-7 w-7" />
                    </div>
                    <h2 className="mt-4 text-2xl font-bold text-slate-100">
                      Advisor Account
                    </h2>
                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-300">
                      <Mail className="h-4 w-4 text-cyan-300" />
                      {currentUser.email}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:max-w-sm lg:flex-1">
                    <div className="rounded-xl border border-[#29405b] bg-[#081322] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Role
                      </p>
                      <p className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-100">
                        <ShieldCheck className="h-4 w-4 text-cyan-300" />
                        {toTitleCase(currentUser.role)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#29405b] bg-[#081322] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        User ID
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-100">
                        {currentUser.user_id}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#29405b] bg-[#081322] p-4 sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Dashboard Mode
                      </p>
                      <p className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-100">
                        <LayoutDashboard className="h-4 w-4 text-cyan-300" />
                        Self-service advisor view
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
                    <p className="text-sm text-slate-400">Access Type</p>
                    <p className="mt-2 text-lg font-semibold text-slate-100">
                      Personal login session
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#29405b] bg-[#081322] p-4">
                    <p className="text-sm text-slate-400">Email</p>
                    <p className="mt-2 text-lg font-semibold text-slate-100 break-all">
                      {currentUser.email}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#29405b] bg-[#081322] p-4">
                    <p className="text-sm text-slate-400">Navigation</p>
                    <p className="mt-2 text-lg font-semibold text-cyan-100">
                      Advisor-only route
                    </p>
                  </div>
                </div>
              </Card>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card className="border border-[#28415f] bg-[#0d1a2b]">
                <p className="text-sm text-slate-400">Account Role</p>
                <p className="mt-2 text-2xl font-bold text-slate-100">
                  {toTitleCase(currentUser.role)}
                </p>
              </Card>
              <Card className="border border-[#28415f] bg-[#0d1a2b]">
                <p className="text-sm text-slate-400">Session User ID</p>
                <p className="mt-2 text-2xl font-bold text-slate-100">
                  {currentUser.user_id}
                </p>
              </Card>
              <Card className="border border-[#28415f] bg-[#0d1a2b]">
                <p className="text-sm text-slate-400">Account Email</p>
                <p className="mt-2 text-lg font-bold text-slate-100 break-all">
                  {currentUser.email}
                </p>
              </Card>
              <Card className="border border-[#28415f] bg-[#0d1a2b]">
                <p className="text-sm text-slate-400">Current Rank</p>
                <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-slate-100">
                  <Trophy className="h-5 w-5 text-amber-300" />
                  Pending API
                </p>
              </Card>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <Card className="border border-[#28415f] bg-[#0d1a2b]">
                <h2 className="text-lg font-semibold text-cyan-100">
                  Advisor Summary
                </h2>
                <div className="mt-4 space-y-4">
                  <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4">
                    <p className="text-sm font-semibold text-cyan-100">
                      Chat Generated Message
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      You are signed in as {toTitleCase(currentUser.role)} with account ID {currentUser.user_id}. This page is now isolated from the manager advisor-detail flow, so manager drill-downs and advisor self-view no longer share the same route. KPI details for self-view still need a dedicated advisor endpoint before this page can show live rank, points, transactions, and sales values.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="border border-[#28415f] bg-[#0d1a2b]">
                <h2 className="text-lg font-semibold text-cyan-100">
                  Next Available Navigation
                </h2>
                <div className="mt-4 space-y-4">
                  <Link
                    to="/leaderboard"
                    className="flex items-center justify-between rounded-xl border border-[#29405b] bg-[#081322] px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-[#112238]"
                  >
                    <span>Open leaderboard</span>
                    <span className="text-cyan-300">Go</span>
                  </Link>
                </div>
              </Card>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}