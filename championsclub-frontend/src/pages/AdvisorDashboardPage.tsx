import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAdvisorDashboardOverview } from "../services/hooks/useAdvisorDashboardOverview";
import { Trophy, UserRound } from "lucide-react";
import AppShell from "../app/layouts/AppShell";
import Card from "../components/ui/Card";

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

export default function AdvisorDashboardPage() {
  const currentUser = useMemo(getCurrentUserFromStorage, []);
  const isAdvisor = currentUser?.role?.toLowerCase() === "sales_advisor";
  const userId = currentUser?.user_id;
  const { data: overview, isLoading, isError } = useAdvisorDashboardOverview(userId);

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
              <Card className="flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-[#0d1a2b] to-[#16243a] border border-[#23364b] shadow-xl rounded-2xl min-h-[420px] h-full">
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
                  <div className="rounded-xl border border-[#29405b] bg-[#081322] p-6 flex flex-col items-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-1">Current Points</p>
                    <p className="text-4xl font-extrabold text-cyan-300 drop-shadow-lg">{overview.dashboard_summary?.current_points ?? 'N/A'}</p>
                  </div>
                  <div className="rounded-xl border border-[#29405b] bg-[#081322] p-6 flex flex-col items-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-1">Current Rank</p>
                    <span className="flex items-center justify-center gap-2 text-3xl font-extrabold text-amber-300 drop-shadow-lg">
                      <Trophy className="h-7 w-7" />
                      {overview.dashboard_summary?.current_rank ?? 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border border-[#29405b] bg-[#081322] p-6 w-full flex flex-col items-center mb-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-1">Next Rank</p>
                  <p className="text-2xl font-bold text-slate-100 mb-0.5">{overview.dashboard_summary?.is_highest_rank ? 'No next rank' : (overview.dashboard_summary?.next_rank || 'N/A')}</p>
                  <p className="text-xs text-slate-400">Points to next rank: <span className="font-bold text-cyan-200">{overview.dashboard_summary?.is_highest_rank ? '-' : (overview.dashboard_summary?.points_to_next_rank ?? '-')}</span></p>
                </div>
                {/* AI Coach Section in Advisor Account */}
                <div className="w-full mt-6 flex flex-col items-center border-t border-[#23364b] pt-6 bg-[#11213a] rounded-b-2xl">
                  <h3 className="text-xl font-bold text-cyan-100 mb-1 tracking-tight">Meet your AI Coach</h3>
                  <p className="text-base text-slate-300 mb-4">Providing detailed insights regarding improvement possibilities.</p>
                  <a href="/ai-coach" className="inline-block px-6 py-3 rounded-lg bg-cyan-500 text-slate-900 font-bold text-lg hover:bg-cyan-400 transition-colors shadow">Go to AI Coach</a>
                </div>
              </Card>
              {/* Card mare cu cele 3 secțiuni */}
              <Card className="flex flex-col justify-between p-8 bg-gradient-to-br from-[#0d1a2b] to-[#16243a] border border-[#23364b] shadow-xl rounded-2xl min-h-[420px] h-full">
                {/* Rank Progress */}
                <div className="pb-10 mb-8 border-b border-[#23364b] mt-2">
                  <h3 className="text-lg font-semibold text-cyan-100 mb-2">Rank Progress</h3>
                  <div className="flex flex-col gap-2 mb-2">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{overview.rank_progress?.current_rank ?? '-'}</span>
                      <span>{overview.rank_progress?.next_rank ?? '-'}</span>
                    </div>
                    <div className="w-full h-3 bg-[#1e293b] rounded-full overflow-hidden">
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
                <div className="pb-10 mb-8 border-b border-[#23364b]">
                  <h3 className="text-lg font-semibold text-cyan-100 mb-2">Team Comparison</h3>
                  <div className="flex flex-col gap-2 mb-2">
                    <span className="text-xs text-slate-400">Points vs Team Avg</span>
                    <span className="text-lg font-bold text-cyan-200">
                      {overview.team_comparison?.comparison_to_team_average ? toTitleCase(overview.team_comparison.comparison_to_team_average) : '-'}
                      {typeof overview.team_comparison?.points_difference_from_average === 'number' && (
                        <span className={overview.team_comparison.points_difference_from_average >= 0 ? "text-green-400" : "text-rose-400"}>
                          {` (${overview.team_comparison.points_difference_from_average >= 0 ? '+' : ''}${overview.team_comparison.points_difference_from_average})`}
                        </span>
                      )}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">Team Avg: <span className="font-bold text-cyan-200">{overview.team_comparison?.team_average_points ?? '-'}</span></span>
                </div>
                {/* Team Position Summary */}
                <div className="mt-2 flex flex-col items-start text-left">
                  <h3 className="text-lg font-semibold text-cyan-100 mb-2">Team Position Summary</h3>
                  <div className="flex flex-row justify-start w-full gap-8 pl-0 ml-0">
                    <div className="flex flex-col items-start w-16">
                      <span className="text-xs font-semibold text-slate-400 mb-1 text-left w-full">Pos</span>
                      <span className="text-2xl font-extrabold text-cyan-200 leading-none text-left w-full">{overview.chart_data && overview.chart_data.team_position_summary && overview.chart_data.team_position_summary.team_position != null ? overview.chart_data.team_position_summary.team_position : '-'}</span>
                    </div>
                    <div className="flex flex-col items-start w-16">
                      <span className="text-xs font-semibold text-slate-400 mb-1 text-left w-full">Team</span>
                      <span className="text-2xl font-extrabold text-cyan-200 leading-none text-left w-full">{overview.chart_data && overview.chart_data.team_position_summary && overview.chart_data.team_position_summary.total_sales_advisors != null ? overview.chart_data.team_position_summary.total_sales_advisors : '-'}</span>
                    </div>
                    <div className="flex flex-col items-start w-16">
                      <span className="text-xs font-semibold text-slate-400 mb-1 text-left w-full">Ahead</span>
                      <span className="text-2xl font-extrabold text-cyan-200 leading-none text-left w-full">{overview.chart_data && overview.chart_data.team_position_summary && overview.chart_data.team_position_summary.advisors_ahead != null ? overview.chart_data.team_position_summary.advisors_ahead : '-'}</span>
                    </div>
                    <div className="flex flex-col items-start w-16">
                      <span className="text-xs font-semibold text-slate-400 mb-1 text-left w-full">Behind</span>
                      <span className="text-2xl font-extrabold text-cyan-200 leading-none text-left w-full">{overview.chart_data && overview.chart_data.team_position_summary && overview.chart_data.team_position_summary.advisors_behind != null ? overview.chart_data.team_position_summary.advisors_behind : '-'}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </section>
            {/* Charts Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-0">
              {/* Personal Points vs Team Average Chart */}
              <Card className="flex flex-col p-6 bg-gradient-to-br from-[#0d1a2b] to-[#16243a] border border-[#23364b] shadow-xl rounded-2xl min-h-[340px]">
                <h3 className="text-lg font-semibold text-cyan-100 mb-2">Personal Points vs Team Average</h3>
                <p className="text-sm text-slate-400 mb-4">Evoluție puncte personale vs media echipei</p>
                <div className="flex-1 min-h-[220px]">
                  {overview.chart_data?.personal_points_vs_team_average && overview.chart_data.personal_points_vs_team_average.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={overview.chart_data.personal_points_vs_team_average} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                        <CartesianGrid stroke="#23364b" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#28415f" }} tickLine={{ stroke: "#28415f" }} />
                        <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#28415f" }} tickLine={{ stroke: "#28415f" }} />
                        <Tooltip contentStyle={{ backgroundColor: "#0c192b", border: "1px solid #2b445f", borderRadius: "12px", color: "#e2e8f0" }} itemStyle={{ color: "#cbd5e1" }} labelStyle={{ color: "#67e8f9" }} />
                        <Area type="monotone" dataKey="points" stroke="#22d3ee" fill="#22d3ee33" strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">No data available.</div>
                  )}
                </div>
              </Card>
              {/* Rank Progress Chart */}
              <Card className="flex flex-col p-6 bg-gradient-to-br from-[#0d1a2b] to-[#16243a] border border-[#23364b] shadow-xl rounded-2xl min-h-[340px]">
                <h3 className="text-lg font-semibold text-cyan-100 mb-2">Rank Progress Chart</h3>
                <p className="text-sm text-slate-400 mb-4">Progres către următorul rank</p>
                <div className="flex-1 min-h-[220px]">
                  {overview.chart_data?.rank_progress_toward_next_rank ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={[overview.chart_data.rank_progress_toward_next_rank]} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                        <CartesianGrid stroke="#23364b" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#28415f" }} tickLine={{ stroke: "#28415f" }} />
                        <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#28415f" }} tickLine={{ stroke: "#28415f" }} />
                        <Tooltip contentStyle={{ backgroundColor: "#0c192b", border: "1px solid #2b445f", borderRadius: "12px", color: "#e2e8f0" }} itemStyle={{ color: "#cbd5e1" }} labelStyle={{ color: "#67e8f9" }} />
                        <Area type="monotone" dataKey="current_points" stroke="#22d3ee" fill="#22d3ee33" strokeWidth={3} />
                        <Area type="monotone" dataKey="target_points" stroke="#f59e0b" fillOpacity={0} strokeWidth={2} />
                        <Area type="monotone" dataKey="start_points" stroke="#a78bfa" fillOpacity={0} strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">No data available.</div>
                  )}
                </div>
              </Card>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}