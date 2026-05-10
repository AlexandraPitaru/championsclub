from sqlmodel import SQLModel, Field


class RedemptionOrderItem(SQLModel, table=True):
    __tablename__ = "redemption_order_item"

    order_item_id: int | None = Field(default=None, primary_key=True)
    order_id: int = Field(foreign_key="redemption_order.order_id")
    reward_id: int = Field(foreign_key="reward_catalog.reward_id")
    quantity: int
    credit_cost_per_item: float
    total_credit_cost: float
