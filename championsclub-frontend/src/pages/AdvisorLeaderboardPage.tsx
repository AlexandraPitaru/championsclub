import { useEffect, useMemo, useState } from "react";
import {
  Award,
  Crown,
  Globe2,
  Medal,
  RefreshCw,
  Target,
  Users,
} from "lucide-react";
import AppShell from "../app/layouts/AppShell";
import Card from "../components/ui/Card";
import {
  getAdvisorLeaderboard,
  getAdvisorLeaderboardMyPosition,
  type AdvisorLeaderboardEntry,
  type AdvisorLeaderboardMyPositionResponse,
  type AdvisorLeaderboardResponse,
  type AdvisorLeaderboardScope,
} from "../services/api/advisorLeaderboardService";

type StoredUser = {
  user_id?: number;
  role?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
};

const limitOptions = [5, 10, 20];

function getCurrentUserFromStorage(): StoredUser | null {
  const currentUserRaw = localStorage.getItem("currentUser");
  if (!currentUserRaw) return null;

  try {
    return JSON.parse(currentUserRaw) as StoredUser;
  } catch {
    return null;
  }
}

function getRankBadgeSrc(position: number): string | null {
  if (position === 1) return "/rank-badges/rank-1.svg";
  if (position === 2) return "/rank-badges/rank-2.svg";
  if (position === 3) return "/rank-badges/rank-3.svg";
  return null;
}

function getInitials(entry: AdvisorLeaderboardEntry): string {
  return `${entry.first_name?.[0] ?? ""}${entry.last_name?.[0] ?? ""}`.toUpperCase() || "AD";
}

function getFullName(entry: AdvisorLeaderboardEntry): string {
  return `${entry.first_name} ${entry.last_name}`.trim();
}

function rankClasses(rank: string) {
  const normalizedRank = rank.toLowerCase();

  if (normalizedRank === "gold") return "border-amber-500/30 bg-amber-500/20 text-amber-300";
  if (normalizedRank === "silver") return "border-slate-400/30 bg-slate-500/20 text-slate-200";
  if (normalizedRank === "bronze") return "border-orange-500/30 bg-orange-500/20 text-orange-300";
  return "border-cyan-500/25 bg-cyan-500/15 text-cyan-200";
}

function positionColor(position: number) {
  if (position === 1) return "bg-amber-500";
  if (position <= 3) return "bg-blue-500";
  return "bg-cyan-500";
}

function scopeLabel(scope: AdvisorLeaderboardScope) {
  return scope === "team" ? "Team" : "Global";
}

function getProgressWidth(points: number, maxPoints: number): number {
  if (maxPoints <= 0) return 0;
  return Math.max(6, Math.round((points / maxPoints) * 100));
}

