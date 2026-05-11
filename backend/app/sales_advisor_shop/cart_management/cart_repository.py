from datetime import datetime
from typing import Optional

from sqlmodel import Session, select

from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.reward_catalog import RewardCatalog


def get_or_create_cart(session: Session, user_id: int) -> Cart:
    statement = select(Cart).where(Cart.user_id == user_id)
    cart = session.exec(statement).first()
    if cart is None:
        cart = Cart(user_id=user_id)
        session.add(cart)
        session.commit()
        session.refresh(cart)
    return cart


def touch_cart(session: Session, cart: Cart) -> None:
    cart.updated_at = datetime.utcnow()
    session.add(cart)
    session.commit()


def get_cart_items(session: Session, cart_id: int) -> list[CartItem]:
    statement = select(CartItem).where(CartItem.cart_id == cart_id)
    return list(session.exec(statement).all())


def get_cart_item(session: Session, cart_id: int, cart_item_id: int) -> Optional[CartItem]:
    statement = (
        select(CartItem)
        .where(CartItem.cart_id == cart_id)
        .where(CartItem.cart_item_id == cart_item_id)
    )
    return session.exec(statement).first()


def get_cart_item_by_reward(session: Session, cart_id: int, reward_id: int) -> Optional[CartItem]:
    statement = (
        select(CartItem)
        .where(CartItem.cart_id == cart_id)
        .where(CartItem.reward_id == reward_id)
    )
    return session.exec(statement).first()


def add_or_increment_item(session: Session, cart_id: int, reward_id: int, quantity: int) -> tuple[CartItem, bool]:
    item = get_cart_item_by_reward(session, cart_id, reward_id)
    created = False
    if item is None:
        item = CartItem(cart_id=cart_id, reward_id=reward_id, quantity=quantity)
        session.add(item)
        created = True
    else:
        item.quantity += quantity
        session.add(item)
    session.commit()
    session.refresh(item)
    return item, created


def update_item_quantity(session: Session, item: CartItem, quantity: int) -> CartItem:
    item.quantity = quantity
    session.add(item)
    session.commit()
    session.refresh(item)
    return item


def delete_item(session: Session, item: CartItem) -> None:
    session.delete(item)
    session.commit()


def get_reward_by_id(session: Session, reward_id: int) -> Optional[RewardCatalog]:
    return session.get(RewardCatalog, reward_id)
