from datetime import datetime
from sqlmodel import SQLModel, Field


class RedemptionOrder(SQLModel, table=True):
    __tablename__ = "redemption_order"

    order_id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="app_user.user_id")
    total_credit_spent: float
    status: str = "completed"
    created_at: datetime = Field(default_factory=datetime.utcnow)
