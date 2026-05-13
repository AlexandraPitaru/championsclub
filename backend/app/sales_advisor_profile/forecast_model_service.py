from dataclasses import dataclass

from app.sales_advisor_profile.ai_forecast_recommendations_schemas import (
    ConfidenceLevel,
    ForecastImpact,
    ForecastTrend,
    ForecastWeight,
    SalesAdvisorForecastFactor,
    SalesAdvisorForecastRecommendationsContext,
)


FORECAST_WINDOW_DAYS = 30
FORECAST_HISTORY_DAYS = 90


@dataclass(frozen=True)
class AdvisorForecastPrediction:
    trend: ForecastTrend
    projected_points_in_window: int
    projected_points_target: int
    next_rank_probability_pct: int
    next_rank_likelihood_label: ConfidenceLevel
    confidence_pct: int
    confidence_label: ConfidenceLevel
    days_window: int
    history_used_days: int
    average_points_per_active_period: float
    active_period_count: int
    main_factors: list[SalesAdvisorForecastFactor]


def _clamp(value: int, minimum: int, maximum: int) -> int:
    return max(minimum, min(maximum, value))


def _label_from_pct(value: int) -> ConfidenceLevel:
    if value >= 70:
        return "high"
    if value >= 40:
        return "medium"
    return "low"


def _active_points(payload: SalesAdvisorForecastRecommendationsContext) -> list[int]:
    return [
        period.total_points_earned
        for period in payload.performance_history
        if period.total_transactions > 0 or period.total_points_earned > 0
    ]


def _determine_trend(points_by_period: list[int]) -> ForecastTrend:
    if len(points_by_period) < 2:
        return "stable"

    previous = points_by_period[-2]
    latest = points_by_period[-1]

    if previous == 0 and latest == 0:
        return "stable"
    if previous == 0 and latest > 0:
        return "upward"
    if latest == 0 and previous > 0:
        return "downward"
    if latest >= previous * 1.15:
        return "upward"
    if latest <= previous * 0.85:
        return "downward"
    return "stable"


def _project_next_window_points(points_by_period: list[int], trend: ForecastTrend) -> int:
    if not points_by_period:
        return 0

    weights = [0.2, 0.3, 0.5]
    recent_points = points_by_period[-3:]
    recent_weights = weights[-len(recent_points) :]
    weighted_average = sum(
        points * weight for points, weight in zip(recent_points, recent_weights)
    ) / sum(recent_weights)

    if trend == "upward":
        weighted_average *= 1.08
    elif trend == "downward":
        weighted_average *= 0.88

    return max(0, int(round(weighted_average)))


def _next_rank_probability(
    payload: SalesAdvisorForecastRecommendationsContext,
    projected_points: int,
    trend: ForecastTrend,
) -> int:
    if payload.rank_progress.is_highest_rank:
        return 100

    points_to_next_rank = payload.rank_progress.points_to_next_rank
    if points_to_next_rank is None or points_to_next_rank <= 0:
        return 0
    if projected_points <= 0:
        return 0

    coverage_ratio = projected_points / points_to_next_rank
    if coverage_ratio >= 1.2:
        probability = 88
    elif coverage_ratio >= 1:
        probability = 74
    elif coverage_ratio >= 0.75:
        probability = 56
    elif coverage_ratio >= 0.5:
        probability = 38
    else:
        probability = 18

    if trend == "upward":
        probability += 8
    elif trend == "downward":
        probability -= 10

    return _clamp(probability, 5, 95)


def _confidence_pct(
    payload: SalesAdvisorForecastRecommendationsContext,
    active_period_count: int,
) -> int:
    score = 30
    score += min(active_period_count, 3) * 12

    if payload.team_comparison is not None:
        score += 10
    if payload.skills:
        score += 8
    if payload.recent_performance.last_transaction_date is not None:
        score += 10
    if active_period_count < 2:
        score -= 12

    return _clamp(score, 20, 88)


def _factor(
    title: str,
    impact: ForecastImpact,
    weight: ForecastWeight,
    explanation: str,
) -> SalesAdvisorForecastFactor:
    return SalesAdvisorForecastFactor(
        title=title,
        impact=impact,
        weight=weight,
        explanation=explanation,
    )


