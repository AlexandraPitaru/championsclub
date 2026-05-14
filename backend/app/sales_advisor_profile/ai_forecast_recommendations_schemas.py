from datetime import date, datetime, timezone
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
ForecastImpact = Literal["positive", "negative", "neutral"]
ForecastWeight = Literal["low", "medium", "high", "none"]
ForecastCategory = Literal["skills", "activity", "conversion", "follow_up"]


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


class SalesAdvisorNextRankLikelihood(BaseModel):
    probability_pct: int
    label: ConfidenceLevel


class SalesAdvisorForecastFactor(BaseModel):
    title: str
    impact: ForecastImpact
    weight: ForecastWeight
    explanation: str


class SalesAdvisorForecastSection(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    trend: ForecastTrend
    next_rank_likelihood: SalesAdvisorNextRankLikelihood
    confidence_level: ConfidenceLevel | None = None
    confidence_pct: int
    confidence_label: ConfidenceLevel
    forecast_summary: str
    main_factors: list[SalesAdvisorForecastFactor]
    recommended_focus: str = Field(
        validation_alias=AliasChoices("recommended_focus", "Recommended_focus"),
        serialization_alias="Recommended_focus",
    )
    projected_points_in_window: int
    projected_points_target: int
    days_window: int
    history_used_days: int


class SalesAdvisorForecastRiskArea(BaseModel):
    title: str
    description: str
    reason: str
    mitigation_action: str
    priority: PriorityLevel
    severity: PriorityLevel = "medium"
    category: ForecastCategory = "activity"
    expected_points_loss: int | None = None


class SalesAdvisorForecastRecommendedAction(BaseModel):
    title: str
    description: str
    reason: str
    expected_impact: str
    priority: PriorityLevel
    category: ForecastCategory = "activity"
    expected_points_gain: int | None = None
    time_estimate_minutes: int | None = None
    cta_label: str = "View action plan"
    cta_target: Literal["leads", "trainings", "profile", "leaderboard"] | None = None
    cta_url: str | None = None


class SalesAdvisorForecastTrainingRecommendation(BaseModel):
    title: str
    description: str
    related_skill: str
    reason: str
    expected_benefit: str
    priority: PriorityLevel
    duration_minutes: int = 45
    level: Literal["beginner", "intermediate", "advanced"] = "beginner"
    is_recommended_now: bool = True
    cta_target: Literal["training_external_url", "training_internal"] | None = None
    external_url: str | None = None


class SalesAdvisorForecastRecommendationsResponse(BaseModel):
    is_fallback: bool = False
    fallback_reason: Literal["ai_unavailable", "insufficient_data"] | None = None
    generated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    model_version: str = "forecast-local-baseline-1.0"
    forecast: SalesAdvisorForecastSection
    risk_areas: list[SalesAdvisorForecastRiskArea]
    recommended_actions: list[SalesAdvisorForecastRecommendedAction]
    recommended_trainings: list[SalesAdvisorForecastTrainingRecommendation]
    recommendation_summary: str
