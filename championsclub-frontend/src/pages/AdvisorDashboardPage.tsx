import { useMemo } from "react";
import { useAdvisorDashboardOverview } from "../services/hooks/useAdvisorDashboardOverview";
import { Trophy, UserRound } from "lucide-react";
import AppShell from "../app/layouts/AppShell";
import Card from "../components/ui/Card";
import PersonalPointsVsTeamAverageChart from "../components/charts/PersonalPointsVsTeamAverageChart";
import RankProgressChart from "../components/charts/RankProgressChart";

// Helper to get user from localStorage
function getCurrentUserFromStorage() {
  const currentUserRaw = localStorage.getItem("currentUser");
  if (!currentUserRaw) return null;
  try {
    return JSON.parse(currentUserRaw);
  } catch {
    return null;
  }
}

function toTitleCase(value: string): string {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((segment: string) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");
}

function getRankColor(rank: string) {
  const normalizedRank = rank.trim().toLowerCase();

  if (normalizedRank === "gold") {
    return "#facc15";
  }

  if (normalizedRank === "silver") {
    return "#c0c0c0";
  }

  if (normalizedRank === "bronze") {
    return "#cd7f32";
  }

  return "#67e8f9";
}

export default function AdvisorDashboardPage() {
  const currentUser = useMemo(getCurrentUserFromStorage, []);
  const isAdvisor = currentUser?.role?.toLowerCase() === "sales_advisor";
  const userId = currentUser?.user_id;
  const { data: overview, isLoading, isError } = useAdvisorDashboardOverview(userId);
  const currentUserFirstName =
    overview?.dashboard_summary?.advisor_name?.trim().split(/\s+/)[0] ||
    currentUser?.first_name ||
    currentUser?.email?.split("@")[0] ||
    "Advisor";

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-cyan-100">Welcome back, {currentUserFirstName}!</h1>
            <p className="mt-2 text-slate-400">
             Advisor Dashboard: Personal workspace for account details and self-service progress overview.
            </p>
          </div>
          <Card style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}>
            <p className="text-sm font-semibold text-cyan-100">Session Status</p>
            <p className="mt-2 text-sm text-slate-300">
              {isAdvisor
                ? "You are signed in as sales advisor."
                : "Current session is not a sales advisor account."}
            </p>
          </Card>
        </section>

        {isLoading && (
          <Card className="border border-cyan-500/40 bg-cyan-500/10">
            <h2 className="text-lg font-semibold text-cyan-200">Loading</h2>
            <p className="mt-2 text-sm text-cyan-100/90">Loading dashboard data...</p>
          </Card>
        )}
        {isError && (
          <Card className="border border-rose-500/40 bg-rose-500/10">
            <h2 className="text-lg font-semibold text-rose-200">Error</h2>
            <p className="mt-2 text-sm text-rose-100/90">Error loading dashboard data.</p>
          </Card>
        )}
        {!currentUser && !isLoading && !isError && (
          <Card className="border border-rose-500/40 bg-rose-500/10">
            <h2 className="text-lg font-semibold text-rose-200">Session not found</h2>
            <p className="mt-2 text-sm text-rose-100/90">
              The advisor dashboard requires an authenticated advisor session.
            </p>
          </Card>
        )}
        {currentUser && overview && !isLoading && !isError && (
          <>
            {/* Modern Responsive Dashboard Layout */}
            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full h-full">
              {/* Account Summary - vizual dominant, col 1 */}
              <Card className="flex flex-col items-center justify-center text-center p-8 shadow-xl rounded-2xl min-h-[420px] h-full" style={{ background: "var(--summary-bg)", borderColor: "var(--card-border)" }}>
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-cyan-500/40 bg-cyan-500/10 text-cyan-200 mb-5">
                  <UserRound className="h-12 w-12" />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-100 mb-0.5 tracking-tight">
                  {overview.dashboard_summary?.advisor_name
                    ? overview.dashboard_summary.advisor_name
                    : "Advisor Account"}
                </h2>
                <p className="text-base text-cyan-200 mb-6 font-mono tracking-wide">{currentUser.email}</p>
                <div className="grid grid-cols-2 gap-6 w-full mb-4">
                  <div className="rounded-xl border p-6 flex flex-col items-center" style={{ borderColor: "var(--panel-border)", background: "var(--panel-soft-bg)" }}>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-1">Current Points</p>
                    <p className="text-4xl font-extrabold text-cyan-300 drop-shadow-lg">{overview.dashboard_summary?.current_points ?? 'N/A'}</p>
                  </div>
                  <div className="rounded-xl border p-6 flex flex-col items-center" style={{ borderColor: "var(--panel-border)", background: "var(--panel-soft-bg)" }}>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-1">Current Rank</p>
                    <span className="flex items-center justify-center gap-2 text-3xl font-extrabold drop-shadow-lg" style={{ color: getRankColor(overview.dashboard_summary?.current_rank ?? "") }}>
                      <Trophy className="h-7 w-7" />
                      {overview.dashboard_summary?.current_rank ?? 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border p-6 w-full flex flex-col items-center mb-2" style={{ borderColor: "var(--panel-border)", background: "var(--panel-soft-bg)" }}>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-1">Next Rank</p>
                  <p
                    className="text-2xl font-bold mb-0.5"
                    style={{
                      color: overview.dashboard_summary?.is_highest_rank
                        ? "var(--text-h)"
                        : getRankColor(overview.dashboard_summary?.next_rank ?? ""),
                    }}
                  >
                    {overview.dashboard_summary?.is_highest_rank ? 'No next rank' : (overview.dashboard_summary?.next_rank || 'N/A')}
                  </p>
                  <p className="text-xs text-slate-400">Points to next rank: <span className="font-bold text-cyan-200">{overview.dashboard_summary?.is_highest_rank ? '-' : (overview.dashboard_summary?.points_to_next_rank ?? '-')}</span></p>
                </div>
                {/* AI Coach Section in Advisor Account */}
                <div className="w-full mt-6 flex flex-col items-center border-t pt-6 rounded-b-2xl" style={{ borderColor: "var(--panel-border)", background: "var(--panel-soft-bg)" }}>
                  <h3 className="text-xl font-bold text-cyan-100 mb-1 tracking-tight">Meet your AI Coach</h3>
                  <p className="text-base text-slate-300 mb-4">Providing detailed insights regarding improvement possibilities.</p>
                  <a href="/ai-coach" className="inline-block px-6 py-3 rounded-lg bg-cyan-500 text-slate-900 font-bold text-lg hover:bg-cyan-400 transition-colors shadow">Go to AI Coach</a>
                </div>
              </Card>
              {/* Card mare cu cele 3 secțiuni */}
              <Card className="flex flex-col justify-between p-8 shadow-xl rounded-2xl min-h-[420px] h-full" style={{ background: "var(--summary-bg)", borderColor: "var(--card-border)" }}>
                {/* Rank Progress */}
                <div className="pb-10 mb-8 border-b mt-2" style={{ borderColor: "var(--panel-border)" }}>
                  <h3 className="text-lg font-semibold text-cyan-100 mb-2">Rank Progress</h3>
                  <div className="flex flex-col gap-2 mb-2">
                    <div className="flex justify-between text-xs">
                      <span style={{ color: getRankColor(overview.rank_progress?.current_rank ?? "") }}>
                        {overview.rank_progress?.current_rank ?? '-'}
                      </span>
                      <span style={{ color: getRankColor(overview.rank_progress?.next_rank ?? "") }}>
                        {overview.rank_progress?.next_rank ?? '-'}
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "var(--panel-subtle-bg)" }}>
                      <div className="h-full bg-cyan-400" style={{ width: `${overview.rank_progress?.progress_percentage ?? 0}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{overview.rank_progress?.current_points ?? '-'}</span>
                      <span>{overview.rank_progress?.next_rank_min_points ?? '-'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 mt-2">
                    <span className="text-xs text-slate-400">Progress: <span className="font-bold text-cyan-200">{overview.rank_progress?.progress_percentage ?? '-'}%</span></span>
                    <span className="text-xs text-slate-400">Points to next rank: <span className="font-bold text-cyan-200">{overview.rank_progress?.points_to_next_rank ?? '-'}</span></span>
                  </div>
                </div>
                {/* Team Comparison */}
                <div className="pb-10 mb-8 border-b" style={{ borderColor: "var(--panel-border)" }}>
                  <h3 className="text-lg font-semibold text-cyan-100 mb-2">Team Comparison</h3>
                  <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4">
                      <span className="text-xs text-slate-400">Points vs Team Avg</span>
                      <span className="text-right text-lg font-bold text-cyan-200">
                        {overview.team_comparison?.comparison_to_team_average ? toTitleCase(overview.team_comparison.comparison_to_team_average) : '-'}
                        {typeof overview.team_comparison?.points_difference_from_average === 'number' && (
                          <span className={overview.team_comparison.points_difference_from_average >= 0 ? "text-green-400" : "text-rose-400"}>
                            {` (${overview.team_comparison.points_difference_from_average >= 0 ? '+' : ''}${overview.team_comparison.points_difference_from_average})`}
                          </span>
                        )}
                      </span>
                    </div>

                    <div
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 border-t pt-2"
                      style={{ borderColor: "var(--panel-border)" }}
                    >
                      <span className="text-xs text-slate-400">Team Avg</span>
                      <span className="text-right text-sm font-bold text-cyan-200">{overview.team_comparison?.team_average_points ?? '-'}</span>
                    </div>
                  </div>
                </div>
                {/* Team Position Summary */}
                <div className="mt-2 flex flex-col items-start text-left">
                  <h3 className="text-lg font-semibold text-cyan-100 mb-2">Team Position Summary</h3>
                  <div
                    className="w-full overflow-hidden rounded-2xl border"
                    style={{ borderColor: "var(--panel-border)", background: "var(--panel-soft-bg)" }}
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4">
                      <div className="px-3 py-3 sm:px-4 sm:py-4" style={{ borderRight: "1px solid var(--panel-border)", borderBottom: "1px solid var(--panel-border)" }}>
                        <p className="text-[11px] font-semibold leading-tight text-slate-400">Your Position</p>
                        <p className="mt-1 text-2xl font-extrabold leading-none text-cyan-200">
                          {overview.chart_data && overview.chart_data.team_position_summary && overview.chart_data.team_position_summary.team_position != null ? overview.chart_data.team_position_summary.team_position : '-'}
                        </p>
                      </div>
                      <div className="px-3 py-3 sm:px-4 sm:py-4" style={{ borderBottom: "1px solid var(--panel-border)" }}>
                        <p className="text-[11px] font-semibold leading-tight text-slate-400">Total Advisors</p>
                        <p className="mt-1 text-2xl font-extrabold leading-none text-cyan-200">
                          {overview.chart_data && overview.chart_data.team_position_summary && overview.chart_data.team_position_summary.total_sales_advisors != null ? overview.chart_data.team_position_summary.total_sales_advisors : '-'}
                        </p>
                      </div>
                      <div className="px-3 py-3 sm:px-4 sm:py-4" style={{ borderRight: "1px solid var(--panel-border)" }}>
                        <p className="text-[11px] font-semibold leading-tight text-slate-400">Advisors Ahead of You</p>
                        <p className="mt-1 text-2xl font-extrabold leading-none text-cyan-200">
                          {overview.chart_data && overview.chart_data.team_position_summary && overview.chart_data.team_position_summary.advisors_ahead != null ? overview.chart_data.team_position_summary.advisors_ahead : '-'}
                        </p>
                      </div>
                      <div className="px-3 py-3 sm:px-4 sm:py-4">
                        <p className="text-[11px] font-semibold leading-tight text-slate-400">Advisors Behind You</p>
                        <p className="mt-1 text-2xl font-extrabold leading-none text-cyan-200">
                          {overview.chart_data && overview.chart_data.team_position_summary && overview.chart_data.team_position_summary.advisors_behind != null ? overview.chart_data.team_position_summary.advisors_behind : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </section>
            {/* Charts Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-0">
              {/* Personal Points vs Team Average Chart */}
              <Card className="flex flex-col p-6 shadow-xl rounded-2xl min-h-[340px]" style={{ background: "var(--summary-bg)", borderColor: "var(--card-border)" }}>
                <h3 className="text-lg font-semibold text-cyan-100 mb-2">Personal Points vs Team Average</h3>
                <p className="text-sm text-slate-400 mb-4">Personal points trend vs team average</p>
                <div className="flex-1 min-h-[220px]">
                  <PersonalPointsVsTeamAverageChart
                    data={overview.chart_data?.personal_points_vs_team_average ?? []}
                  />
                </div>
              </Card>
              {/* Rank Progress Chart */}
              <Card className="flex flex-col p-6 shadow-xl rounded-2xl min-h-[340px]" style={{ background: "var(--summary-bg)", borderColor: "var(--card-border)" }}>
                <h3 className="text-lg font-semibold text-cyan-100 mb-2">Rank Progress Chart</h3>
                <p className="text-sm text-slate-400 mb-4">Progress toward the next rank</p>
                <div className="flex-1 min-h-[220px]">
                  <RankProgressChart
                    data={overview.chart_data?.rank_progress_toward_next_rank!}
                  />
                </div>
              </Card>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}