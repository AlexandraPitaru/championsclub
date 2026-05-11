from typing import Literal

from pydantic import BaseModel


RewardAvailabilityStatus = Literal["available", "low_stock", "out_of_stock"]


class ShopRewardItem(BaseModel):
    reward_id: int
    name: str
    description: str | None
    image_url: str
    credit_cost: float
    stock_quantity: int
    availability_status: RewardAvailabilityStatus


class SalesAdvisorShopOverviewResponse(BaseModel):
    available_credit: float
    rewards: list[ShopRewardItem]
