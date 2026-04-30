from pydantic import BaseModel


class LeaderboardItemResponse(BaseModel):
    user_id: int
    first_name: str
    last_name: str
    email: str
    role: str
    status: str
    tier: str
    points: int
    position: int
    performance_pct: int
    avatar_initials: str
    medal: str | None = None


class LeaderboardPaginationResponse(BaseModel):
    total_items: int
    total_pages: int
    page: int
    page_size: int




class LeaderboardSummaryTopAdvisorResponse(BaseModel):
    user_id: int
    full_name: str
    points: int


class LeaderboardSummaryResponse(BaseModel):
    top_advisor: LeaderboardSummaryTopAdvisorResponse | None
    total_advisors: int
    average_points: float
    total_points: int


class LeaderboardResponse(BaseModel):
    items: list[LeaderboardItemResponse]
    pagination: LeaderboardPaginationResponse
    summary: LeaderboardSummaryResponse

class LeaderboardSummaryCompareResponse(BaseModel):
    interval: str
    comparison_label: str
    top_advisor: LeaderboardSummaryTopAdvisorResponse | None
    total_advisors: int

    average_points_current: float
    average_points_previous: float
    average_points_delta_pct: float | None

    total_points_current: int
    total_points_previous: int
    total_points_delta_pct: float | None

