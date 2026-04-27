from sqlmodel import SQLModel, Field


class RewardCatalog(SQLModel, table=True):
    __tablename__ = "reward_catalog"

    reward_id: int | None = Field(default=None, primary_key=True)
    name: str
    description: str | None = None
    credit_cost: float
    is_active: bool = True