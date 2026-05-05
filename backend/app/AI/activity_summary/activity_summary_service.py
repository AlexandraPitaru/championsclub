import json
from datetime import datetime

from fastapi import HTTPException
from openai import OpenAI
from sqlmodel import Session

from app.AI.activity_summary.activity_summary_repository import (
    get_advisor_activity_summary_data,
)
from app.AI.activity_summary.activity_summary_schemas import (
    AdvisorActivitySummaryData,
    AdvisorActivitySummaryResponse,
    IntervalType,
)
from app.manager_statistics.service import (
    get_interval_start_date,
    get_user_kpis,
    validate_manager,
)
from app.models.app_user import AppUser


def _format_date(value: datetime | None) -> str | None:
    if value is None:
        return None

    return value.strftime("%d %b %Y")


def _get_interval_label(interval: IntervalType) -> str:
    labels = {
        "all": "overall performance",
        "day": "the last day",
        "week": "the last week",
        "month": "the last month",
    }
    return labels[interval]


def build_activity_summary_prompt(payload: AdvisorActivitySummaryData) -> str:
    data = payload.model_dump(mode="json")
    data["full_name"] = f"{payload.first_name} {payload.last_name}"
    data["last_transaction_display"] = _format_date(payload.last_transaction_date)

    return f"""
You are generating an AI activity summary for a manager reviewing one sales advisor profile.

Rules:
- Use only the KPI data provided below.
- Do not invent values, trends, names, goals, or metrics.
- Mention the advisor by name.
- Maximum 3 to 4 sentences.
- Reflect the advisor's performance in natural language for the selected interval.
- Include the advisor's current rank, total points, credit, transaction volume, sales amount, products sold, earned points, and last transaction date when available.
- Include one concise coaching recommendation for the manager.
- If interval is "all", describe it as overall performance, not recent performance.
- If there are zero transactions in the selected interval, say that no sales activity was recorded for that interval and recommend a manager check-in.
- Use EUR for sales amounts.
- Do not mention missing data.
- Do not mention implementation details, API, prompt, or OpenAI.
- Write in a clear, concise, coaching style.

Selected interval: {payload.interval}

Advisor KPI data:
{json.dumps(data, indent=2)}
"""


def generate_activity_summary_with_ai(payload: AdvisorActivitySummaryData) -> str:
    client = OpenAI()
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": build_activity_summary_prompt(payload)}],
        temperature=0.4,
        max_tokens=180,
    )

    return response.choices[0].message.content.strip()


def build_fallback_summary(payload: AdvisorActivitySummaryData) -> str:
    full_name = f"{payload.first_name} {payload.last_name}"
    interval_label = _get_interval_label(payload.interval)

    if payload.total_transactions == 0:
        return (
            f"{full_name} is currently ranked {payload.current_rank} with "
            f"{payload.total_points:,} total points and {payload.credit:,.2f} credit. "
            f"No sales activity was recorded for {interval_label}, so the manager "
            "should check in on pipeline progress and any support needed."
        )

    last_transaction = _format_date(payload.last_transaction_date)
    last_transaction_text = (
        f" The most recent transaction was recorded on {last_transaction}."
        if last_transaction
        else ""
    )

    return (
        f"{full_name} is currently ranked {payload.current_rank} with "
        f"{payload.total_points:,} total points and {payload.credit:,.2f} credit. "
        f"For {interval_label}, the advisor closed {payload.total_transactions} "
        f"transactions, generated EUR {payload.total_sales_amount:,.2f} in sales, "
        f"sold {payload.total_products_sold} products, and earned "
        f"{payload.total_points_earned:,} points.{last_transaction_text}"
    )


def generate_advisor_activity_summary(
    session: Session,
    current_manager: AppUser,
    advisor_id: int,
    interval: IntervalType,
) -> AdvisorActivitySummaryResponse:
    validate_manager(current_manager)

    interval_start = get_interval_start_date(interval)

    try:
        activity_data = get_advisor_activity_summary_data(
            session=session,
            manager_id=current_manager.user_id,
            advisor_id=advisor_id,
            interval=interval,
            interval_start=interval_start,
        )
    except Exception:
        # Fallback to the proven KPI query path used by the advisor profile endpoint.
        user_kpis = get_user_kpis(
            session=session,
            current_manager=current_manager,
            user_id=advisor_id,
            interval=interval,
        )
        activity_data = AdvisorActivitySummaryData(
            advisor_id=user_kpis["user_id"],
            first_name=user_kpis["first_name"],
            last_name=user_kpis["last_name"],
            email=user_kpis["email"],
            role=user_kpis["role"],
            current_rank=user_kpis["current_rank"],
            total_points=int(user_kpis["total_points"]),
            credit=float(user_kpis["credit"]),
            status=user_kpis["status"],
            interval=interval,
            total_transactions=int(user_kpis["total_transactions"]),
            total_sales_amount=float(user_kpis["total_sales_amount"]),
            total_points_earned=int(user_kpis["total_points_earned"]),
            total_products_sold=int(user_kpis["total_products_sold"]),
            last_transaction_date=user_kpis["last_transaction_date"],
        )

    if activity_data is None:
        raise HTTPException(
            status_code=404,
            detail="User not found or not under your management",
        )

    try:
        summary = generate_activity_summary_with_ai(activity_data)

        if not summary:
            raise ValueError("Empty AI response")

        return AdvisorActivitySummaryResponse(
            advisor_id=activity_data.advisor_id,
            interval=interval,
            is_ai_generated=True,
            summary=summary,
            fallback=False,
        )

    except Exception:
        return AdvisorActivitySummaryResponse(
            advisor_id=activity_data.advisor_id,
            interval=interval,
            is_ai_generated=False,
            summary=build_fallback_summary(activity_data),
            fallback=True,
        )
