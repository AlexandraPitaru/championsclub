from fastapi import HTTPException
from sqlmodel import Session

from app.models.app_user import AppUser
from app.models.reward_catalog import RewardCatalog
from app.sales_advisor_dashboard.overview_service import validate_sales_advisor
from app.sales_advisor_shop.overview.overview_repository import get_active_rewards
from app.sales_advisor_shop.shared.stock_repository import get_stock_quantity
from app.sales_advisor_shop.overview.overview_schemas import (
    RewardAvailabilityStatus,
    SalesAdvisorShopOverviewResponse,
    ShopRewardItem,
)


LOW_STOCK_THRESHOLD = 5


def build_reward_image_url(reward: RewardCatalog) -> str:
    safe_name = "+".join((reward.name or "Reward").split())
    return f"https://placehold.co/256x256?text={safe_name}"


def compute_stock_quantity(reward_id: int) -> int:
    base = (reward_id * 31) % 20
    return int(base)


def availability_from_stock(stock_quantity: int) -> RewardAvailabilityStatus:
    if stock_quantity <= 0:
        return "out_of_stock"
    if stock_quantity <= LOW_STOCK_THRESHOLD:
        return "low_stock"
    return "available"


def build_shop_reward_item(session: Session, reward: RewardCatalog) -> ShopRewardItem:
    stock_qty = get_stock_quantity(session, reward)
    return ShopRewardItem(
        reward_id=reward.reward_id or 0,
        name=reward.name,
        description=reward.description,
        image_url=build_reward_image_url(reward),
        credit_cost=float(reward.credit_cost),
        stock_quantity=stock_qty,
        availability_status=availability_from_stock(stock_qty),
    )


def get_sales_advisor_shop_overview(
    session: Session,
    current_user: AppUser,
) -> SalesAdvisorShopOverviewResponse:
    validate_sales_advisor(current_user)

    rewards = get_active_rewards(session=session)
    reward_items = [build_shop_reward_item(session, rw) for rw in rewards]

    return SalesAdvisorShopOverviewResponse(
        available_credit=float(current_user.credit or 0.0),
        rewards=reward_items,
    )