def _build_prediction_factors(
    payload: SalesAdvisorForecastRecommendationsContext,
    *,
    trend: ForecastTrend,
    projected_points: int,
    average_points: float,
    active_period_count: int,
) -> list[SalesAdvisorForecastFactor]:
    factors: list[SalesAdvisorForecastFactor] = []

    if active_period_count == 0:
        factors.append(
            _factor(
                title="No recent sales activity",
                impact="negative",
                weight="high",
                explanation=(
                    f"No transactions were found in the last {FORECAST_HISTORY_DAYS} days, "
                    "so the local model cannot calculate a reliable points pace yet."
                ),
            )
        )
        factors.append(
            _factor(
                title="Projection needs fresh data",
                impact="neutral",
                weight="medium",
                explanation=(
                    "The 0-point projection means the advisor has no recent activity signal, "
                    "not that future performance must stay at zero."
                ),
            )
        )
    else:
        factors.append(
            _factor(
                title="Projected points pace",
                impact="positive" if projected_points > 0 else "neutral",
                weight="high" if active_period_count >= 2 else "medium",
                explanation=(
                    f"The local model projects about {projected_points} points in the next "
                    f"{FORECAST_WINDOW_DAYS} days from the recent performance history."
                ),
            )
        )

        factors.append(
            _factor(
                title="Recent trend",
                impact=(
                    "positive"
                    if trend == "upward"
                    else "negative"
                    if trend == "downward"
                    else "neutral"
                ),
                weight="high" if active_period_count >= 2 else "low",
                explanation=(
                    f"The last active periods average {average_points:.1f} points and the current direction is {trend}."
                ),
            )
        )

    if (
        not payload.rank_progress.is_highest_rank
        and payload.rank_progress.points_to_next_rank is not None
    ):
        factors.append(
            _factor(
                title="Next rank gap",
                impact=(
                    "positive"
                    if projected_points >= payload.rank_progress.points_to_next_rank
                    else "negative"
                ),
                weight="high",
                explanation=(
                    f"{payload.rank_progress.points_to_next_rank} points are needed to reach "
                    f"{payload.rank_progress.next_rank}; the projection covers "
                    f"{min(100, round(projected_points / max(1, payload.rank_progress.points_to_next_rank) * 100))}% of that gap."
                ),
            )
        )

    if payload.team_comparison is not None:
        comparison = payload.team_comparison
        factors.append(
            _factor(
                title="Team benchmark",
                impact=(
                    "positive"
                    if comparison.comparison_to_team_average == "above"
                    else "negative"
                    if comparison.comparison_to_team_average == "below"
                    else "neutral"
                ),
                weight="medium",
                explanation=(
                    f"The advisor is {abs(comparison.points_difference_from_average):.0f} points "
                    f"{comparison.comparison_to_team_average} the team average and ranks "
                    f"{comparison.team_position}/{comparison.total_sales_advisors}."
                ),
            )
        )

    if payload.missing_data:
        factors.append(
            _factor(
                title="Data completeness",
                impact="neutral",
                weight="low",
                explanation=payload.missing_data[0],
            )
        )

    return factors[:5]


def build_advisor_forecast_prediction(
    payload: SalesAdvisorForecastRecommendationsContext,
) -> AdvisorForecastPrediction:
    points_by_period = _active_points(payload)
    active_period_count = len(points_by_period)
    trend = _determine_trend(points_by_period)
    projected_points = _project_next_window_points(points_by_period, trend)
    average_points = (
        sum(points_by_period) / active_period_count
        if active_period_count > 0
        else float(payload.recent_performance.total_points_earned)
    )

    target = payload.rank_progress.points_to_next_rank
    if payload.rank_progress.is_highest_rank or target is None or target <= 0:
        target = max(projected_points, payload.recent_performance.total_points_earned, 1)

    probability = _next_rank_probability(payload, projected_points, trend)
    confidence = _confidence_pct(payload, active_period_count)

    return AdvisorForecastPrediction(
        trend=trend,
        projected_points_in_window=projected_points,
        projected_points_target=max(1, int(target)),
        next_rank_probability_pct=probability,
        next_rank_likelihood_label=_label_from_pct(probability),
        confidence_pct=confidence,
        confidence_label=_label_from_pct(confidence),
        days_window=FORECAST_WINDOW_DAYS,
        history_used_days=FORECAST_HISTORY_DAYS if payload.performance_history else 0,
        average_points_per_active_period=average_points,
        active_period_count=active_period_count,
        main_factors=_build_prediction_factors(
            payload,
            trend=trend,
            projected_points=projected_points,
            average_points=average_points,
            active_period_count=active_period_count,
        ),
    )
