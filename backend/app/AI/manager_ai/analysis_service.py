import json
from datetime import datetime, timedelta, timezone

from sqlmodel import Session

from app.manager_statistics.service import validate_manager
from app.models.app_user import AppUser
from app.sales_advisor_profile.ai_analysis_schemas import (
    SalesAdvisorAiAnalysisResponse,
    SalesAdvisorAiImprovementArea,
    SalesAdvisorAiSkillsAnalysis,
    SalesAdvisorAiStrength,
)
from app.AI.manager_ai.analysis_repository import (
    get_team_points_summary,
    get_team_recent_performance,
    get_team_skills_aggregate,
)
from app.AI.manager_ai.analysis_schemas import (
    ManagerAiAnalysisContext,
    ManagerProfileContext,
)
from app.sales_advisor_dashboard.overview_repository import (
    get_sales_advisor_team_members,
)


RECENT_PERFORMANCE_DAYS = 30
AI_MODEL = "gpt-4.1-mini"


def _get_recent_performance_start() -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=RECENT_PERFORMANCE_DAYS)


def build_manager_ai_analysis_context(
    session: Session,
    current_user: AppUser,
) -> ManagerAiAnalysisContext:
    validate_manager(current_user)

    manager_name = " ".join(
        [p for p in [current_user.first_name, current_user.last_name] if p]
    ).strip()

    recent = get_team_recent_performance(
        session=session,
        manager_user_id=current_user.user_id,
        interval_start=_get_recent_performance_start(),
    )

    points_summary = get_team_points_summary(
        session=session,
        manager_user_id=current_user.user_id,
    )

    skills_agg = get_team_skills_aggregate(
        session=session,
        manager_user_id=current_user.user_id,
    )

    members = get_sales_advisor_team_members(session, current_user.user_id)
    team_size = len(members)

    profile = ManagerProfileContext(
        manager_user_id=current_user.user_id,
        manager_name=manager_name or f"Manager #{current_user.user_id}",
        team_size=team_size,
    )

    missing: list[str] = []
    if recent.total_transactions == 0:
        missing.append(
            "No recent team sales transactions found for the last 30 days."
        )
    if not skills_agg:
        missing.append("No team skill records are available.")

    return ManagerAiAnalysisContext(
        profile=profile,
        recent_performance=recent,
        points_summary=points_summary,
        skills_aggregate=skills_agg,
        missing_data=missing,
    )


