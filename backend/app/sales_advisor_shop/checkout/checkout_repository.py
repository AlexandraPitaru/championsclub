from typing import Iterable

from sqlmodel import Session

from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.redemption_order import RedemptionOrder
from app.models.redemption_order_item import RedemptionOrderItem


def create_redemption_order(
    session: Session,
    user_id: int,
    total_credit_spent: float,
    status: str = "completed",
) -> RedemptionOrder:
    order = RedemptionOrder(user_id=user_id, total_credit_spent=total_credit_spent, status=status)
    session.add(order)
    session.flush()  # get order_id
    return order


def add_order_items(
    session: Session,
    order: RedemptionOrder,
    items: Iterable[tuple[int, int, float, float]],
) -> list[RedemptionOrderItem]:
    # items: (reward_id, quantity, unit_cost, total_cost)
    created: list[RedemptionOrderItem] = []
    for reward_id, quantity, unit_cost, total_cost in items:
        row = RedemptionOrderItem(
            order_id=order.order_id or 0,
            reward_id=reward_id,
            quantity=quantity,
            credit_cost_per_item=unit_cost,
            total_credit_cost=total_cost,
        )
        session.add(row)
        created.append(row)
    session.flush()
    return created


def clear_cart(session: Session, cart: Cart) -> None:
    # Delete all items for the cart
    items = session.query(CartItem).filter(CartItem.cart_id == (cart.cart_id or 0)).all()  # type: ignore[attr-defined]
    for it in items:
        session.delete(it)
    session.flush()
