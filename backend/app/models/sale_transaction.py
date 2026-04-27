from datetime import datetime
from sqlmodel import SQLModel, Field


class SaleTransaction(SQLModel, table=True):
    __tablename__ = "sale_transaction"

    transaction_id: int | None = Field(default=None, primary_key=True)
    dealership_id: int = Field(foreign_key="dealership.dealership_id")
    user_id: int = Field(foreign_key="app_user.user_id")
    transaction_date: datetime
    amount: float
    points_earned: int
    status: str
