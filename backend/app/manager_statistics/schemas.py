from datetime import datetime
from pydantic import BaseModel


class UserKpiResponse(BaseModel):
    user_id: int
    first_name: str
    last_name: str
    email: str
    role: str
    current_rank: str
    total_points: int
    credit: float
    status: str

    total_transactions: int
    total_sales_amount: float
    total_points_earned: int
    total_products_sold: int
    last_transaction_date: datetime | None

class TeamKpiResponse(BaseModel):
    deashership_id: int
    dealership_name: str

    total_users: int
    active_users: int
    totak_transactions: int
    total_sales_amount: float
    total_points_earned: int
    total_products_sold: int
    