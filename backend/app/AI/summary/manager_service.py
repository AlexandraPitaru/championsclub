import json

from openai import OpenAI

from app.AI.summary.manager_schemas import (
    ManagerTeamSummaryRequest,
    ManagerTeamSummaryResponse,
)


FALLBACK_MESSAGE = "Not enough data to generate a performance summary."

client = OpenAI()


def has_enough_manager_team_data(payload: ManagerTeamSummaryRequest) -> bool:
    return (
        payload.total_employees > 0
        and (
            payload.total_transactions > 0
            or payload.total_sales_amount > 0
            or payload.total_points_earned > 0
            or payload.total_products_sold > 0
            or payload.total_points > 0
        )
    )


def build_manager_team_prompt(payload: ManagerTeamSummaryRequest) -> str:
    data = payload.model_dump(mode="json")

    return f"""
You are generating an AI summary for a sales manager dashboard.

The summary is about the manager's team performance, not an individual advisor.

Rules:
- Use only the KPI data provided below.
- Do not invent values, trends, names, goals, or metrics.
- Do not compare with previous periods unless comparison data is provided.
- Maximum 3 to 5 sentences.
- Include:
  1. overall team performance overview
  2. team strengths
  3. team areas for improvement
  4. at least one actionable recommendation for the manager
- If interval is "all", describe it as overall performance, not recent performance.
- Do not mention missing data.
- Do not mention implementation details, API, prompt, or OpenAI.
- Write in a clear, concise, coaching style.

Selected interval: {payload.interval}

Team KPI data:
{json.dumps(data, indent=2)}
"""


def generate_manager_team_ai_summary(payload: ManagerTeamSummaryRequest) -> str:
    response = client.responses.create(
        model="gpt-4.1-mini",
        input=build_manager_team_prompt(payload),
        temperature=0.4,
        max_output_tokens=180,
    )

    return response.output_text.strip()


def generate_manager_team_summary(
    payload: ManagerTeamSummaryRequest,
) -> ManagerTeamSummaryResponse:
    if not has_enough_manager_team_data(payload):
        return ManagerTeamSummaryResponse(
            is_ai_generated=True,
            summary=FALLBACK_MESSAGE,
            fallback=True,
        )

    try:
        summary = generate_manager_team_ai_summary(payload)

        if not summary:
            raise ValueError("Empty AI response")

        return ManagerTeamSummaryResponse(
            is_ai_generated=True,
            summary=summary,
            fallback=False,
        )

    except Exception:
        return ManagerTeamSummaryResponse(
            is_ai_generated=True,
            summary=FALLBACK_MESSAGE,
            fallback=True,
        )