def build_manager_ai_prompt(payload: ManagerAiAnalysisContext) -> str:
    data = payload.model_dump(mode="json")
    return f"""
You are generating an AI performance analysis for a manager reviewing the performance of their entire sales advisor team.

Return only valid JSON. Do not add markdown, explanations, or code fences.

Required JSON structure:
{{
  "ai_summary": "string",
  "strengths": [
    {{
      "title": "string",
      "description": "string",
      "supporting_reason": "string"
    }}
  ],
  "improvement_areas": [
    {{
      "title": "string",
      "description": "string",
      "reason": "string",
      "suggested_next_step": "string",
      "priority": "high|medium|low"
    }}
  ],
  "skills_analysis": {{
    "strong_skills": [{{"name": "string", "level_pct": 0}}],
    "skills_to_develop": [{{"name": "string", "level_pct": 0}}],
    "summary": "string"
  }},
  "motivational_summary": "string"
}}

Rules:
- Only use the team data provided below.
- Do not invent metrics, trends, or achievements.
- Write in an encouraging, constructive tone for a team-coaching context.
- Be specific when data exists; state clearly when data is missing.
- Return 1 to 3 strengths and 1 to 3 improvement areas.

Team performance context:
{json.dumps(data, indent=2)}
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


def _fallback_team_strengths(payload: ManagerAiAnalysisContext) -> list[SalesAdvisorAiStrength]:
    strengths: list[SalesAdvisorAiStrength] = []

    if payload.recent_performance.total_transactions > 0:
        strengths.append(
            SalesAdvisorAiStrength(
                title="Active recent performance",
                description=(
                    "Your team recorded recent sales activity that can be used as a concrete base for coaching and tracking."
                ),
                supporting_reason=(
                    f"In the last 30 days the team had {payload.recent_performance.total_transactions} transactions, "
                    f"{payload.recent_performance.total_products_sold} products sold, and "
                    f"{payload.recent_performance.total_points_earned} points earned."
                ),
            )
        )

    # Derive a few strong skills by highest advanced ratio
    strong_skill_names: list[str] = []
    for agg in sorted(
        payload.skills_aggregate,
        key=lambda a: (a.advanced_count / a.total_users_with_skill) if a.total_users_with_skill else 0,
        reverse=True,
    )[:3]:
        if agg.total_users_with_skill > 0 and agg.advanced_count > 0:
            strong_skill_names.append(agg.skill_name)

    if strong_skill_names:
        strengths.append(
            SalesAdvisorAiStrength(
                title="Team skill strengths",
                description=(
                    f"The team shows strong capability in {', '.join(strong_skill_names)}."
                ),
                supporting_reason=(
                    "These skills have the highest share of advanced records across the team."
                ),
            )
        )

    if not strengths:
        strengths.append(
            SalesAdvisorAiStrength(
                title="More team data is needed",
                description=(
                    "There is not enough recent or skills data to identify clear strengths yet."
                ),
                supporting_reason=(
                    "Recent activity or skill records are limited or unavailable."
                ),
            )
        )

    return strengths[:3]


def _fallback_team_improvements(payload: ManagerAiAnalysisContext) -> list[SalesAdvisorAiImprovementArea]:
    areas: list[SalesAdvisorAiImprovementArea] = []

    if payload.recent_performance.total_transactions == 0:
        areas.append(
            SalesAdvisorAiImprovementArea(
                title="Kick-start recent momentum",
                description=(
                    "Team activity is too limited to identify a short-term performance pattern."
                ),
                reason=(
                    "No transactions were recorded in the last 30 days."
                ),
                suggested_next_step=(
                    "Set a simple weekly activity target (e.g., transactions or points) and review progress in the next team meeting."
                ),
                priority="high",
            )
        )

    # Choose skills with highest beginner ratio as development areas
    to_develop: list[str] = []
    for agg in sorted(
        payload.skills_aggregate,
        key=lambda a: (a.beginner_count / a.total_users_with_skill) if a.total_users_with_skill else 0,
        reverse=True,
    )[:3]:
        if agg.total_users_with_skill > 0 and agg.beginner_count > 0:
            to_develop.append(agg.skill_name)

    if to_develop:
        areas.append(
            SalesAdvisorAiImprovementArea(
                title="Focus team skill development",
                description=(
                    f"Next growth opportunities are to strengthen {', '.join(to_develop)} across the team."
                ),
                reason=(
                    "These skills currently have the highest share of beginner-level records."
                ),
                suggested_next_step=(
                    "Select one common skill and organize a short peer-practice or micro-training this week."
                ),
                priority="medium",
            )
        )

    if not areas:
        areas.append(
            SalesAdvisorAiImprovementArea(
                title="Gather more evidence for targeted coaching",
                description=(
                    "There isn't enough recent or skills information to suggest a focused improvement area yet."
                ),
                reason=(
                    "Recent activity and skill-development signals are limited."
                ),
                suggested_next_step=(
                    "Encourage advisors to update skills and log activity so future analysis is more specific."
                ),
                priority="low",
            )
        )

    return areas[:3]


def _fallback_team_skills_analysis(payload: ManagerAiAnalysisContext) -> SalesAdvisorAiSkillsAnalysis:
    if not payload.skills_aggregate:
        return SalesAdvisorAiSkillsAnalysis(
            strong_skills=[],
            skills_to_develop=[],
            summary=(
                "Team skill data is currently unavailable, so skills could not be fully evaluated."
            ),
        )

    def pct(part: int, total: int) -> int:
        if total <= 0:
            return 0
        return int(round((part / total) * 100))

    sorted_by_total = sorted(
        payload.skills_aggregate, key=lambda s: s.total_users_with_skill, reverse=True
    )

    strong: list[dict] = []
    develop: list[dict] = []
    for item in sorted_by_total:
        total = item.total_users_with_skill
        if total <= 0:
            continue
        adv_pct = pct(item.advanced_count, total)
        beg_pct = pct(item.beginner_count, total)
        if adv_pct >= 50 and len(strong) < 3:
            strong.append({"name": item.skill_name, "level_pct": adv_pct})
        if beg_pct >= 40 and len(develop) < 3:
            develop.append({"name": item.skill_name, "level_pct": beg_pct})

    if strong and develop:
        summary = (
            f"The team shows strength in {', '.join([s['name'] for s in strong])}, while the clearest development opportunities are "
            f"{', '.join([s['name'] for s in develop])}."
        )
    elif strong:
        summary = (
            f"The team demonstrates clear strengths in {', '.join([s['name'] for s in strong])}. More recent skill updates would help identify common gaps."
        )
    elif develop:
        summary = (
            f"Team records suggest a need to focus on {', '.join([s['name'] for s in develop])}. Strong evidence of advanced skills is still limited."
        )
    else:
        summary = (
            "Skill records exist, but they do not clearly separate strong areas from development needs yet."
        )

    return SalesAdvisorAiSkillsAnalysis(
        strong_skills=strong,
        skills_to_develop=develop,
        summary=summary,
    )


def build_fallback_manager_ai_analysis(payload: ManagerAiAnalysisContext, *, ai_unavailable: bool) -> SalesAdvisorAiAnalysisResponse:
    prefix = "AI analysis is temporarily unavailable. " if ai_unavailable else ""

    recent = payload.recent_performance
    points = payload.points_summary

    recent_sentence = (
        "No recent team sales transactions were recorded in the last 30 days, so the view is limited."
        if recent.total_transactions == 0
        else (
            f"In the last 30 days the team logged {recent.total_transactions} transactions, "
            f"EUR {recent.total_sales_amount:,.2f} in sales, {recent.total_products_sold} products sold, "
            f"and {recent.total_points_earned} points."
            + (
                f" Latest transaction on {recent.last_transaction_date:%d %b %Y}."
                if recent.last_transaction_date is not None
                else ""
            )
        )
    )

    summary = (
        prefix
        + f"Team average points: {points.average_points:,.0f}. Total team points: {points.total_points:,.0f}. "
        + recent_sentence
    ).strip()

    motivational = (
        "Keep your team's consistency high and amplify what already works well."
        if points.top_points is not None and points.bottom_points is not None and points.top_points - points.bottom_points < 50
        else "Focus on setting clear weekly targets and share quick wins to build momentum."
    )

    return SalesAdvisorAiAnalysisResponse(
        ai_summary=summary,
        strengths=_fallback_team_strengths(payload),
        improvement_areas=_fallback_team_improvements(payload),
        skills_analysis=_fallback_team_skills_analysis(payload),
        motivational_summary=motivational,
    )


def generate_manager_ai_analysis_with_ai(
    payload: ManagerAiAnalysisContext,
) -> SalesAdvisorAiAnalysisResponse:
    try:
        from openai import OpenAI
    except Exception as exc:
        raise RuntimeError("OpenAI SDK unavailable") from exc

    client = OpenAI()
    response = client.responses.create(
        model=AI_MODEL,
        input=build_manager_ai_prompt(payload),
        temperature=0.4,
        max_output_tokens=900,
    )

    response_text = (response.output_text or "").strip()
    if not response_text:
        raise ValueError("Empty AI response")

    parsed = _extract_json_payload(response_text)
    analysis = SalesAdvisorAiAnalysisResponse.model_validate(parsed)

    # We can optionally merge with fallback to ensure minimum content quality
    fallback = build_fallback_manager_ai_analysis(payload, ai_unavailable=False)
    return SalesAdvisorAiAnalysisResponse(
        ai_summary=analysis.ai_summary.strip() or fallback.ai_summary,
        strengths=analysis.strengths or fallback.strengths,
        improvement_areas=analysis.improvement_areas or fallback.improvement_areas,
        skills_analysis=(
            analysis.skills_analysis
            if getattr(analysis.skills_analysis, "summary", "").strip()
            else fallback.skills_analysis
        ),
        motivational_summary=(
            analysis.motivational_summary.strip() or fallback.motivational_summary
        ),
    )


def get_manager_ai_analysis(
    session: Session,
    current_user: AppUser,
) -> SalesAdvisorAiAnalysisResponse:
    payload = build_manager_ai_analysis_context(session, current_user)

    try:
        return generate_manager_ai_analysis_with_ai(payload)
    except Exception:
        return build_fallback_manager_ai_analysis(payload, ai_unavailable=True)
