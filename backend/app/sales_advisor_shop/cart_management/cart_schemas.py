from pydantic import BaseModel

from app.sales_advisor_shop.overview.overview_schemas import RewardAvailabilityStatus


class CartItemResponse(BaseModel):
    cart_item_id: int
    reward_id: int
    reward_name: str
    quantity: int
    credit_cost_per_item: float
    total_credit_cost: float
    image_url: str
    availability_status: RewardAvailabilityStatus


class CartResponse(BaseModel):
    cart_id: int
    items: list[CartItemResponse]
    total_credit_cost: float
    available_credit: float
    remaining_credit_after_checkout: float
    checkout_eligible: bool


class AddCartItemRequest(BaseModel):
    reward_id: int
    quantity: int


class UpdateCartItemRequest(BaseModel):
    quantity: int
