import json
from datetime import datetime, timedelta, timezone

from sqlmodel import Session

from app.manager_statistics.service import validate_manager
from app.models.app_user import AppUser
from app.AI.manager_ai.analysis_repository import (
    get_team_performance_history,
)
from app.AI.manager_ai.analysis_service import (
    build_manager_ai_analysis_context,
)
from app.sales_advisor_profile.ai_forecast_recommendations_schemas import (
    SalesAdvisorForecastRecommendationsResponse,
    SalesAdvisorForecastSection,
    SalesAdvisorForecastRecommendationsContext,
    SalesAdvisorPerformancePeriodContext,
    SalesAdvisorForecastRiskArea,
    SalesAdvisorForecastRecommendedAction,
    SalesAdvisorForecastTrainingRecommendation,
)
from app.sales_advisor_profile.ai_analysis_schemas import (
    SalesAdvisorRankProgressContext,
    SalesAdvisorProfileContext,
    SalesAdvisorRecentPerformanceContext,
)


FORECAST_HISTORY_DAYS = 90
FORECAST_PERIOD_DAYS = 30
FORECAST_PERIOD_COUNT = 3
AI_MODEL = "gpt-4.1-mini"


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _normalize_datetime(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _history_start(now: datetime) -> datetime:
    return now - timedelta(days=FORECAST_HISTORY_DAYS)


def _build_team_performance_history(
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


def build_manager_ai_forecast_context(
    session: Session,
    current_user: AppUser,
) -> SalesAdvisorForecastRecommendationsContext:
    validate_manager(current_user)
    base = build_manager_ai_analysis_context(session, current_user)
    now = _now_utc()
    transactions = get_team_performance_history(
        session=session,
        manager_user_id=current_user.user_id,
        interval_start=_history_start(now),
    )
    performance_history = _build_team_performance_history(transactions, now)

    missing_data = list(base.missing_data)
    active_periods = sum(
        1
        for period in performance_history
        if period.total_transactions > 0 or period.total_points_earned > 0
    )
    if active_periods < 2:
        missing_data.append(
            "Limited 90-day team performance history is available, so forecast confidence is reduced."
        )

    # Adaptează profilul managerului la schema de profil a advisorului
    profile_for_schema = SalesAdvisorProfileContext(
        user_id=current_user.user_id,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        email=current_user.email,
        phone=current_user.phone,
        employee_number=current_user.employee_number,
        role=current_user.role,
        current_rank=current_user.rank,
        total_points=current_user.points or 0,
        credit=float(current_user.credit or 0),
        status=current_user.status,
        hire_date=current_user.hire_date,
        department_name=None,
        dealership_name=None,
        dealer_code=None,
        city=None,
        country=None,
        region=None,
        manager_name=None,
    )

    # Reuse SalesAdvisorForecastRecommendationsContext to keep response compatibility
    dummy_rank_progress = SalesAdvisorRankProgressContext(
        current_rank="Team",
        next_rank=None,
        current_points=0,
        points_to_next_rank=None,
        progress_percentage=0.0,
        is_highest_rank=True,
    )

    # Adapt recent performance to advisor schema
    rp = base.recent_performance
    recent_for_schema = SalesAdvisorRecentPerformanceContext(
        total_transactions=rp.total_transactions,
        total_sales_amount=rp.total_sales_amount,
        total_points_earned=rp.total_points_earned,
        total_products_sold=rp.total_products_sold,
        last_transaction_date=rp.last_transaction_date,
    )

    return SalesAdvisorForecastRecommendationsContext(
        profile=profile_for_schema,
        recent_performance=recent_for_schema,
        rank_progress=dummy_rank_progress,
        team_comparison=None,
        skills=[],
        performance_history=performance_history,
        missing_data=missing_data,
    )


def _determine_trend_for_team(
    payload: SalesAdvisorForecastRecommendationsContext,
) -> str:
    if len(payload.performance_history) < 2:
        return "stable"
    latest = payload.performance_history[-1]
    previous = payload.performance_history[-2]
    if latest.total_points_earned >= previous.total_points_earned * 1.15:
        return "upward"
    if latest.total_points_earned <= previous.total_points_earned * 0.85:
        return "downward"
    return "stable"


def build_fallback_manager_ai_forecast_recommendations(
    payload: SalesAdvisorForecastRecommendationsContext,
) -> SalesAdvisorForecastRecommendationsResponse:
    trend = _determine_trend_for_team(payload)
    active_periods = sum(1 for p in payload.performance_history if p.total_points_earned > 0)
    confidence_label = "high" if active_periods >= 3 else ("medium" if active_periods >= 2 else "low")
    confidence_pct = 80 if confidence_label == "high" else (55 if confidence_label == "medium" else 35)

    latest_points = payload.performance_history[-1].total_points_earned if payload.performance_history else 0
    prev_points = payload.performance_history[-2].total_points_earned if len(payload.performance_history) > 1 else 0
    projected_points_in_window = max(latest_points, int(round((latest_points + prev_points) / 2)))

    main_factors = [
        {
            "title": "Recent team points pace",
            "impact": "positive" if trend == "upward" else ("negative" if trend == "downward" else "neutral"),
            "weight": "high" if latest_points > 0 else "low",
            "explanation": "Based on the most recent 30-day team points compared to the prior period.",
        }
    ]

    risk_areas = []
    if latest_points == 0:
        risk_areas.append(
            SalesAdvisorForecastRiskArea(
                title="Low recent team activity",
                description="Team activity is too limited to support reliable short-term progress.",
                reason="No points recorded in the latest period.",
                mitigation_action="Set simple weekly activity targets across the team and review in the next sync.",
                priority="high",
            )
        )

    actions = [
        SalesAdvisorForecastRecommendedAction(
            title="Set visible weekly team targets",
            description="Agree on a minimal weekly activity and points target per advisor and track progress.",
            reason="Clear short-term targets help stabilize momentum.",
            expected_impact="More consistent activity should improve near-term results.",
            priority="high",
        )
    ]

    trainings: list[SalesAdvisorForecastTrainingRecommendation] = []

    recommendation_summary = (
        "Primary focus: keep weekly targets visible and share quick wins to build momentum."
    )

    return SalesAdvisorForecastRecommendationsResponse(
        forecast=SalesAdvisorForecastSection(
            trend=trend,  # type: ignore[arg-type]
            next_rank_likelihood={
                "probability_pct": 0,
                "label": "low",
            },
            confidence_level=confidence_label,  # type: ignore[arg-type]
            confidence_pct=confidence_pct,
            confidence_label=confidence_label,  # type: ignore[arg-type]
            forecast_summary=(
                f"Team is {trend}. Last period points: {latest_points}. Confidence {confidence_label} at {confidence_pct}%."
            ),
            main_factors=main_factors,
            recommended_focus=(
                "Stabilize team activity if needed and surface one common best practice."
            ),
            projected_points_in_window=projected_points_in_window,
            projected_points_target=projected_points_in_window,
            days_window=30,
            history_used_days=90,
        ),
        risk_areas=risk_areas,
        recommended_actions=actions,
        recommended_trainings=trainings,
        recommendation_summary=recommendation_summary,
    )


def build_manager_ai_forecast_prompt(
    payload: SalesAdvisorForecastRecommendationsContext,
    baseline: SalesAdvisorForecastRecommendationsResponse,
) -> str:
    context_data = payload.model_dump(mode="json")
    baseline_data = baseline.model_dump(mode="json", by_alias=True)
    return f"""
You are generating AI forecast and recommendation content for a manager viewing their team's performance.

Return only valid JSON. Do not add markdown, explanations, or code fences.

Use the same structure and constraints as the baseline below; you may improve wording only.

Team context:
{json.dumps(context_data, indent=2)}

Baseline response:
{json.dumps(baseline_data, indent=2)}
"""


def generate_manager_ai_forecast_recommendations_with_ai(
    payload: SalesAdvisorForecastRecommendationsContext,
) -> SalesAdvisorForecastRecommendationsResponse:
    try:
        from openai import OpenAI
    except Exception as exc:
        # Fallback only
        return build_fallback_manager_ai_forecast_recommendations(payload)

    baseline = build_fallback_manager_ai_forecast_recommendations(payload)
    client = OpenAI()
    response = client.responses.create(
        model=AI_MODEL,
        input=build_manager_ai_forecast_prompt(payload, baseline),
        temperature=0.4,
        max_output_tokens=1100,
    )

    response_text = (response.output_text or "").strip()
    if not response_text:
        return baseline

    try:
        data = json.loads(response_text)
        analysis = SalesAdvisorForecastRecommendationsResponse.model_validate(data)
        return analysis
    except Exception:
        return baseline


def get_manager_ai_forecast_recommendations(
    session: Session,
    current_user: AppUser,
) -> SalesAdvisorForecastRecommendationsResponse:
    payload = build_manager_ai_forecast_context(session, current_user)
    try:
        return generate_manager_ai_forecast_recommendations_with_ai(payload)
    except Exception:
        return build_fallback_manager_ai_forecast_recommendations(payload)
