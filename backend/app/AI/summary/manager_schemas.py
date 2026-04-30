from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel


IntervalType = Literal["all", "day", "week", "month"]


class ManagerTeamSummaryRequest(BaseModel):
    interval: IntervalType

    total_employees: int
    total_points: int
    average_points: float
    total_credit: float

    total_transactions: int
    total_sales_amount: float
    total_points_earned: int
    total_products_sold: int
    last_transaction_date: Optional[datetime] = None


class ManagerTeamSummaryResponse(BaseModel):
    is_ai_generated: bool
    summary: str
    fallback: bool