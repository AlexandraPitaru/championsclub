from datetime import datetime
from typing import Literal

from pydantic import BaseModel


AvailabilityStatus = Literal["available", "low_stock", "out_of_stock"]


class ShopRewardResponse(BaseModel):
    reward_id: int
    name: str
    description: str | None = None
    image_url: str
    credit_cost: float
    stock_quantity: int
    availability_status: AvailabilityStatus


class SalesAdvisorShopOverviewResponse(BaseModel):
    available_credit: float
    rewards: list[ShopRewardResponse]


class CartRewardSnapshot(BaseModel):
    reward_id: int
    name: str
    description: str | None = None
    image_url: str
    credit_cost: float
    stock_quantity: int
    availability_status: AvailabilityStatus


class CartItemResponse(BaseModel):
    cart_item_id: int
    reward_id: int
    reward_name: str
    quantity: int
    credit_cost_per_item: float
    total_credit_cost: float
    image_url: str
    availability_status: AvailabilityStatus
    stock_quantity: int


class SalesAdvisorCartResponse(BaseModel):
    cart_id: int
    available_credit: float
    total_credit_cost: float
    remaining_credit_after_checkout: float
    checkout_eligible: bool
    items: list[CartItemResponse]


class AddCartItemRequest(BaseModel):
    reward_id: int
    quantity: int = 1


class UpdateCartItemRequest(BaseModel):
    quantity: int


class CheckoutResponse(BaseModel):
    checkout_status: str
    redemption_id: int
    redeemed_items: list["RedemptionHistoryItemResponse"]
    total_credit_spent: float
    remaining_credit: float
    confirmation_message: str


class RedemptionHistoryItemResponse(BaseModel):
    reward_id: int
    reward_name: str
    quantity: int
    credit_cost_per_item: float
    total_credit_cost: float


class RedemptionHistoryRecordResponse(BaseModel):
    redemption_id: int
    created_at: datetime
    total_credit_spent: float
    status: str
    redeemed_items: list[RedemptionHistoryItemResponse]


class RedemptionHistoryResponse(BaseModel):
    redemptions: list[RedemptionHistoryRecordResponse]
