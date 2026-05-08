from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


PriorityLevel = Literal["high", "medium", "low"]
TeamAverageComparison = Literal["above", "below", "equal"]


class SalesAdvisorAiStrength(BaseModel):
    title: str
    description: str
    supporting_reason: str


class SalesAdvisorAiImprovementArea(BaseModel):
    title: str
    description: str
    reason: str
    suggested_next_step: str
    priority: PriorityLevel


class SalesAdvisorAiSkillsAnalysis(BaseModel):
    strong_skills: list[str]
    skills_to_develop: list[str]
    summary: str


class SalesAdvisorAiAnalysisResponse(BaseModel):
    ai_summary: str
    strengths: list[SalesAdvisorAiStrength]
    improvement_areas: list[SalesAdvisorAiImprovementArea]
    skills_analysis: SalesAdvisorAiSkillsAnalysis
    motivational_summary: str


class SalesAdvisorProfileContext(BaseModel):
    user_id: int
    first_name: str
    last_name: str
    email: str
    phone: str | None = None
    employee_number: str
    role: str
    current_rank: str
    total_points: int
    credit: float
    status: str
    hire_date: date
    department_name: str | None = None
    dealership_name: str | None = None
    dealer_code: str | None = None
    city: str | None = None
    country: str | None = None
    region: str | None = None
    manager_name: str | None = None


class SalesAdvisorRecentPerformanceContext(BaseModel):
    interval_label: str = "last_30_days"
    total_transactions: int
    total_sales_amount: float
    total_points_earned: int
    total_products_sold: int
    last_transaction_date: datetime | None


class SalesAdvisorSkillContext(BaseModel):
    skill_name: str
    skill_level: str
    verified: bool
    updated_at: datetime


class SalesAdvisorRankProgressContext(BaseModel):
    current_rank: str
    next_rank: str | None
    current_points: int
    points_to_next_rank: int | None
    progress_percentage: float
    is_highest_rank: bool


class SalesAdvisorTeamComparisonContext(BaseModel):
    team_average_points: float
    comparison_to_team_average: TeamAverageComparison
    points_difference_from_average: float
    team_position: int
    total_sales_advisors: int


class SalesAdvisorAiAnalysisContext(BaseModel):
    profile: SalesAdvisorProfileContext
    recent_performance: SalesAdvisorRecentPerformanceContext
    rank_progress: SalesAdvisorRankProgressContext
    team_comparison: SalesAdvisorTeamComparisonContext | None = None
    skills: list[SalesAdvisorSkillContext] = Field(default_factory=list)
    missing_data: list[str] = Field(default_factory=list)
