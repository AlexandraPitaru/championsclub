from pydantic import BaseModel


class RedeemedHistoryItem(BaseModel):
    reward_id: int
    reward_name: str
    quantity: int
    credit_cost_per_item: float
    total_credit_cost: float


class RedemptionHistoryEntry(BaseModel):
    redemption_id: int
    redeemed_items: list[RedeemedHistoryItem]
    total_credit_spent: float
    status: str
    created_at: str


class RedemptionHistoryResponse(BaseModel):
    redemptions: list[RedemptionHistoryEntry]
