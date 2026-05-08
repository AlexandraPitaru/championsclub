from datetime import date
from typing import Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field

from app.sales_advisor_profile.ai_analysis_schemas import (
    PriorityLevel,
    SalesAdvisorProfileContext,
    SalesAdvisorRankProgressContext,
    SalesAdvisorRecentPerformanceContext,
    SalesAdvisorSkillContext,
    SalesAdvisorTeamComparisonContext,
)


ForecastTrend = Literal["upward", "stable", "downward"]
ConfidenceLevel = Literal["low", "medium", "high"]
NextRankLikelihood = Literal["high", "medium", "low", "not_available"]


class SalesAdvisorPerformancePeriodContext(BaseModel):
    label: str
    start_date: date
    end_date: date
    total_transactions: int
    total_sales_amount: float
    total_points_earned: int


class SalesAdvisorForecastRecommendationsContext(BaseModel):
    profile: SalesAdvisorProfileContext
    recent_performance: SalesAdvisorRecentPerformanceContext
    rank_progress: SalesAdvisorRankProgressContext
    team_comparison: SalesAdvisorTeamComparisonContext | None = None
    skills: list[SalesAdvisorSkillContext] = Field(default_factory=list)
    performance_history: list[SalesAdvisorPerformancePeriodContext] = Field(
        default_factory=list
    )
    missing_data: list[str] = Field(default_factory=list)


class SalesAdvisorForecastSection(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    trend: ForecastTrend
    next_rank_likelihood: NextRankLikelihood
    confidence_level: ConfidenceLevel
    forecast_summary: str
    main_factors: list[str]
    recommended_focus: str = Field(
        validation_alias=AliasChoices("recommended_focus", "Recommended_focus"),
        serialization_alias="Recommended_focus",
    )


class SalesAdvisorForecastRiskArea(BaseModel):
    title: str
    description: str
    reason: str
    mitigation_action: str
    priority: PriorityLevel


class SalesAdvisorForecastRecommendedAction(BaseModel):
    title: str
    description: str
    reason: str
    expected_impact: str
    priority: PriorityLevel


class SalesAdvisorForecastTrainingRecommendation(BaseModel):
    title: str
    description: str
    related_skill: str
    reason: str
    expected_benefit: str
    priority: PriorityLevel


class SalesAdvisorForecastRecommendationsResponse(BaseModel):
    forecast: SalesAdvisorForecastSection
    risk_areas: list[SalesAdvisorForecastRiskArea]
    recommended_actions: list[SalesAdvisorForecastRecommendedAction]
    recommended_trainings: list[SalesAdvisorForecastTrainingRecommendation]
    recommendation_summary: str
