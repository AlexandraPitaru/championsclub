from typing import Literal

from pydantic import BaseModel


TeamAverageComparison = Literal["above", "below", "equal"]


class DashboardSummaryResponse(BaseModel):
    user_id: int
    current_points: int
    current_rank: str
    next_rank: str | None
    points_to_next_rank: int | None
    is_highest_rank: bool


class RankProgressResponse(BaseModel):
    current_rank: str
    current_rank_min_points: int
    next_rank: str | None
    next_rank_min_points: int | None
    current_points: int
    points_to_next_rank: int | None
    progress_percentage: float
    is_highest_rank: bool


class TeamComparisonResponse(BaseModel):
    team_average_points: float
    comparison_to_team_average: TeamAverageComparison
    points_difference_from_average: float
    team_position: int
    total_sales_advisors: int


class PointsComparisonChartPoint(BaseModel):
    label: str
    points: float


class RankProgressChartData(BaseModel):
    label: str
    current_points: int
    start_points: int
    target_points: int | None
    progress_percentage: float
    remaining_points: int | None


class TeamPositionChartData(BaseModel):
    team_position: int
    total_sales_advisors: int
    advisors_ahead: int
    advisors_behind: int


class SalesAdvisorOverviewChartData(BaseModel):
    personal_points_vs_team_average: list[PointsComparisonChartPoint] | None
    rank_progress_toward_next_rank: RankProgressChartData
    team_position_summary: TeamPositionChartData | None


class SalesAdvisorDashboardOverviewResponse(BaseModel):
    dashboard_summary: DashboardSummaryResponse
    rank_progress: RankProgressResponse
    team_comparison: TeamComparisonResponse | None
    chart_data: SalesAdvisorOverviewChartData
