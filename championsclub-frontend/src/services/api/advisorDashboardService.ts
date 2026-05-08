import axiosInstance from './axiosInstance';

export interface AdvisorDashboardOverview {
  dashboard_summary?: {
    user_id: number;
    current_points: number;
    current_rank: string;
    next_rank: string | null;
    points_to_next_rank: number | null;
    is_highest_rank: boolean;
    advisor_name?: string | null;
  };
  rank_progress?: {
    current_rank: string;
    current_rank_min_points: number;
    next_rank: string | null;
    next_rank_min_points: number | null;
    current_points: number;
    points_to_next_rank: number | null;
    progress_percentage: number;
    is_highest_rank: boolean;
  };
  team_comparison?: {
    team_average_points: number | null;
    comparison_to_team_average: "above" | "below" | "equal" | null;
    points_difference_from_average: number | null;
    team_position: number | null;
    total_sales_advisors: number | null;
  } | null;
  personal_points_vs_team_average?: { label: string; points: number }[];
  rank_progress_toward_next_rank?: {
    label: string;
    current_points: number;
    start_points: number;
    target_points: number;
    progress_percentage: number;
    remaining_points: number;
  };
  team_position_summary?: {
    team_position: number;
    total_sales_advisors: number;
    advisors_ahead: number;
    advisors_behind: number;
  };
  chart_data?: {
    personal_points_vs_team_average?: { label: string; points: number }[];
    rank_progress_toward_next_rank?: {
      label: string;
      current_points: number;
      start_points: number;
      target_points: number;
      progress_percentage: number;
      remaining_points: number;
    };
    team_position_summary?: {
      team_position: number;
      total_sales_advisors: number;
      advisors_ahead: number;
      advisors_behind: number;
    };
  };
}

export async function getAdvisorDashboardOverview(userId: number): Promise<AdvisorDashboardOverview> {
  const res = await axiosInstance.get('/api/sales-advisor/dashboard/overview', {
    headers: { 'x-user-id': userId }
  });
  return res.data;
}
