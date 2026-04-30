import { useEffect, useMemo, useState } from "react";
import AppShell from "../app/layouts/AppShell";
import Card from "../components/ui/Card";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crown,
  Search,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  getLeaderboard,
  getLeaderboardSummary,
  type LeaderboardItem,
  type LeaderboardInterval,
  type LeaderboardSortBy,
  type LeaderboardSortDir,
} from "../services/api/dashboardService";

const medalIcon: Record<"gold" | "silver" | "bronze", string> = {
  gold: "🥇",
  silver: "🥈",
  bronze: "🥉",
};

function tierClasses(tier: string) {
  if (tier === "Gold") return "bg-amber-100 text-amber-700";
  if (tier === "Silver") return "bg-slate-200 text-slate-700";
  if (tier === "Bronze") return "bg-orange-100 text-orange-700";
  return "bg-slate-100 text-slate-700";
}

function progressColor(position: number) {
  if (position === 1) return "bg-amber-500";
  if (position <= 3) return "bg-blue-500";
  return "bg-sky-500";
}

export default function LeaderboardPage() {
  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [topAdvisorName, setTopAdvisorName] = useState("-");
  const [topAdvisorPoints, setTopAdvisorPoints] = useState(0);
  const [averagePoints, setAveragePoints] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);

  const [interval, setInterval] = useState<LeaderboardInterval>("week");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<LeaderboardSortBy>("points");
  const [sortDir, setSortDir] = useState<LeaderboardSortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [comparisonLabel, setComparisonLabel] = useState("");
  const [averageDeltaPct, setAverageDeltaPct] = useState<number | null>(null);
  const [averagePointsPrev, setAveragePointsPrev] = useState<number | null>(null);
  const [totalDeltaPct, setTotalDeltaPct] = useState<number | null>(null);
  const [totalPointsPrev, setTotalPointsPrev] = useState<number | null>(null);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearchQuery(searchInput.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    async function loadLeaderboard() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const [listResponse, summaryResponse] = await Promise.all([
          getLeaderboard({
            interval,
            q: searchQuery || undefined,
            sortBy,
            sortDir,
            page,
            pageSize,
          }),
          getLeaderboardSummary(interval),
        ]);

        if (cancelled) return;

        setItems(listResponse.items);
        setTotalItems(summaryResponse.total_advisors);
        setTotalPages(Math.max(1, listResponse.pagination.total_pages));
        setAveragePoints(Math.round(summaryResponse.average_points_current));
        setTotalPoints(summaryResponse.total_points_current);
        setComparisonLabel(summaryResponse.comparison_label);
        setAverageDeltaPct(summaryResponse.average_points_delta_pct);
        setAveragePointsPrev(Math.round(summaryResponse.average_points_previous));
        setTotalDeltaPct(summaryResponse.total_points_delta_pct);
        setTotalPointsPrev(summaryResponse.total_points_previous);

        if (summaryResponse.top_advisor) {
          setTopAdvisorName(summaryResponse.top_advisor.full_name);
          setTopAdvisorPoints(summaryResponse.top_advisor.points);
        } else {
          setTopAdvisorName("-");
          setTopAdvisorPoints(0);
        }
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load leaderboard."
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadLeaderboard();

    return () => {
      cancelled = true;
    };
  }, [interval, searchQuery, sortBy, sortDir, page, pageSize]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const sortLabel = useMemo(() => {
    if (sortBy === "points")
      return sortDir === "desc" ? "Points (High to Low)" : "Points (Low to High)";
    if (sortBy === "first_name")
      return sortDir === "asc" ? "First Name (A-Z)" : "First Name (Z-A)";
    if (sortBy === "last_name")
      return sortDir === "asc" ? "Last Name (A-Z)" : "Last Name (Z-A)";
    if (sortBy === "email")
      return sortDir === "asc" ? "Email (A-Z)" : "Email (Z-A)";
    return sortDir === "asc" ? "Position (1-N)" : "Position (N-1)";
  }, [sortBy, sortDir]);

  function togglePointSort() {
    setPage(1);
    setSortBy("points");
    setSortDir((prev) => (prev === "desc" ? "asc" : "desc"));
  }

  function formatDelta(
    delta: number | null,
    label: string,
    prevValue: number | null,
    unit: string
  ): string | null {
    if (delta === null || !label) return null;
    const sign = delta > 0 ? "+" : "";
    const prevStr = prevValue !== null ? ` (prev: ${prevValue.toLocaleString()} ${unit})` : "";
    return `${sign}${delta.toFixed(1)}% ${label}${prevStr}`;
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section>
          <h1 className="text-3xl font-bold text-slate-900">Leaderboard</h1>
          <p className="mt-2 text-slate-600">
            Track advisor performance and ranking
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="flex items-center gap-4">
            <div className="rounded-full bg-amber-100 p-3 text-amber-600">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Top Advisor</p>
              <p className="font-semibold text-slate-900">{topAdvisorName}</p>
              <p className="text-sm font-semibold text-slate-700">
                {topAdvisorPoints} pts
              </p>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="rounded-full bg-blue-100 p-3 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Advisors</p>
              <p className="text-3xl font-bold text-slate-900">{totalItems}</p>
              <p className="text-sm text-slate-500">Across your team</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="rounded-full bg-emerald-100 p-3 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Average Points</p>
              <p className="text-3xl font-bold text-slate-900">{averagePoints} pts</p>
              {formatDelta(averageDeltaPct, comparisonLabel, averagePointsPrev, "pts") ? (
                <p className={"text-sm font-medium " + ((averageDeltaPct ?? 0) >= 0 ? "text-emerald-600" : "text-red-600")}>
                  {formatDelta(averageDeltaPct, comparisonLabel, averagePointsPrev, "pts")}
                </p>
              ) : null}
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="rounded-full bg-violet-100 p-3 text-violet-600">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Points</p>
              <p className="text-3xl font-bold text-slate-900">
                {totalPoints.toLocaleString()} pts
              </p>
              {formatDelta(totalDeltaPct, comparisonLabel, totalPointsPrev, "pts") ? (
                <p className={"text-sm font-medium " + ((totalDeltaPct ?? 0) >= 0 ? "text-emerald-600" : "text-red-600")}>
                  {formatDelta(totalDeltaPct, comparisonLabel, totalPointsPrev, "pts")}
                </p>
              ) : null}
            </div>
          </Card>
        </section>

        <Card className="overflow-hidden p-0">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
            <label className="flex w-full max-w-md items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-500">
              <Search className="h-4 w-4" />
              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search advisor by name or email..."
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </label>

            <div className="flex items-center gap-2">
              <select
                value={interval}
                onChange={(e) => {
                  setPage(1);
                  setInterval(e.target.value as LeaderboardInterval);
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="all">All</option>
              </select>

              <button
                onClick={togglePointSort}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              >
                Sort by: {sortLabel}
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          {errorMessage ? (
            <div className="p-4 text-sm text-red-600">{errorMessage}</div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="min-w-[820px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-6 py-3 font-semibold">#</th>
                  <th className="px-6 py-3 font-semibold">Advisor</th>
                  <th className="px-6 py-3 font-semibold">Rank</th>
                  <th className="px-6 py-3 font-semibold">Points</th>
                  <th className="px-6 py-3 font-semibold">Performance</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {!isLoading && items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      No advisors found.
                    </td>
                  </tr>
                ) : null}

                {items.map((row) => (
                  <tr
                    key={row.user_id}
                    className={row.position === 1 ? "bg-amber-50/70" : "bg-white"}
                  >
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        {row.medal ? (
                          <span className="text-base" aria-hidden="true">
                            {medalIcon[row.medal]}
                          </span>
                        ) : null}
                        <span>{row.position}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                          {row.avatar_initials}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {row.first_name} {row.last_name}
                          </p>
                          <p className="text-xs text-slate-500">{row.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={
                          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold " +
                          tierClasses(row.tier)
                        }
                      >
                        {row.tier}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {row.points} pts
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="w-10 font-medium text-slate-700">
                          {row.performance_pct}%
                        </span>
                        <div className="h-2 w-40 rounded-full bg-slate-100">
                          <div
                            className={"h-2 rounded-full " + progressColor(row.position)}
                            style={{ width: row.performance_pct + "%" }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-center gap-2 border-t border-slate-200 p-4">
            <button
              disabled={!canPrev || isLoading}
              onClick={() => canPrev && setPage((prev) => prev - 1)}
              className="rounded-md border border-slate-300 p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white">
              {page}
            </button>

            <span className="px-2 text-sm text-slate-500">/ {totalPages}</span>

            <button
              disabled={!canNext || isLoading}
              onClick={() => canNext && setPage((prev) => prev + 1)}
              className="rounded-md border border-slate-300 p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}