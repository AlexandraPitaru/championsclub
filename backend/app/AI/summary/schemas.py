from typing import Optional, Literal
from pydantic import BaseModel


IntervalType = Literal["all", "day", "week", "month"]
SummaryUseCase = Literal["advisor", "manager"]


class KpiSummaryRequest(BaseModel):
    use_case: SummaryUseCase
    interval: IntervalType

    total_transactions: Optional[int] = None
    sales_amount: Optional[float] = None
    points_earned: Optional[int] = None
    products_sold: Optional[int] = None
    last_transaction_date: Optional[str] = None

    current_rank: Optional[str] = None
    current_points: Optional[int] = None
    credit: Optional[float] = None
    status: Optional[str] = None


class KpiSummaryResponse(BaseModel):
    is_ai_generated: bool
    summary: str
    fallback: bool = False