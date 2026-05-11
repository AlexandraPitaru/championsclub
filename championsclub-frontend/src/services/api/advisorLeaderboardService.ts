import axiosInstance from "./axiosInstance";

export type AdvisorLeaderboardScope = "team" | "global";

export interface AdvisorLeaderboardEntry {
  position: number;
  first_name: string;
  last_name: string;
  points: number;
  rank: string;
}

export interface AdvisorLeaderboardResponse {
  leaderboard_list: AdvisorLeaderboardEntry[];
  current_user_position: number | null;
  current_user: AdvisorLeaderboardEntry | null;
}

export interface AdvisorLeaderboardMyPositionResponse {
  position: number;
  total_users: number;
  points: number;
  rank: string;
}

function buildHeaders(userId: number) {
  return { headers: { "x-user-id": userId } };
}

export async function getAdvisorLeaderboard(
  userId: number,
  scope: AdvisorLeaderboardScope,
  limit: number
): Promise<AdvisorLeaderboardResponse> {
  const response = await axiosInstance.get("/api/sales-advisor/leaderboard", {
    ...buildHeaders(userId),
    params: { scope, limit },
  });

  return response.data;
}

export async function getAdvisorLeaderboardMyPosition(
  userId: number,
  scope: AdvisorLeaderboardScope
): Promise<AdvisorLeaderboardMyPositionResponse> {
  const response = await axiosInstance.get("/api/sales-advisor/leaderboard/my-position", {
    ...buildHeaders(userId),
    params: { scope },
  });

  return response.data;
}
