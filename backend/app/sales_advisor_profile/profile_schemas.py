from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel


PerformanceStatus = Literal["progressing_well", "stable", "needs_attention"]
TeamAverageComparison = Literal["above", "below", "equal"]


class SalesAdvisorProfileDepartment(BaseModel):
    department_id: int
    name: str


class SalesAdvisorProfileDealership(BaseModel):
    dealership_id: int
    name: str
    dealer_code: str
    city: str
    country: str
    region: str


class SalesAdvisorProfileDetails(BaseModel):
    user_id: int
    first_name: str
    last_name: str
    email: str
    phone: str | None
    employee_number: str
    role: str
    status: str
    hire_date: date
    points: int
    rank: str
    credit: float
    department: SalesAdvisorProfileDepartment | None
    dealership: SalesAdvisorProfileDealership | None


class SalesAdvisorProfileManager(BaseModel):
    user_id: int
    first_name: str
    last_name: str
    email: str


class SalesAdvisorTeamDetails(BaseModel):
    manager: SalesAdvisorProfileManager | None
    team_position: int
    total_sales_advisors: int
    team_average_points: float
    comparison_to_team_average: TeamAverageComparison
    points_difference_from_average: float


class SalesAdvisorPerformanceSummary(BaseModel):
    performance_status: PerformanceStatus
    status_reason: str
    current_points: int
    current_rank: str
    next_rank: str | None
    points_to_next_rank: int | None
    progress_percentage: float
    is_highest_rank: bool
    team_average_points: float | None
    team_points_ratio: float | None
    comparison_to_team_average: TeamAverageComparison | None
    team_position: int | None
    total_sales_advisors: int | None
    total_transactions: int
    total_sales_amount: float
    total_points_earned: int
    total_products_sold: int
    last_transaction_date: datetime | None


class SalesAdvisorSkill(BaseModel):
    skill_id: int | None
    name: str
    level: str
    verified: bool
    updated_at: datetime


class SalesAdvisorProfileResponse(BaseModel):
    profile_details: SalesAdvisorProfileDetails
    performance_summary: SalesAdvisorPerformanceSummary
    skills: list[SalesAdvisorSkill]
    team_details: SalesAdvisorTeamDetails | None
