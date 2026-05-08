import json
from datetime import datetime, timedelta, timezone

from sqlmodel import Session

from app.models.app_user import AppUser
from app.sales_advisor_profile.ai_analysis_repository import (
    get_sales_advisor_performance_history,
)
from app.sales_advisor_profile.ai_analysis_service import (
    build_sales_advisor_ai_analysis_context,
)
from app.sales_advisor_profile.ai_forecast_recommendations_schemas import (
    ConfidenceLevel,
    ForecastTrend,
    NextRankLikelihood,
    SalesAdvisorForecastRecommendedAction,
    SalesAdvisorForecastRecommendationsContext,
    SalesAdvisorForecastRecommendationsResponse,
    SalesAdvisorForecastRiskArea,
    SalesAdvisorForecastSection,
    SalesAdvisorForecastTrainingRecommendation,
    SalesAdvisorPerformancePeriodContext,
)


FORECAST_HISTORY_DAYS = 90
FORECAST_PERIOD_DAYS = 30
FORECAST_PERIOD_COUNT = 3
RECENT_ACTIVITY_WARNING_DAYS = 21
AI_MODEL = "gpt-4.1-mini"
PRIORITY_ORDER = {"high": 0, "medium": 1, "low": 2}


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _normalize_datetime(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)


def _dedupe_keep_order(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []

    for value in values:
        normalized = value.strip()
        if not normalized:
            continue

        key = normalized.lower()
        if key in seen:
            continue

        seen.add(key)
        result.append(normalized)

    return result


def _skill_names_for_levels(
    payload: SalesAdvisorForecastRecommendationsContext,
    *levels: str,
) -> list[str]:
    normalized_levels = {level.lower() for level in levels}

    return _dedupe_keep_order(
        [
            skill.skill_name
            for skill in payload.skills
            if skill.skill_level.lower() in normalized_levels
        ]
    )


def _history_start(now: datetime) -> datetime:
    return now - timedelta(days=FORECAST_HISTORY_DAYS)


def _build_performance_history(
    transactions: list[tuple[datetime, float, int]],
    now: datetime,
) -> list[SalesAdvisorPerformancePeriodContext]:
    today = now.date()
    buckets: list[dict[str, object]] = []

    for bucket_index in range(FORECAST_PERIOD_COUNT):
        period_end = today - timedelta(days=bucket_index * FORECAST_PERIOD_DAYS)
        period_start = today - timedelta(
            days=((bucket_index + 1) * FORECAST_PERIOD_DAYS) - 1
        )
        buckets.append(
            {
                "label": f"{period_start.isoformat()} to {period_end.isoformat()}",
                "start_date": period_start,
                "end_date": period_end,
                "total_transactions": 0,
                "total_sales_amount": 0.0,
                "total_points_earned": 0,
            }
        )

    for transaction_date, amount, points_earned in transactions:
        normalized_date = _normalize_datetime(transaction_date).date()
        days_ago = (today - normalized_date).days

        if days_ago < 0 or days_ago >= FORECAST_HISTORY_DAYS:
            continue

        bucket_index = days_ago // FORECAST_PERIOD_DAYS
        bucket = buckets[bucket_index]
        bucket["total_transactions"] = int(bucket["total_transactions"]) + 1
        bucket["total_sales_amount"] = float(bucket["total_sales_amount"]) + float(
            amount or 0
        )
        bucket["total_points_earned"] = int(bucket["total_points_earned"]) + int(
            points_earned or 0
        )

    history = [
        SalesAdvisorPerformancePeriodContext(
            label=str(bucket["label"]),
            start_date=bucket["start_date"],
            end_date=bucket["end_date"],
            total_transactions=int(bucket["total_transactions"]),
            total_sales_amount=round(float(bucket["total_sales_amount"]), 2),
            total_points_earned=int(bucket["total_points_earned"]),
        )
        for bucket in reversed(buckets)
    ]

    return history


def build_sales_advisor_ai_forecast_context(
    session: Session,
    current_user: AppUser,
) -> SalesAdvisorForecastRecommendationsContext:
    base_context = build_sales_advisor_ai_analysis_context(session, current_user)
    now = _now_utc()
    transactions = get_sales_advisor_performance_history(
        session=session,
        user_id=current_user.user_id,
        interval_start=_history_start(now),
    )
    performance_history = _build_performance_history(transactions, now)

    missing_data = list(base_context.missing_data)
    active_periods = sum(
        1
        for period in performance_history
        if period.total_transactions > 0 or period.total_points_earned > 0
    )

    if active_periods < 2:
        missing_data.append(
            "Limited 90-day performance history is available, so forecast confidence is reduced."
        )

    return SalesAdvisorForecastRecommendationsContext(
        profile=base_context.profile,
        recent_performance=base_context.recent_performance,
        rank_progress=base_context.rank_progress,
        team_comparison=base_context.team_comparison,
        skills=base_context.skills,
        performance_history=performance_history,
        missing_data=_dedupe_keep_order(missing_data),
    )


def _active_history_periods(
    payload: SalesAdvisorForecastRecommendationsContext,
) -> list[SalesAdvisorPerformancePeriodContext]:
    return [
        period
        for period in payload.performance_history
        if period.total_transactions > 0 or period.total_points_earned > 0
    ]


def _get_latest_periods(
    payload: SalesAdvisorForecastRecommendationsContext,
) -> tuple[SalesAdvisorPerformancePeriodContext | None, SalesAdvisorPerformancePeriodContext | None]:
    if not payload.performance_history:
        return None, None

    latest = payload.performance_history[-1]
    previous = (
        payload.performance_history[-2]
        if len(payload.performance_history) > 1
        else None
    )
    return latest, previous


def _determine_trend(
    payload: SalesAdvisorForecastRecommendationsContext,
) -> ForecastTrend:
    latest, previous = _get_latest_periods(payload)

    if latest is None:
        return "stable"

    latest_points = latest.total_points_earned
    previous_points = previous.total_points_earned if previous is not None else 0

    if latest_points == 0 and previous_points == 0:
        return "stable"

    if previous_points == 0 and latest_points > 0:
        return "upward"

    if latest_points == 0 and previous_points > 0:
        return "downward"

    if latest_points >= previous_points * 1.15:
        return "upward"

    if latest_points <= previous_points * 0.85:
        return "downward"

    return "stable"


def _estimate_next_rank_likelihood(
    payload: SalesAdvisorForecastRecommendationsContext,
    *,
    trend: ForecastTrend,
) -> NextRankLikelihood:
    rank_progress = payload.rank_progress

    if rank_progress.is_highest_rank or rank_progress.points_to_next_rank is None:
        return "not_available"

    current_points_pace = float(payload.recent_performance.total_points_earned)
    if current_points_pace <= 0:
        return "low"

    points_to_next_rank = rank_progress.points_to_next_rank

    if points_to_next_rank <= current_points_pace:
        likelihood: NextRankLikelihood = "high"
    elif points_to_next_rank <= current_points_pace * 2:
        likelihood = "medium"
    else:
        likelihood = "low"

    if trend == "downward" and likelihood == "high":
        return "medium"

    return likelihood


def _average_points_per_active_period(
    payload: SalesAdvisorForecastRecommendationsContext,
) -> float:
    active_periods = _active_history_periods(payload)
    points_values = [period.total_points_earned for period in active_periods]

    if points_values:
        return sum(points_values) / len(points_values)

    return float(payload.recent_performance.total_points_earned)


def _determine_confidence(
    payload: SalesAdvisorForecastRecommendationsContext,
) -> ConfidenceLevel:
    active_periods = _active_history_periods(payload)
    active_count = len(active_periods)
    score = 0

    if active_count >= 3:
        score += 2
    elif active_count >= 2:
        score += 1

    if payload.team_comparison is not None:
        score += 1

    if payload.skills:
        score += 1

    if payload.recent_performance.last_transaction_date is not None:
        last_transaction = _normalize_datetime(
            payload.recent_performance.last_transaction_date
        )
        if (_now_utc() - last_transaction).days <= RECENT_ACTIVITY_WARNING_DAYS:
            score += 1

    if active_count < 2:
        return "low"

    if score >= 4:
        return "high"

    if score >= 2:
        return "medium"

    return "low"


def _build_main_factors(
    payload: SalesAdvisorForecastRecommendationsContext,
    *,
    average_points_per_period: float,
) -> list[str]:
    factors: list[str] = []
    latest, previous = _get_latest_periods(payload)

    if latest is not None:
        factors.append(
            "Recent 30-day activity shows "
            f"{latest.total_transactions} transactions and {latest.total_points_earned} points."
        )

    if previous is not None:
        factors.append(
            "The prior 30-day period recorded "
            f"{previous.total_transactions} transactions and {previous.total_points_earned} points."
        )

    if payload.rank_progress.is_highest_rank:
        factors.append("The advisor already holds the highest configured rank.")
    elif payload.rank_progress.points_to_next_rank is not None:
        factors.append(
            f"{payload.rank_progress.points_to_next_rank} points remain to reach {payload.rank_progress.next_rank}."
        )

    if average_points_per_period > 0:
        factors.append(
            "Average points earned across active 30-day periods are "
            f"{average_points_per_period:.1f}."
        )

    if payload.team_comparison is not None:
        comparison = payload.team_comparison
        if comparison.comparison_to_team_average == "above":
            factors.append(
                "Current total points are above the team average."
            )
        elif comparison.comparison_to_team_average == "below":
            factors.append(
                "Current total points are below the team average."
            )
        else:
            factors.append("Current total points are aligned with the team average.")

    skill_gaps = _skill_names_for_levels(payload, "beginner")
    strong_skills = _skill_names_for_levels(payload, "advanced")

    if skill_gaps:
        factors.append(
            "Skill records highlight development needs in "
            f"{', '.join(skill_gaps[:3])}."
        )
    elif strong_skills:
        factors.append(
            "Skill records show strengths in "
            f"{', '.join(strong_skills[:3])}."
        )

    if payload.missing_data:
        factors.append(payload.missing_data[0])

    return factors[:5]


def _build_recommended_focus(
    payload: SalesAdvisorForecastRecommendationsContext,
    *,
    trend: ForecastTrend,
) -> str:
    skill_gaps = _skill_names_for_levels(payload, "beginner")

    if payload.recent_performance.total_transactions == 0:
        return (
            "Rebuild recent sales activity first so future coaching can rely on stronger performance signals."
        )

    if trend == "downward":
        return (
            "Stabilize short-term points growth with a tighter weekly activity plan before stretching for bigger goals."
        )

    if (
        not payload.rank_progress.is_highest_rank
        and payload.rank_progress.points_to_next_rank is not None
    ):
        return (
            f"Keep your focus on closing the remaining {payload.rank_progress.points_to_next_rank} points to {payload.rank_progress.next_rank}."
        )

    if skill_gaps:
        return (
            f"Turn one development skill, especially {skill_gaps[0]}, into a practical weekly improvement target."
        )

    return "Protect your current momentum and keep your strongest habits consistent."


def _build_forecast_summary(
    payload: SalesAdvisorForecastRecommendationsContext,
    *,
    trend: ForecastTrend,
    next_rank_likelihood: NextRankLikelihood,
    confidence_level: ConfidenceLevel,
    ai_unavailable: bool,
) -> str:
    trend_text = {
        "upward": "trending upward",
        "stable": "holding a stable pace",
        "downward": "trending downward",
    }[trend]

    if next_rank_likelihood == "not_available":
        next_rank_sentence = (
            "Next-rank likelihood is not applicable because you already hold the highest configured rank."
        )
    elif payload.rank_progress.next_rank is not None:
        next_rank_sentence = (
            f"The current likelihood of reaching {payload.rank_progress.next_rank} is {next_rank_likelihood}."
        )
    else:
        next_rank_sentence = (
            "There is not enough rank-progress information to estimate the next-rank likelihood."
        )

    if confidence_level == "low":
        confidence_sentence = (
            "Confidence is low because recent history or supporting comparison data is limited."
        )
    elif confidence_level == "medium":
        confidence_sentence = (
            "Confidence is medium because there is some recent history, but the signal is not complete."
        )
    else:
        confidence_sentence = (
            "Confidence is high because recent performance history and supporting context are both available."
        )

    summary = (
        f"If your current performance continues, you are {trend_text}. "
        f"{next_rank_sentence} {confidence_sentence}"
    )

    if not ai_unavailable:
        return summary

    return (
        "AI forecast is temporarily unavailable right now, so this is a simplified estimate based on your current advisor data. "
        + summary
    )


def _build_no_risk_item() -> list[SalesAdvisorForecastRiskArea]:
    return [
        SalesAdvisorForecastRiskArea(
            title="No major risk areas detected",
            description=(
                "Current advisor data does not show a strong warning signal that is likely to slow progress."
            ),
            reason=(
                "Recent performance, rank progress, team position, and skill signals do not indicate a major risk right now."
            ),
            mitigation_action=(
                "Maintain the current routine and keep monitoring activity so any change is caught early."
            ),
            priority="low",
        )
    ]


def _build_risk_areas(
    payload: SalesAdvisorForecastRecommendationsContext,
    *,
    trend: ForecastTrend,
) -> list[SalesAdvisorForecastRiskArea]:
    risk_areas: list[SalesAdvisorForecastRiskArea] = []
    skill_gaps = _skill_names_for_levels(payload, "beginner")
    latest, previous = _get_latest_periods(payload)

    if payload.recent_performance.total_transactions == 0:
        risk_areas.append(
            SalesAdvisorForecastRiskArea(
                title="Low recent activity",
                description=(
                    "Recent sales activity is too limited to support reliable short-term progress."
                ),
                reason="No transactions were recorded in the last 30 days.",
                mitigation_action=(
                    "Build a short weekly plan around active prospects and track each follow-up until the next sale is closed."
                ),
                priority="high",
            )
        )

    if (
        trend == "downward"
        and latest is not None
        and previous is not None
        and previous.total_points_earned > 0
    ):
        risk_areas.append(
            SalesAdvisorForecastRiskArea(
                title="Slowing points growth",
                description=(
                    "Recent point generation has cooled compared with the previous 30-day period."
                ),
                reason=(
                    f"The latest 30-day period produced {latest.total_points_earned} points versus "
                    f"{previous.total_points_earned} in the prior period."
                ),
                mitigation_action=(
                    "Review your recent pipeline and set one weekly target for sales activity and one for points earned."
                ),
                priority="high",
            )
        )

    if payload.team_comparison is not None and (
        payload.team_comparison.comparison_to_team_average == "below"
    ):
        team_position = payload.team_comparison.team_position
        total_advisors = payload.team_comparison.total_sales_advisors
        priority = (
            "high"
            if total_advisors > 1 and team_position > (total_advisors / 2)
            else "medium"
        )
        risk_areas.append(
            SalesAdvisorForecastRiskArea(
                title="Below team benchmark",
                description=(
                    "Your current position against the team average may slow visible progress if it does not improve."
                ),
                reason=(
                    f"You are {abs(payload.team_comparison.points_difference_from_average):,.0f} points below "
                    f"the team average and currently ranked {team_position} of {total_advisors} advisors."
                ),
                mitigation_action=(
                    "Compare one successful habit from higher-performing teammates and apply it to your next two weeks of customer activity."
                ),
                priority=priority,
            )
        )

    if skill_gaps:
        risk_areas.append(
            SalesAdvisorForecastRiskArea(
                title="Skill coverage gaps",
                description=(
                    "Some recorded skills still show a beginner level, which can slow consistent performance."
                ),
                reason=(
                    f"Current skill data marks {', '.join(skill_gaps[:3])} as development areas."
                ),
                mitigation_action=(
                    "Pick one development skill and practice it intentionally with feedback from a manager or peer this week."
                ),
                priority="medium",
            )
        )

    if (
        payload.recent_performance.last_transaction_date is not None
        and payload.recent_performance.total_transactions > 0
    ):
        last_transaction = _normalize_datetime(
            payload.recent_performance.last_transaction_date
        )
        inactivity_days = (_now_utc() - last_transaction).days

        if inactivity_days > RECENT_ACTIVITY_WARNING_DAYS:
            risk_areas.append(
                SalesAdvisorForecastRiskArea(
                    title="Activity gap",
                    description=(
                        "A longer pause since the last recorded transaction can make the near-term forecast less stable."
                    ),
                    reason=(
                        f"The last recorded transaction was {inactivity_days} days ago."
                    ),
                    mitigation_action=(
                        "Re-engage your current opportunity list and schedule follow-ups in the next two business days."
                    ),
                    priority="medium",
                )
            )

    sorted_risks = sorted(
        risk_areas,
        key=lambda item: (PRIORITY_ORDER[item.priority], item.title.lower()),
    )

    return sorted_risks[:4] if sorted_risks else _build_no_risk_item()


def _build_recommended_actions(
    payload: SalesAdvisorForecastRecommendationsContext,
    *,
    trend: ForecastTrend,
    average_points_per_period: float,
) -> list[SalesAdvisorForecastRecommendedAction]:
    actions: list[SalesAdvisorForecastRecommendedAction] = []
    skill_gaps = _skill_names_for_levels(payload, "beginner")

    if payload.recent_performance.total_transactions == 0 or trend == "downward":
        actions.append(
            SalesAdvisorForecastRecommendedAction(
                title="Rebuild a weekly activity rhythm",
                description=(
                    "Plan a simple weekly cadence for prospecting, follow-ups, and closed-sales check-ins."
                ),
                reason=(
                    "Recent performance signals show that short-term momentum needs to become more consistent."
                ),
                expected_impact=(
                    "A steadier activity rhythm should improve sales visibility and create a more reliable points trend."
                ),
                priority="high",
            )
        )

    if (
        not payload.rank_progress.is_highest_rank
        and payload.rank_progress.points_to_next_rank is not None
    ):
        weekly_target = max(
            1,
            int(
                round(
                    payload.rank_progress.points_to_next_rank / 4,
                )
            ),
        )
        priority = "high" if average_points_per_period > 0 else "medium"
        actions.append(
            SalesAdvisorForecastRecommendedAction(
                title="Turn the next rank gap into weekly targets",
                description=(
                    f"Break the remaining {payload.rank_progress.points_to_next_rank} points to {payload.rank_progress.next_rank} into a weekly target of about {weekly_target} points."
                ),
                reason=(
                    "A visible milestone is easier to reach when the remaining gap is translated into shorter checkpoints."
                ),
                expected_impact=(
                    "Smaller weekly targets should make next-rank progress easier to track and easier to adjust."
                ),
                priority=priority,
            )
        )

    if payload.team_comparison is not None and (
        payload.team_comparison.comparison_to_team_average == "below"
    ):
        actions.append(
            SalesAdvisorForecastRecommendedAction(
                title="Benchmark against one stronger team habit",
                description=(
                    "Review how a higher-performing teammate structures follow-ups, upselling, or deal progression, then test that habit in your own routine."
                ),
                reason=(
                    "You are currently below the team average, so using a proven team habit can shorten the improvement cycle."
                ),
                expected_impact=(
                    "Applying a proven behavior should help close the gap to the team average with less trial and error."
                ),
                priority="medium",
            )
        )

    if skill_gaps:
        actions.append(
            SalesAdvisorForecastRecommendedAction(
                title="Focus on one development skill at a time",
                description=(
                    f"Choose {skill_gaps[0]} as the first short-term practice focus and review the result after each customer interaction."
                ),
                reason=(
                    "Skill data shows a clear development need, and a single-skill focus is easier to apply consistently."
                ),
                expected_impact=(
                    "More intentional practice should improve execution quality and support stronger sales outcomes."
                ),
                priority="medium",
            )
        )

    if not actions:
        actions.append(
            SalesAdvisorForecastRecommendedAction(
                title="Maintain the current performance routine",
                description=(
                    "Keep your current habits visible and repeat the behaviors that are sustaining your recent performance."
                ),
                reason=(
                    "No major evidence-based action gap stands out in the available advisor data."
                ),
                expected_impact=(
                    "Consistency should protect current momentum while keeping future improvement options open."
                ),
                priority="low",
            )
        )

    return sorted(
        actions,
        key=lambda item: (PRIORITY_ORDER[item.priority], item.title.lower()),
    )[:4]


def _build_training_recommendations(
    payload: SalesAdvisorForecastRecommendationsContext,
    *,
    trend: ForecastTrend,
) -> tuple[list[SalesAdvisorForecastTrainingRecommendation], str | None]:
    skill_gaps = _skill_names_for_levels(payload, "beginner")

    if not payload.skills:
        return (
            [],
            "No training recommendations were added because skill records are unavailable for this advisor.",
        )

    if not skill_gaps:
        return (
            [],
            "No training recommendations were added because the current skill records do not show a clear development gap.",
        )

    trainings: list[SalesAdvisorForecastTrainingRecommendation] = []

    for index, skill_name in enumerate(skill_gaps[:3]):
        priority = (
            "high"
            if index == 0 and trend == "downward"
            else "medium"
            if index == 0
            else "low"
        )
        trainings.append(
            SalesAdvisorForecastTrainingRecommendation(
                title=f"{skill_name} practice workshop",
                description=(
                    f"A focused training session on {skill_name} with real customer scenarios and short practice loops."
                ),
                related_skill=skill_name,
                reason=(
                    f"{skill_name} is currently recorded as a beginner-level skill and is a likely blocker for faster progress."
                ),
                expected_benefit=(
                    f"Stronger execution in {skill_name} should improve consistency and support better sales results."
                ),
                priority=priority,
            )
        )

    return trainings, None


def _build_recommendation_summary(
    payload: SalesAdvisorForecastRecommendationsContext,
    *,
    trend: ForecastTrend,
    trainings_note: str | None,
    ai_unavailable: bool,
) -> str:
    prefix = (
        "AI forecast and recommendations are temporarily unavailable right now, so we prepared this guidance using your current advisor data instead. "
        if ai_unavailable
        else ""
    )
    focus = _build_recommended_focus(payload, trend=trend)

    if trainings_note:
        training_sentence = trainings_note
    else:
        training_sentence = (
            "Training suggestions are included where the skill data shows a clear development need."
        )

    return (
        prefix
        + f"Primary focus: {focus} "
        + training_sentence
    ).strip()


def build_fallback_sales_advisor_ai_forecast_recommendations(
    payload: SalesAdvisorForecastRecommendationsContext,
    *,
    ai_unavailable: bool,
) -> SalesAdvisorForecastRecommendationsResponse:
    trend = _determine_trend(payload)
    average_points_per_period = _average_points_per_active_period(payload)
    next_rank_likelihood = _estimate_next_rank_likelihood(
        payload,
        trend=trend,
    )
    confidence_level = _determine_confidence(payload)
    trainings, trainings_note = _build_training_recommendations(payload, trend=trend)

    return SalesAdvisorForecastRecommendationsResponse(
        forecast=SalesAdvisorForecastSection(
            trend=trend,
            next_rank_likelihood=next_rank_likelihood,
            confidence_level=confidence_level,
            forecast_summary=_build_forecast_summary(
                payload,
                trend=trend,
                next_rank_likelihood=next_rank_likelihood,
                confidence_level=confidence_level,
                ai_unavailable=ai_unavailable,
            ),
            main_factors=_build_main_factors(
                payload,
                average_points_per_period=average_points_per_period,
            ),
            recommended_focus=_build_recommended_focus(payload, trend=trend),
        ),
        risk_areas=_build_risk_areas(payload, trend=trend),
        recommended_actions=_build_recommended_actions(
            payload,
            trend=trend,
            average_points_per_period=average_points_per_period,
        ),
        recommended_trainings=trainings,
        recommendation_summary=_build_recommendation_summary(
            payload,
            trend=trend,
            trainings_note=trainings_note,
            ai_unavailable=ai_unavailable,
        ),
    )


def build_sales_advisor_ai_forecast_prompt(
    payload: SalesAdvisorForecastRecommendationsContext,
    baseline: SalesAdvisorForecastRecommendationsResponse,
) -> str:
    context_data = payload.model_dump(mode="json")
    baseline_data = baseline.model_dump(mode="json", by_alias=True)

    return f"""
You are generating AI forecast and recommendation content for a sales advisor viewing their own profile.

Return only valid JSON. Do not add markdown, explanations, or code fences.

Required JSON structure:
{{
  "forecast": {{
    "trend": "upward|stable|downward",
    "next_rank_likelihood": "high|medium|low|not_available",
    "confidence_level": "low|medium|high",
    "forecast_summary": "string",
    "main_factors": ["string"],
    "Recommended_focus": "string"
  }},
  "risk_areas": [
    {{
      "title": "string",
      "description": "string",
      "reason": "string",
      "mitigation_action": "string",
      "priority": "high|medium|low"
    }}
  ],
  "recommended_actions": [
    {{
      "title": "string",
      "description": "string",
      "reason": "string",
      "expected_impact": "string",
      "priority": "high|medium|low"
    }}
  ],
  "recommended_trainings": [
    {{
      "title": "string",
      "description": "string",
      "related_skill": "string",
      "reason": "string",
      "expected_benefit": "string",
      "priority": "high|medium|low"
    }}
  ],
  "recommendation_summary": "string"
}}

Rules:
- Use only the advisor data provided below.
- Do not invent metrics, trends, team positions, skill gaps, or recommendations that are not supported by the provided data.
- Keep all categorical values exactly as they appear in the baseline response:
  - forecast.trend
  - forecast.next_rank_likelihood
  - forecast.confidence_level
  - all priority values
- Keep the same number and order of items in risk_areas, recommended_actions, and recommended_trainings.
- You may improve the tone and wording so the output is clear, constructive, and personalized for the advisor.
- If the baseline response explains that data is missing, keep that explanation instead of guessing.
- If recommended_trainings is empty, keep it empty and explain why in recommendation_summary.

Advisor context:
{json.dumps(context_data, indent=2)}

Baseline response:
{json.dumps(baseline_data, indent=2)}
"""


def _extract_json_payload(raw_text: str) -> dict:
    text = raw_text.strip()

    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise
        return json.loads(text[start : end + 1])


def merge_ai_forecast_recommendations_with_fallback(
    analysis: SalesAdvisorForecastRecommendationsResponse,
    fallback: SalesAdvisorForecastRecommendationsResponse,
) -> SalesAdvisorForecastRecommendationsResponse:
    return SalesAdvisorForecastRecommendationsResponse(
        forecast=SalesAdvisorForecastSection(
            trend=analysis.forecast.trend,
            next_rank_likelihood=analysis.forecast.next_rank_likelihood,
            confidence_level=analysis.forecast.confidence_level,
            forecast_summary=(
                analysis.forecast.forecast_summary.strip()
                or fallback.forecast.forecast_summary
            ),
            main_factors=[
                factor.strip()
                for factor in analysis.forecast.main_factors
                if factor and factor.strip()
            ]
            or fallback.forecast.main_factors,
            recommended_focus=(
                analysis.forecast.recommended_focus.strip()
                or fallback.forecast.recommended_focus
            ),
        ),
        risk_areas=analysis.risk_areas or fallback.risk_areas,
        recommended_actions=(
            analysis.recommended_actions or fallback.recommended_actions
        ),
        recommended_trainings=(
            analysis.recommended_trainings or fallback.recommended_trainings
        ),
        recommendation_summary=(
            analysis.recommendation_summary.strip()
            or fallback.recommendation_summary
        ),
    )


def generate_sales_advisor_ai_forecast_recommendations_with_ai(
    payload: SalesAdvisorForecastRecommendationsContext,
) -> SalesAdvisorForecastRecommendationsResponse:
    try:
        from openai import OpenAI
    except Exception as exc:
        raise RuntimeError("OpenAI SDK unavailable") from exc

    fallback = build_fallback_sales_advisor_ai_forecast_recommendations(
        payload,
        ai_unavailable=False,
    )

    client = OpenAI()
    response = client.responses.create(
        model=AI_MODEL,
        input=build_sales_advisor_ai_forecast_prompt(payload, fallback),
        temperature=0.4,
        max_output_tokens=1200,
    )

    response_text = (response.output_text or "").strip()
    if not response_text:
        raise ValueError("Empty AI response")

    parsed = _extract_json_payload(response_text)
    analysis = SalesAdvisorForecastRecommendationsResponse.model_validate(parsed)
    return merge_ai_forecast_recommendations_with_fallback(analysis, fallback)


def get_sales_advisor_ai_forecast_recommendations(
    session: Session,
    current_user: AppUser,
) -> SalesAdvisorForecastRecommendationsResponse:
    payload = build_sales_advisor_ai_forecast_context(session, current_user)

    try:
        return generate_sales_advisor_ai_forecast_recommendations_with_ai(payload)
    except Exception:
        return build_fallback_sales_advisor_ai_forecast_recommendations(
            payload,
            ai_unavailable=True,
        )
