from datetime import datetime
from typing import Literal

from pydantic import BaseModel


IntervalType = Literal["all", "day", "week", "month"]


class AdvisorActivitySummaryData(BaseModel):
    advisor_id: int
    first_name: str
    last_name: str
    email: str
    role: str
    current_rank: str
    total_points: int
    credit: float
    status: str

    interval: IntervalType
    total_transactions: int
    total_sales_amount: float
    total_points_earned: int
    total_products_sold: int
    last_transaction_date: datetime | None


class AdvisorActivitySummaryResponse(BaseModel):
    advisor_id: int
    interval: IntervalType
    is_ai_generated: bool
    summary: str
    fallback: bool
