from datetime import datetime
from pydantic import BaseModel, Field


class ManagerProfileContext(BaseModel):
    manager_user_id: int
    manager_name: str
    team_size: int


class ManagerTeamRecentPerformanceContext(BaseModel):
    interval_label: str = "last_30_days"
    total_transactions: int
    total_sales_amount: float
    total_points_earned: int
    total_products_sold: int
    last_transaction_date: datetime | None


class ManagerTeamPointsSummary(BaseModel):
    total_points: int
    average_points: float
    top_points: int | None = None
    bottom_points: int | None = None


class ManagerTeamSkillAggregate(BaseModel):
    skill_name: str
    total_users_with_skill: int
    beginner_count: int = 0
    intermediate_count: int = 0
    advanced_count: int = 0


class ManagerAiAnalysisContext(BaseModel):
    profile: ManagerProfileContext
    recent_performance: ManagerTeamRecentPerformanceContext
    points_summary: ManagerTeamPointsSummary
    skills_aggregate: list[ManagerTeamSkillAggregate] = Field(default_factory=list)
    missing_data: list[str] = Field(default_factory=list)