export default function AdvisorLeaderboardPage() {
  const currentUser = useMemo(getCurrentUserFromStorage, []);
  const userId = currentUser?.user_id;
  const isAdvisor = currentUser?.role?.toLowerCase() === "sales_advisor";

  const [scope, setScope] = useState<AdvisorLeaderboardScope>("team");
  const [limit, setLimit] = useState(10);
  const [leaderboard, setLeaderboard] = useState<AdvisorLeaderboardResponse | null>(null);
  const [myPosition, setMyPosition] = useState<AdvisorLeaderboardMyPositionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (!userId || !isAdvisor) return;

    let cancelled = false;

    async function loadAdvisorLeaderboard() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const [leaderboardResponse, myPositionResponse] = await Promise.all([
          getAdvisorLeaderboard(userId, scope, limit),
          getAdvisorLeaderboardMyPosition(userId, scope),
        ]);

        if (cancelled) return;

        setLeaderboard(leaderboardResponse);
        setMyPosition(myPositionResponse);
      } catch (error) {
        if (cancelled) return;
        setLeaderboard(null);
        setMyPosition(null);
        setErrorMessage(error instanceof Error ? error.message : "Failed to load advisor leaderboard.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadAdvisorLeaderboard();

    return () => {
      cancelled = true;
    };
  }, [userId, isAdvisor, scope, limit, refreshToken]);

  const entries = leaderboard?.leaderboard_list ?? [];
  const topAdvisor = entries[0] ?? null;
  const currentUserEntry = leaderboard?.current_user ?? null;
  const currentUserPosition = leaderboard?.current_user_position ?? null;
  const currentUserIsInList =
    typeof currentUserPosition === "number" &&
    entries.some((entry) => entry.position === currentUserPosition);
  const showCurrentUserSpot = Boolean(currentUserEntry && !currentUserIsInList);
  const maxPoints = Math.max(
    0,
    ...entries.map((entry) => entry.points),
    currentUserEntry?.points ?? 0,
    myPosition?.points ?? 0
  );
  const advisorsAhead = myPosition ? Math.max(myPosition.position - 1, 0) : 0;
  const advisorsBehind = myPosition ? Math.max(myPosition.total_users - myPosition.position, 0) : 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-cyan-100">Advisor Leaderboard</h1>
            <p className="mt-2 text-slate-400">
              See where you stand against your peers and track the points race.
            </p>
          </div>
        </section>

        {!currentUser ? (
          <Card className="border border-rose-500/40 bg-rose-500/10">
            <h2 className="text-lg font-semibold text-rose-200">Session not found</h2>
            <p className="mt-2 text-sm text-rose-100/90">
              The advisor leaderboard requires an authenticated sales advisor session.
            </p>
          </Card>
        ) : null}

        {currentUser && !isAdvisor ? (
          <Card className="border border-rose-500/40 bg-rose-500/10">
            <h2 className="text-lg font-semibold text-rose-200">Advisor access required</h2>
            <p className="mt-2 text-sm text-rose-100/90">
              This leaderboard is built for sales advisor accounts.
            </p>
          </Card>
        ) : null}

        {isAdvisor ? (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card
                className="flex items-center gap-4"
                style={{ background: "var(--summary-bg)", borderColor: "var(--summary-border)" }}
              >
                <div className="rounded-full bg-cyan-500/20 p-3 text-cyan-300">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Your Position</p>
                  <p className="text-3xl font-bold text-cyan-100">
                    {myPosition ? `#${myPosition.position}` : "-"}
                  </p>
                  <p className="text-sm text-slate-400">
                    {myPosition ? `of ${myPosition.total_users} ${scopeLabel(scope).toLowerCase()} advisors` : scopeLabel(scope)}
                  </p>
                </div>
              </Card>

              <Card
                className="flex items-center gap-4"
                style={{ background: "var(--panel-bg)", borderColor: "var(--panel-border)" }}
              >
                <div className="rounded-full bg-amber-500/20 p-3 text-amber-400">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Your Points</p>
                  <p className="text-3xl font-bold text-cyan-100">
                    {myPosition ? myPosition.points.toLocaleString() : 0}
                  </p>
                  <p className="text-sm text-slate-400">Current rank: {myPosition?.rank ?? "-"}</p>
                </div>
              </Card>

              <Card
                className="flex items-center gap-4"
                style={{ background: "var(--panel-bg)", borderColor: "var(--panel-border)" }}
              >
                <div className="rounded-full bg-blue-500/20 p-3 text-blue-400">
                  {scope === "team" ? <Users className="h-5 w-5" /> : <Globe2 className="h-5 w-5" />}
                </div>
                <div>
                  <p className="text-sm text-slate-400">{scopeLabel(scope)} Advisors</p>
                  <p className="text-3xl font-bold text-cyan-100">{myPosition?.total_users ?? 0}</p>
                  <p className="text-sm text-slate-400">
                    {advisorsAhead} ahead, {advisorsBehind} behind
                  </p>
                </div>
              </Card>

              <Card
                className="flex items-center gap-4"
                style={{ background: "var(--panel-bg)", borderColor: "var(--panel-border)" }}
              >
                <div className="rounded-full bg-violet-500/20 p-3 text-violet-400">
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Top Advisor</p>
                  <p className="font-semibold text-cyan-100">
                    {topAdvisor ? getFullName(topAdvisor) : "-"}
                  </p>
                  <p className="text-sm font-semibold text-slate-300">
                    {topAdvisor ? `${topAdvisor.points.toLocaleString()} pts` : "No data yet"}
                  </p>
                </div>
              </Card>
            </section>

            <Card
              className="overflow-hidden p-0"
              style={{ background: "var(--panel-bg)", borderColor: "var(--panel-border)" }}
            >
              <div
                className="flex flex-col gap-4 border-b p-4"
                style={{ borderColor: "var(--panel-border)" }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-cyan-100">{scopeLabel(scope)} Standings</h2>
                    <p className="text-sm text-slate-400">
                      Ranked by total points.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setRefreshToken((current) => current + 1)}
                    disabled={isLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold text-cyan-100 transition disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ borderColor: "var(--panel-border)", background: "var(--panel-subtle-bg)" }}
                  >
                    <RefreshCw className={["h-4 w-4", isLoading ? "animate-spin" : ""].join(" ")} />
                    Refresh
                  </button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-2">
                    {(["team", "global"] as AdvisorLeaderboardScope[]).map((option) => {
                      const isSelected = scope === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setScope(option)}
                          className={[
                            "min-w-[80px] rounded-lg border px-3 py-1.5 text-sm font-semibold capitalize transition",
                            isSelected ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-100 shadow-[0_0_12px_rgba(6,182,212,0.15)]" : "text-slate-300 hover:border-cyan-500/30 hover:text-cyan-100",
                          ].join(" ")}
                          style={
                            isSelected
                              ? undefined
                              : { borderColor: "var(--panel-border)", background: "var(--panel-subtle-bg)" }
                          }
                        >
                          {option === "team" ? <Users className="inline h-3.5 w-3.5 mr-1" /> : <Globe2 className="inline h-3.5 w-3.5 mr-1" />}
                          {option}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={limit}
                      onChange={(event) => setLimit(Number(event.target.value))}
                      className="rounded-lg border px-3 py-1.5 text-sm font-medium text-slate-200 outline-none transition focus:border-cyan-500/60"
                      style={{ borderColor: "var(--panel-border)", background: "var(--panel-subtle-bg)" }}
                    >
                      {limitOptions.map((option) => (
                        <option key={option} value={option}>
                          Top {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {errorMessage ? (
                <div className="border-b p-4 text-sm text-rose-300" style={{ borderColor: "var(--panel-border)" }}>
                  {errorMessage}
                </div>
              ) : null}

              <div className="divide-y" style={{ borderColor: "var(--panel-border)" }}>
                {isLoading && entries.length === 0 ? (
                  <div className="space-y-3 p-4">
                    {[88, 74, 66, 52].map((width) => (
                      <div
                        key={width}
                        className="h-12 animate-pulse rounded-xl bg-slate-500/20"
                        style={{ width: `${width}%` }}
                      />
                    ))}
                  </div>
                ) : null}

                {!isLoading && entries.length === 0 && !errorMessage ? (
                  <div className="p-8 text-center text-sm text-slate-400">
                    No leaderboard data available for this scope.
                  </div>
                ) : null}

                {entries.map((entry) => {
                  const isCurrentUser = entry.position === currentUserPosition;
                  const badgeSrc = getRankBadgeSrc(entry.position);
                  const progressWidth = getProgressWidth(entry.points, maxPoints);

                  return (
                    <div
                      key={`${entry.position}-${entry.first_name}-${entry.last_name}`}
                      className={[
                        "grid gap-4 p-4 transition sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center",
                        isCurrentUser ? "bg-cyan-500/10" : "",
                      ].join(" ")}
                      style={isCurrentUser ? undefined : { background: "var(--panel-bg)" }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10 text-sm font-bold text-cyan-100">
                          {badgeSrc ? (
                            <img src={badgeSrc} alt={`Position ${entry.position}`} className="h-5 w-auto" />
                          ) : (
                            `#${entry.position}`
                          )}
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white">
                          {getInitials(entry)}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-cyan-100">{getFullName(entry)}</p>
                          {isCurrentUser ? (
                            <span className="rounded-full border border-cyan-500/35 bg-cyan-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-cyan-200">
                              You
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="h-2 w-full max-w-xs rounded-full" style={{ background: "var(--panel-subtle-bg)" }}>
                            <div
                              className={["h-2 rounded-full", positionColor(entry.position)].join(" ")}
                              style={{ width: `${progressWidth}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-400">{progressWidth}%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 sm:justify-end sm:text-right">
                        <span className={["inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", rankClasses(entry.rank)].join(" ")}>
                          {entry.rank}
                        </span>
                        <div>
                          <p className="text-lg font-bold text-cyan-100">{entry.points.toLocaleString()}</p>
                          <p className="text-xs text-slate-400">points</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {showCurrentUserSpot && currentUserEntry ? (
              <Card
                className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                style={{ background: "var(--summary-bg)", borderColor: "var(--summary-border)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-cyan-500/15 p-3 text-cyan-300">
                    <Medal className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-cyan-100">Your spot outside the visible top list</p>
                    <p className="text-sm text-slate-400">
                      You are #{currentUserEntry.position} in the {scopeLabel(scope).toLowerCase()} leaderboard.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 sm:text-right">
                  <span className={["inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", rankClasses(currentUserEntry.rank)].join(" ")}>
                    {currentUserEntry.rank}
                  </span>
                  <div>
                    <p className="text-2xl font-bold text-cyan-100">{currentUserEntry.points.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">points</p>
                  </div>
                </div>
              </Card>
            ) : null}
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
