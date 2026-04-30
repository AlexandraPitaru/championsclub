import json
from openai import OpenAI

from app.AI.summary.schemas import KpiSummaryRequest, KpiSummaryResponse


FALLBACK_MESSAGE = "Not enough data to generate a performance summary."

client = OpenAI()


def has_enough_data(payload: KpiSummaryRequest) -> bool:
    numeric_values = [
        payload.total_transactions,
        payload.sales_amount,
        payload.points_earned,
        payload.products_sold,
        payload.current_points,
        payload.credit,
    ]

    return any(
        value is not None and value > 0
        for value in numeric_values
    )


def build_prompt(payload: KpiSummaryRequest) -> str:
    available_data = payload.model_dump(exclude_none=True)

    return f"""
You are generating a short performance summary for a sales application.

Rules:
- Use only the KPI data provided below.
- Do not invent values, trends, or metrics.
- Maximum 3 to 5 sentences.
- Include:
  1. overall performance overview
  2. strengths
  3. areas for improvement
  4. at least one actionable recommendation
- If the data is limited, keep the summary general but still based only on the provided fields.
- Do not mention internal implementation details.
- Write in a clear, friendly, coaching style.

Use case: {payload.use_case}
Selected interval: {payload.interval}

KPI data:
{json.dumps(available_data, indent=2)}
"""


def generate_ai_summary(payload: KpiSummaryRequest) -> str:
    prompt = build_prompt(payload)

    response = client.responses.create(
        model="gpt-4.1-mini",
        input=prompt,
        temperature=0.4,
        max_output_tokens=180,
    )

    return response.output_text.strip()


def generate_kpi_summary(payload: KpiSummaryRequest) -> KpiSummaryResponse:
    if not has_enough_data(payload):
        return KpiSummaryResponse(
            is_ai_generated=True,
            summary=FALLBACK_MESSAGE,
            fallback=True,
        )

    try:
        summary = generate_ai_summary(payload)

        if not summary:
            raise ValueError("Empty AI summary")

        return KpiSummaryResponse(
            is_ai_generated=True,
            summary=summary,
            fallback=False,
        )

    except Exception:
        return KpiSummaryResponse(
            is_ai_generated=True,
            summary=FALLBACK_MESSAGE,
            fallback=True,
        )