export type LeaderboardInterval = "day" | "week" | "month" | "all";
export type LeaderboardSortBy =
  | "points"
  | "first_name"
  | "last_name"
  | "email"
  | "position";
export type LeaderboardSortDir = "asc" | "desc";

export type LeaderboardQuery = {
  interval: LeaderboardInterval;
  q?: string;
  sortBy: LeaderboardSortBy;
  sortDir: LeaderboardSortDir;
  page: number;
  pageSize: number;
};

export type LeaderboardItem = {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: string;
  tier: string;
  points: number;
  position: number;
  performance_pct: number;
  avatar_initials: string;
  medal: "gold" | "silver" | "bronze" | null;
};

export type LeaderboardPagination = {
  total_items: number;
  total_pages: number;
  page: number;
  page_size: number;
};

export type LeaderboardSummary = {
  top_advisor: {
    user_id: number;
    full_name: string;
    points: number;
  } | null;
  total_advisors: number;
  average_points: number;
  total_points: number;
};

export type LeaderboardResponse = {
  items: LeaderboardItem[];
  pagination: LeaderboardPagination;
  summary: LeaderboardSummary;
};

const API_BASE_URL = "http://localhost:8000";

function getCurrentUserId(): number {
  const raw = localStorage.getItem("currentUser");
  if (!raw) throw new Error("No logged in user found.");

  const parsed = JSON.parse(raw) as { user_id?: number };
  if (!parsed?.user_id) throw new Error("Invalid current user.");

  return parsed.user_id;
}

export async function getLeaderboard(
  query: LeaderboardQuery
): Promise<LeaderboardResponse> {
  const userId = getCurrentUserId();

  const params = new URLSearchParams({
    interval: query.interval,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
    page: String(query.page),
    pageSize: String(query.pageSize),
  });

  if (query.q && query.q.trim()) {
    params.set("q", query.q.trim());
  }

  const response = await fetch(
    `${API_BASE_URL}/api/manager/dashboard/leaderboard?${params.toString()}`,
    {
      method: "GET",
      headers: {
        "X-User-Id": String(userId),
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Failed to fetch leaderboard.");
  }

  return response.json();
}

export type LeaderboardSummaryCompareResponse = {
  interval: LeaderboardInterval;
  comparison_label: string;
  top_advisor: {
    user_id: number;
    full_name: string;
    points: number;
  } | null;
  total_advisors: number;
  average_points_current: number;
  average_points_previous: number;
  average_points_delta_pct: number | null;
  total_points_current: number;
  total_points_previous: number;
  total_points_delta_pct: number | null;
};

export async function getLeaderboardSummary(
  interval: LeaderboardInterval
): Promise<LeaderboardSummaryCompareResponse> {
  const userId = getCurrentUserId();

  const response = await fetch(
    `${API_BASE_URL}/api/manager/dashboard/leaderboard/summary?interval=${interval}`,
    {
      method: "GET",
      headers: {
        "X-User-Id": String(userId),
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Failed to fetch leaderboard summary.");
  }

  return response.json();
}