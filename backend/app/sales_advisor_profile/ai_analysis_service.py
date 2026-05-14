import json
from datetime import datetime, timedelta, timezone

from sqlmodel import Session

from app.account.account_repository import get_current_user_profile_row
from app.models.app_user import AppUser
from app.sales_advisor_dashboard.overview_repository import (
    get_sales_advisor_team_members,
)
from app.sales_advisor_dashboard.overview_service import (
    build_rank_progress,
    build_team_comparison,
    ensure_current_user_in_team,
    validate_sales_advisor,
)
from app.sales_advisor_profile.ai_analysis_repository import (
    get_sales_advisor_recent_performance,
    get_sales_advisor_skills,
)
from app.sales_advisor_profile.ai_analysis_schemas import (
    SalesAdvisorAiAnalysisContext,
    SalesAdvisorAiAnalysisResponse,
    SalesAdvisorAiImprovementArea,
    SalesAdvisorAiSkill,
    SalesAdvisorAiSkillsAnalysis,
    SalesAdvisorAiStrength,
    SalesAdvisorProfileContext,
    SalesAdvisorRankProgressContext,
    SalesAdvisorTeamComparisonContext,
)


RECENT_PERFORMANCE_DAYS = 30
AI_MODEL = "gpt-4.1-mini"
SKILL_LEVEL_DISPLAY_SCORE = {
    "beginner": 35,
    "intermediate": 65,
    "advanced": 90,
}


def _get_recent_performance_start() -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=RECENT_PERFORMANCE_DAYS)


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
    context: SalesAdvisorAiAnalysisContext,
    *,
    levels: set[str],
    verified_only: bool = False,
) -> list[str]:
    return _dedupe_keep_order(
        [
            skill.skill_name
            for skill in context.skills
            if skill.skill_level.lower() in levels
            and (skill.verified if verified_only else True)
        ]
    )


def _build_profile_context(
    session: Session,
    current_user: AppUser,
) -> SalesAdvisorProfileContext:
    row = get_current_user_profile_row(session, current_user.user_id)

    if row is None:
        return SalesAdvisorProfileContext(
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
        )

    (
        user,
        department_id,
        department_name,
        dealership_id,
        dealership_name,
        dealer_code,
        city,
        country,
        region,
        manager_user_id,
        manager_first_name,
        manager_last_name,
        _manager_email,
    ) = row

    manager_name = None
    if manager_user_id is not None:
        manager_name = " ".join(
            [part for part in [manager_first_name, manager_last_name] if part]
        )

    return SalesAdvisorProfileContext(
        user_id=user.user_id,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        phone=user.phone,
        employee_number=user.employee_number,
        role=user.role,
        current_rank=user.rank,
        total_points=user.points or 0,
        credit=float(user.credit or 0),
        status=user.status,
        hire_date=user.hire_date,
        department_name=department_name if department_id is not None else None,
        dealership_name=dealership_name if dealership_id is not None else None,
        dealer_code=dealer_code,
        city=city,
        country=country,
        region=region,
        manager_name=manager_name or None,
    )


def build_sales_advisor_ai_analysis_context(
    session: Session,
    current_user: AppUser,
) -> SalesAdvisorAiAnalysisContext:
    validate_sales_advisor(current_user)

    profile = _build_profile_context(session, current_user)
    recent_performance = get_sales_advisor_recent_performance(
        session=session,
        user_id=current_user.user_id,
        interval_start=_get_recent_performance_start(),
    )

    rank_progress = build_rank_progress(profile.total_points)
    skills = get_sales_advisor_skills(session, current_user.user_id)

    team_comparison = None
    if current_user.manager_user_id is not None:
        team_members = get_sales_advisor_team_members(
            session=session,
            manager_user_id=current_user.manager_user_id,
        )
        team_members = ensure_current_user_in_team(current_user, team_members)
        comparison = build_team_comparison(current_user, team_members)
        team_comparison = SalesAdvisorTeamComparisonContext(**comparison.model_dump())

    missing_data: list[str] = []
    if recent_performance.total_transactions == 0:
        missing_data.append(
            "No recent sales transactions were found for the last 30 days."
        )
    if not skills:
        missing_data.append("No skill records are available for this advisor.")
    if team_comparison is None:
        missing_data.append(
            "Team comparison data is unavailable because the advisor is not linked to a manager team."
        )

    return SalesAdvisorAiAnalysisContext(
        profile=profile,
        recent_performance=recent_performance,
        rank_progress=SalesAdvisorRankProgressContext(
            current_rank=rank_progress.current_rank,
            next_rank=rank_progress.next_rank,
            current_points=rank_progress.current_points,
            points_to_next_rank=rank_progress.points_to_next_rank,
            progress_percentage=rank_progress.progress_percentage,
            is_highest_rank=rank_progress.is_highest_rank,
        ),
        team_comparison=team_comparison,
        skills=skills,
        missing_data=missing_data,
    )


