from collections import defaultdict
from typing import Dict, List

from sqlmodel import Session, select

from app.models.redemption_order import RedemptionOrder
from app.models.redemption_order_item import RedemptionOrderItem
from app.models.reward_catalog import RewardCatalog


def get_user_redemption_orders(session: Session, user_id: int) -> list[RedemptionOrder]:
    statement = (
        select(RedemptionOrder)
        .where(RedemptionOrder.user_id == user_id)
        .order_by(RedemptionOrder.created_at.desc())
    )
    return list(session.exec(statement).all())


def get_items_for_orders(session: Session, order_ids: list[int]) -> Dict[int, list[tuple[RedemptionOrderItem, str]]]:
    if not order_ids:
        return {}

    statement = (
        select(RedemptionOrderItem, RewardCatalog.name)
        .where(RedemptionOrderItem.order_id.in_(order_ids))
        .join(RewardCatalog, RewardCatalog.reward_id == RedemptionOrderItem.reward_id)
    )
    result = session.exec(statement).all()

    items_by_order: Dict[int, list[tuple[RedemptionOrderItem, str]]] = defaultdict(list)
    for row in result:
        # row is a tuple (RedemptionOrderItem, name)
        item, reward_name = row
        items_by_order[item.order_id].append((item, reward_name))

    return items_by_order
