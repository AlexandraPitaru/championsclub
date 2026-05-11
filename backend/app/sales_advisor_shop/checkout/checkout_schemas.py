from pydantic import BaseModel


class RedeemedItem(BaseModel):
    reward_id: int
    reward_name: str
    quantity: int
    credit_cost_per_item: float
    total_credit_cost: float


class CheckoutResponse(BaseModel):
    checkout_status: str
    redemption_id: int
    redeemed_items: list[RedeemedItem]
    total_credit_spent: float
    remaining_credit: float
    confirmation_message: str
