from collections.abc import Sequence

from sqlmodel import Session, select

from app.models.app_user import AppUser
from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.redemption_order import RedemptionOrder
from app.models.redemption_order_item import RedemptionOrderItem
from app.models.reward_catalog import RewardCatalog


def list_active_rewards(session: Session) -> list[RewardCatalog]:
    statement = (
        select(RewardCatalog)
        .where(RewardCatalog.is_active == True)
        .order_by(RewardCatalog.credit_cost, RewardCatalog.reward_id)
    )
    return list(session.exec(statement).all())


def get_reward_by_id(session: Session, reward_id: int) -> RewardCatalog | None:
    return session.get(RewardCatalog, reward_id)


def get_or_create_cart(session: Session, user_id: int) -> Cart:
    statement = select(Cart).where(Cart.user_id == user_id)
    cart = session.exec(statement).first()

    if cart is not None:
        return cart

    cart = Cart(user_id=user_id)
    session.add(cart)
    session.commit()
    session.refresh(cart)
    return cart


def get_cart_by_user(session: Session, user_id: int) -> Cart | None:
    statement = select(Cart).where(Cart.user_id == user_id)
    return session.exec(statement).first()


def list_cart_items(session: Session, cart_id: int) -> list[CartItem]:
    statement = (
        select(CartItem)
        .where(CartItem.cart_id == cart_id)
        .order_by(CartItem.cart_item_id)
    )
    return list(session.exec(statement).all())


def get_cart_item(session: Session, cart_id: int, cart_item_id: int) -> CartItem | None:
    statement = (
        select(CartItem)
        .where(CartItem.cart_id == cart_id)
        .where(CartItem.cart_item_id == cart_item_id)
    )
    return session.exec(statement).first()


def get_cart_item_by_reward(session: Session, cart_id: int, reward_id: int) -> CartItem | None:
    statement = (
        select(CartItem)
        .where(CartItem.cart_id == cart_id)
        .where(CartItem.reward_id == reward_id)
    )
    return session.exec(statement).first()


def save_cart_item(session: Session, cart_item: CartItem) -> CartItem:
    session.add(cart_item)
    session.commit()
    session.refresh(cart_item)
    return cart_item


def delete_cart_item(session: Session, cart_item: CartItem) -> None:
    session.delete(cart_item)
    session.commit()


def delete_cart_items(session: Session, items: Sequence[CartItem]) -> None:
    for item in items:
        session.delete(item)
    session.commit()


def update_user_credit(session: Session, user: AppUser) -> AppUser:
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def create_redemption_order(
    session: Session,
    user_id: int,
    total_credit_spent: float,
    status: str = "completed",
) -> RedemptionOrder:
    order = RedemptionOrder(
        user_id=user_id,
        total_credit_spent=total_credit_spent,
        status=status,
    )
    session.add(order)
    session.commit()
    session.refresh(order)
    return order


def add_redemption_order_items(
    session: Session,
    items: list[RedemptionOrderItem],
) -> list[RedemptionOrderItem]:
    session.add_all(items)
    session.commit()
    for item in items:
        session.refresh(item)
    return items


def list_redemption_orders_for_user(
    session: Session,
    user_id: int,
) -> list[RedemptionOrder]:
    statement = (
        select(RedemptionOrder)
        .where(RedemptionOrder.user_id == user_id)
        .order_by(RedemptionOrder.created_at.desc(), RedemptionOrder.order_id.desc())
    )
    return list(session.exec(statement).all())


def list_redemption_order_items(
    session: Session,
    order_ids: list[int],
) -> list[RedemptionOrderItem]:
    if not order_ids:
        return []

    statement = (
        select(RedemptionOrderItem)
        .where(RedemptionOrderItem.order_id.in_(order_ids))
        .order_by(RedemptionOrderItem.order_id, RedemptionOrderItem.order_item_id)
    )
    return list(session.exec(statement).all())
