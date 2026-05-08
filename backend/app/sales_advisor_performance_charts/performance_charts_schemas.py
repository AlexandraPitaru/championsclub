from pydantic import BaseModel


class ChartSectionBase(BaseModel):
    is_available: bool
    unavailable_reason: str | None
    labels: list[str]
    values: list[float]


class PersonalPerformanceChartPoint(BaseModel):
    label: str
    value: float
    period: str
    sales: float
    points: int
    transaction_count: int


class PersonalPerformanceChartSection(ChartSectionBase):
    data: list[PersonalPerformanceChartPoint]
    value_unit: str = "points"
    secondary_value_unit: str = "sales"


class PointsComparisonChartPoint(BaseModel):
    label: str
    value: float


class PersonalVsTeamAverageChartSection(ChartSectionBase):
    data: list[PointsComparisonChartPoint]
    value_unit: str = "points"


class RankProgressChartPoint(BaseModel):
    label: str
    value: float


class RankProgressChartSection(ChartSectionBase):
    data: list[RankProgressChartPoint]
    current_rank: str
    next_rank: str | None
    current_points: int
    start_points: int
    target_points: int | None
    remaining_points: int | None
    progress_percentage: float
    is_highest_rank: bool
    value_unit: str = "percentage"


class TeamPositionChartPoint(BaseModel):
    label: str
    value: float


class TeamPositionChartSection(ChartSectionBase):
    data: list[TeamPositionChartPoint]
    team_position: int | None
    total_sales_advisors: int | None
    advisors_ahead: int | None
    advisors_behind: int | None
    value_unit: str = "advisors"


class SalesAdvisorPerformanceChartsResponse(BaseModel):
    user_id: int
    personal_performance: PersonalPerformanceChartSection
    personal_vs_team_average: PersonalVsTeamAverageChartSection
    rank_progress: RankProgressChartSection
    team_position: TeamPositionChartSection
