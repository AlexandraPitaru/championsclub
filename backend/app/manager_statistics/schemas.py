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

    interval: str
    total_transactions: int
    total_sales_amount: float
    total_points_earned: int
    total_products_sold: int
    last_transaction_date: datetime | None


class TeamKpisData(BaseModel):
    total_employees: int
    total_points: int
    average_points: float
    total_credit: float

    interval: str
    total_transactions: int
    total_sales_amount: float
    total_points_earned: int
    total_products_sold: int
    last_transaction_date: datetime | None


class TeamKpiResponse(BaseModel):
    manager_id: int
    team_kpis: TeamKpisData

#Modifications for Manager filtering users by team that he manages
class ManagedUserResponse(BaseModel):
    user_id: int
    first_name: str
    last_name: str
    email: str
    role: str
    current_rank: str
    total_points: int
    credit: float
    status: str