def _skill_items_for_levels(
    context: SalesAdvisorAiAnalysisContext,
    *,
    levels: set[str],
) -> list[SalesAdvisorAiSkill]:
    items: list[SalesAdvisorAiSkill] = []
    seen: set[str] = set()

    for skill in context.skills:
        level = skill.skill_level.lower()
        name = skill.skill_name.strip()
        key = name.lower()

        if level not in levels or not name or key in seen:
            continue

        seen.add(key)
        items.append(
            SalesAdvisorAiSkill(
                name=name,
                level_pct=SKILL_LEVEL_DISPLAY_SCORE.get(level, 50),
            )
        )

    return items


def build_sales_advisor_ai_prompt(payload: SalesAdvisorAiAnalysisContext) -> str:
    data = payload.model_dump(mode="json")
    skill_score_table = {
        "beginner": SKILL_LEVEL_DISPLAY_SCORE["beginner"],
        "intermediate": SKILL_LEVEL_DISPLAY_SCORE["intermediate"],
        "advanced": SKILL_LEVEL_DISPLAY_SCORE["advanced"],
    }

    return f"""
You are generating an AI performance analysis for a sales advisor viewing their own profile.

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
- Use only the data provided below.
- Do not invent metrics, trends, comparisons, skill ratings, or achievements.
- Write in an encouraging, constructive, advisor-friendly tone.
- Be clear, specific, and actionable in every message. Avoid vague or generic statements.
- Always reference concrete data from the context (such as skill names, points, rank, team position, recent activity, etc) in every section.
- If data is missing, say what is missing instead of guessing.
- Every strength must include a short explanation and a supporting reason, both based on actual data.
- Every improvement area must include a reason, a suggested next step, and a priority, all based on actual data.
- Skills analysis must return strong_skills and skills_to_develop as lists of objects, each with keys 'name' (string) and 'level_pct' (integer between 0 and 100). Do NOT return lists of strings for these fields.
- Skill percentages are display scores derived only from recorded skill_level, not measured performance scores. Use exactly this mapping and do not invent different percentages: {json.dumps(skill_score_table)}.
- Put advanced skills in strong_skills. Put beginner and intermediate skills in skills_to_develop.
- Skills analysis must clearly state if skill data is missing or incomplete.
- The motivational summary must be short, realistic, and personalized, and should reference the user's current progress or next milestone.
- Avoid repeating the same advice in multiple sections.
- Return 1 to 3 strengths.
- Return 1 to 3 improvement areas.

Advisor performance context:
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


def generate_sales_advisor_ai_analysis_with_ai(
    payload: SalesAdvisorAiAnalysisContext,
) -> SalesAdvisorAiAnalysisResponse:
    try:
        from openai import OpenAI
    except Exception as exc:
        raise RuntimeError("OpenAI SDK unavailable") from exc

    client = OpenAI()
    response = client.responses.create(
        model=AI_MODEL,
        input=build_sales_advisor_ai_prompt(payload),
        temperature=0.4,
        max_output_tokens=900,
    )

    response_text = (response.output_text or "").strip()
    if not response_text:
        raise ValueError("Empty AI response")

    parsed = _extract_json_payload(response_text)
    analysis = SalesAdvisorAiAnalysisResponse.model_validate(parsed)
    return merge_ai_analysis_with_fallback(analysis, payload)


def _build_recent_performance_sentence(
    payload: SalesAdvisorAiAnalysisContext,
) -> str:
    recent = payload.recent_performance

    if recent.total_transactions == 0:
        return (
            "No recent sales transactions were recorded in the last 30 days, so the current view of performance is limited."
        )

    last_transaction_text = ""
    if recent.last_transaction_date is not None:
        last_transaction_text = (
            f" The latest recorded transaction was on {recent.last_transaction_date:%d %b %Y}."
        )

    return (
        f"In the last 30 days you recorded {recent.total_transactions} transactions, "
        f"generated EUR {recent.total_sales_amount:,.2f} in sales, sold "
        f"{recent.total_products_sold} products, and earned {recent.total_points_earned} points."
        f"{last_transaction_text}"
    )


def _build_team_comparison_sentence(
    payload: SalesAdvisorAiAnalysisContext,
) -> str:
    team_comparison = payload.team_comparison
    if team_comparison is None:
        return "Team comparison data is not available right now."

    difference = abs(team_comparison.points_difference_from_average)

    if team_comparison.comparison_to_team_average == "above":
        return (
            f"You are currently above the team average by {difference:,.0f} points and hold position "
            f"{team_comparison.team_position} out of {team_comparison.total_sales_advisors} advisors."
        )

    if team_comparison.comparison_to_team_average == "below":
        return (
            f"You are currently {difference:,.0f} points below the team average and hold position "
            f"{team_comparison.team_position} out of {team_comparison.total_sales_advisors} advisors."
        )

    return (
        f"You are currently aligned with the team average and hold position {team_comparison.team_position} "
        f"out of {team_comparison.total_sales_advisors} advisors."
    )


def _build_fallback_strengths(
    payload: SalesAdvisorAiAnalysisContext,
) -> list[SalesAdvisorAiStrength]:
    strengths: list[SalesAdvisorAiStrength] = []
    strong_skills = _skill_names_for_levels(
        payload,
        levels={"advanced"},
        verified_only=False,
    )

    if payload.team_comparison is not None and (
        payload.team_comparison.comparison_to_team_average == "above"
    ):
        strengths.append(
            SalesAdvisorAiStrength(
                title="Above team average",
                description=(
                    "Your current points place you above the average level of your team."
                ),
                supporting_reason=(
                    f"You have {payload.profile.total_points} points, which is "
                    f"{payload.team_comparison.points_difference_from_average:,.0f} points above the team average."
                ),
            )
        )

    if strong_skills:
        strengths.append(
            SalesAdvisorAiStrength(
                title="Strong skill foundation",
                description=(
                    f"You already show strong capability in {', '.join(strong_skills[:3])}."
                ),
                supporting_reason=(
                    "These skills are recorded at an advanced level in your profile data."
                ),
            )
        )

    if payload.recent_performance.total_transactions > 0:
        strengths.append(
            SalesAdvisorAiStrength(
                title="Visible recent activity",
                description=(
                    "You have recent sales activity that can be used as a concrete base for coaching and progress tracking."
                ),
                supporting_reason=(
                    f"The last 30 days include {payload.recent_performance.total_transactions} transactions, "
                    f"{payload.recent_performance.total_products_sold} products sold, and "
                    f"{payload.recent_performance.total_points_earned} points earned."
                ),
            )
        )

    if not strengths:
        strengths.append(
            SalesAdvisorAiStrength(
                title="More performance data is needed",
                description=(
                    "There is not enough recent or comparative data yet to identify clear strengths with confidence."
                ),
                supporting_reason=(
                    "Recent activity, skills data, or team comparison details are limited or unavailable."
                ),
            )
        )

    return strengths[:3]


def _build_fallback_improvement_areas(
    payload: SalesAdvisorAiAnalysisContext,
) -> list[SalesAdvisorAiImprovementArea]:
    areas: list[SalesAdvisorAiImprovementArea] = []
    skills_to_develop = _skill_names_for_levels(
        payload,
        levels={"beginner"},
        verified_only=False,
    )

    if payload.recent_performance.total_transactions == 0:
        areas.append(
            SalesAdvisorAiImprovementArea(
                title="Build recent sales momentum",
                description=(
                    "Your recent sales activity is too limited to show a clear short-term performance pattern."
                ),
                reason=(
                    "No transactions were recorded in the last 30 days."
                ),
                suggested_next_step=(
                    "Focus on creating a short list of active opportunities and aim to close at least one sale this week."
                ),
                priority="high",
            )
        )

    if payload.team_comparison is not None and (
        payload.team_comparison.comparison_to_team_average == "below"
    ):
        difference = abs(payload.team_comparison.points_difference_from_average)
        areas.append(
            SalesAdvisorAiImprovementArea(
                title="Close the gap to team average",
                description=(
                    "A focused improvement plan would help you move closer to the current pace of your team."
                ),
                reason=(
                    f"You are currently {difference:,.0f} points below the team average."
                ),
                suggested_next_step=(
                    "Set a short-term weekly target for transactions or points and review progress with your manager."
                ),
                priority="high",
            )
        )

    if skills_to_develop:
        areas.append(
            SalesAdvisorAiImprovementArea(
                title="Develop selected skills",
                description=(
                    f"The next growth opportunity is to strengthen {', '.join(skills_to_develop[:3])}."
                ),
                reason=(
                    "These skills are currently recorded at a beginner level."
                ),
                suggested_next_step=(
                    "Choose one of these skills and practice it intentionally during your next customer interactions."
                ),
                priority="medium",
            )
        )

    if (
        payload.rank_progress.points_to_next_rank is not None
        and payload.rank_progress.points_to_next_rank > 0
    ):
        areas.append(
            SalesAdvisorAiImprovementArea(
                title="Work toward the next rank",
                description=(
                    "A steady focus on points and sales activity would move you closer to the next rank milestone."
                ),
                reason=(
                    f"You still need {payload.rank_progress.points_to_next_rank} points to reach {payload.rank_progress.next_rank}."
                ),
                suggested_next_step=(
                    "Break the remaining points into a weekly target so the next rank feels achievable."
                ),
                priority="medium",
            )
        )

    if not areas:
        areas.append(
            SalesAdvisorAiImprovementArea(
                title="More data is needed for targeted coaching",
                description=(
                    "There is not enough recent or comparative information to point to one evidence-based improvement area yet."
                ),
                reason=(
                    "Recent activity, team comparison, and skill-development signals are limited."
                ),
                suggested_next_step=(
                    "Keep your activity and skill records updated so future analysis can be more specific."
                ),
                priority="low",
            )
        )

    return areas[:3]


def _build_fallback_skills_analysis(
    payload: SalesAdvisorAiAnalysisContext,
) -> SalesAdvisorAiSkillsAnalysis:
    if not payload.skills:
        return SalesAdvisorAiSkillsAnalysis(
            strong_skills=[],
            skills_to_develop=[],
            summary=(
                "Skill data is currently unavailable, so your skills could not be fully evaluated."
            ),
        )

    strong_skills = _skill_items_for_levels(
        payload,
        levels={"advanced"},
    )[:3]
    skills_to_develop = (
        _skill_items_for_levels(
            payload,
            levels={"beginner"},
        )
        + _skill_items_for_levels(
            payload,
            levels={"intermediate"},
        )
    )[:3]
    if strong_skills and skills_to_develop:
        strong = ", ".join([skill.name for skill in strong_skills])
        develop = ", ".join([skill.name for skill in skills_to_develop])
        summary = (
            f"Skill scores are based on recorded profile levels: beginner {SKILL_LEVEL_DISPLAY_SCORE['beginner']}%, "
            f"intermediate {SKILL_LEVEL_DISPLAY_SCORE['intermediate']}%, and advanced {SKILL_LEVEL_DISPLAY_SCORE['advanced']}%. "
            f"Your strongest recorded skills are {strong}, while {develop} are the best development priorities."
        )
    elif strong_skills:
        strong = ", ".join([skill.name for skill in strong_skills])
        summary = (
            f"Skill scores are based on recorded profile levels. Your advanced skills are {strong}, each shown at {SKILL_LEVEL_DISPLAY_SCORE['advanced']}%."
        )
    elif skills_to_develop:
        develop = ", ".join([skill.name for skill in skills_to_develop])
        summary = (
            f"Skill scores are based on recorded profile levels. The current development priorities are {develop}."
        )
    else:
        summary = (
            "Skill records exist, but they do not yet show a clear split between advanced strengths and development areas."
        )

    return SalesAdvisorAiSkillsAnalysis(
        strong_skills=strong_skills,
        skills_to_develop=skills_to_develop,
        summary=summary,
    )


def build_fallback_sales_advisor_ai_analysis(
    payload: SalesAdvisorAiAnalysisContext,
    *,
    ai_unavailable: bool,
) -> SalesAdvisorAiAnalysisResponse:
    prefix = (
        "AI analysis is temporarily unavailable. "
        if ai_unavailable
        else ""
    )

    ai_summary = (
        prefix
        + f"You are currently ranked {payload.profile.current_rank} with {payload.profile.total_points} points. "
        + _build_recent_performance_sentence(payload)
        + " "
        + _build_team_comparison_sentence(payload)
    ).strip()

    if payload.rank_progress.is_highest_rank:
        motivational_summary = (
            "You have already reached the top rank. Keep your consistency high and use your strongest habits to maintain that position."
        )
    elif payload.rank_progress.points_to_next_rank is not None:
        motivational_summary = (
            f"You have a clear next milestone ahead: {payload.rank_progress.points_to_next_rank} more points to reach {payload.rank_progress.next_rank}. "
            "Stay consistent and focus on the next practical step."
        )
    else:
        motivational_summary = (
            "You have a solid base to build on. Keep your focus on the next practical improvement and your progress will become easier to track."
        )

    return SalesAdvisorAiAnalysisResponse(
        ai_summary=ai_summary,
        strengths=_build_fallback_strengths(payload),
        improvement_areas=_build_fallback_improvement_areas(payload),
        skills_analysis=_build_fallback_skills_analysis(payload),
        motivational_summary=motivational_summary,
        generated_at=datetime.now(),
        model_version="fallback-v1",
        is_fallback=True,
        fallback_reason="ai_unavailable" if ai_unavailable else None,
    )


def merge_ai_analysis_with_fallback(
    analysis: SalesAdvisorAiAnalysisResponse,
    payload: SalesAdvisorAiAnalysisContext,
) -> SalesAdvisorAiAnalysisResponse:
    fallback = build_fallback_sales_advisor_ai_analysis(
        payload,
        ai_unavailable=False,
    )
    return SalesAdvisorAiAnalysisResponse(
        ai_summary=analysis.ai_summary.strip() or fallback.ai_summary,
        strengths=analysis.strengths or fallback.strengths,
        improvement_areas=analysis.improvement_areas or fallback.improvement_areas,
        skills_analysis=SalesAdvisorAiSkillsAnalysis(
            strong_skills=fallback.skills_analysis.strong_skills,
            skills_to_develop=fallback.skills_analysis.skills_to_develop,
            summary=fallback.skills_analysis.summary,
        ),
        motivational_summary=(
            analysis.motivational_summary.strip() or fallback.motivational_summary
        ),
        generated_at=datetime.now(),
        model_version=AI_MODEL,
        is_fallback=False,
        fallback_reason=None,
    )


def get_sales_advisor_ai_analysis(
    session: Session,
    current_user: AppUser,
) -> SalesAdvisorAiAnalysisResponse:
    payload = build_sales_advisor_ai_analysis_context(session, current_user)

    try:
        return generate_sales_advisor_ai_analysis_with_ai(payload)
    except Exception:
        return build_fallback_sales_advisor_ai_analysis(
            payload,
            ai_unavailable=True,
        )
