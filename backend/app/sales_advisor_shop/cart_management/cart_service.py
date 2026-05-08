from fastapi import HTTPException
from sqlmodel import Session

from app.models.app_user import AppUser
from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.reward_catalog import RewardCatalog
from app.sales_advisor_dashboard.overview_service import validate_sales_advisor
from app.sales_advisor_shop.overview.overview_service import (
    availability_from_stock,
    build_reward_image_url,
)
from app.sales_advisor_shop.shared.stock_repository import get_stock_quantity
from app.sales_advisor_shop.cart_management.cart_repository import (
    add_or_increment_item,
    delete_item,
    get_cart_item,
    get_cart_item_by_reward,
    get_cart_items,
    get_or_create_cart,
    get_reward_by_id,
    touch_cart,
    update_item_quantity,
)
from app.sales_advisor_shop.cart_management.cart_schemas import (
    AddCartItemRequest,
    CartItemResponse,
    CartResponse,
    UpdateCartItemRequest,
)


def _ensure_reward_exists_and_active(reward: RewardCatalog | None) -> RewardCatalog:
    if reward is None:
        raise HTTPException(status_code=404, detail="Reward not found")
    if not reward.is_active:
        raise HTTPException(status_code=400, detail="Reward is not available")
    return reward


def _validate_quantity_positive(quantity: int) -> None:
    if quantity is None or quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")


def _validate_stock_sufficient(stock: int, desired_qty: int) -> None:
    if stock <= 0:
        raise HTTPException(status_code=400, detail="Reward is out of stock")
    if desired_qty > stock:
        raise HTTPException(status_code=400, detail="Requested quantity exceeds stock")


def _build_cart_item_response(session: Session, item: CartItem) -> CartItemResponse:
    reward = _ensure_reward_exists_and_active(get_reward_by_id(session, item.reward_id))
    stock_qty = get_stock_quantity(session, reward)
    return CartItemResponse(
        cart_item_id=item.cart_item_id or 0,
        reward_id=reward.reward_id or 0,
        reward_name=reward.name,
        quantity=item.quantity,
        credit_cost_per_item=float(reward.credit_cost),
        total_credit_cost=float(reward.credit_cost) * item.quantity,
        image_url=build_reward_image_url(reward),
        availability_status=availability_from_stock(stock_qty),
    )


def _build_cart_response(session: Session, current_user: AppUser, cart: Cart) -> CartResponse:
    items = [_build_cart_item_response(session, it) for it in get_cart_items(session, cart.cart_id or 0)]
    total_cost = round(sum(it.total_credit_cost for it in items), 2)
    available_credit = float(current_user.credit or 0.0)
    remaining = round(available_credit - total_cost, 2)

    # Eligible when within credit and all items within stock at time of fetch
    all_in_stock = True
    for it in items:
        reward = get_reward_by_id(session, it.reward_id)
        if reward is None:
            all_in_stock = False
            break
        stock_qty = get_stock_quantity(session, reward)
        if it.quantity > stock_qty or stock_qty <= 0:
            all_in_stock = False
            break

    checkout_eligible = (total_cost > 0) and (total_cost <= available_credit) and all_in_stock

    return CartResponse(
        cart_id=cart.cart_id or 0,
        items=items,
        total_credit_cost=total_cost,
        available_credit=available_credit,
        remaining_credit_after_checkout=remaining,
        checkout_eligible=checkout_eligible,
    )


def get_cart(session: Session, current_user: AppUser) -> CartResponse:
    validate_sales_advisor(current_user)
    cart = get_or_create_cart(session, current_user.user_id or 0)
    return _build_cart_response(session, current_user, cart)


def add_item_to_cart(session: Session, current_user: AppUser, payload: AddCartItemRequest) -> tuple[CartResponse, bool]:
    validate_sales_advisor(current_user)
    _validate_quantity_positive(payload.quantity)

    # Ensure reward exists and stock is sufficient for desired new quantity
    reward = _ensure_reward_exists_and_active(get_reward_by_id(session, payload.reward_id))
    stock_qty = get_stock_quantity(session, reward)

    cart = get_or_create_cart(session, current_user.user_id or 0)
    existing = get_cart_item_by_reward(session, cart.cart_id or 0, reward.reward_id or 0)
    new_qty = payload.quantity + (existing.quantity if existing else 0)
    _validate_stock_sufficient(stock_qty, new_qty)

    item, created = add_or_increment_item(session, cart.cart_id or 0, reward.reward_id or 0, payload.quantity)
    touch_cart(session, cart)
    return _build_cart_response(session, current_user, cart), created


def update_cart_item(session: Session, current_user: AppUser, cart_item_id: int, payload: UpdateCartItemRequest) -> CartResponse:
    validate_sales_advisor(current_user)
    _validate_quantity_positive(payload.quantity)

    cart = get_or_create_cart(session, current_user.user_id or 0)
    item = get_cart_item(session, cart.cart_id or 0, cart_item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Cart item not found")

    reward = _ensure_reward_exists_and_active(get_reward_by_id(session, item.reward_id))
    stock_qty = get_stock_quantity(session, reward)
    _validate_stock_sufficient(stock_qty, payload.quantity)

    update_item_quantity(session, item, payload.quantity)
    touch_cart(session, cart)
    return _build_cart_response(session, current_user, cart)


def remove_cart_item(session: Session, current_user: AppUser, cart_item_id: int) -> None:
    validate_sales_advisor(current_user)
    cart = get_or_create_cart(session, current_user.user_id or 0)
    item = get_cart_item(session, cart.cart_id or 0, cart_item_id)
    if item is None:
        return  # Idempotent delete
    delete_item(session, item)
    touch_cart(session, cart)
