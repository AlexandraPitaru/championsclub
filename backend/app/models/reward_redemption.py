from datetime import datetime
from sqlmodel import SQLModel, Field


class RewardRedemption(SQLModel, table=True):
    __tablename__ = "reward_redemption"

    redemption_id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="app_user.user_id")
    reward_id: int = Field(foreign_key="reward_catalog.reward_id")
    credit_spent: float
    status: str
    requested_at: datetime