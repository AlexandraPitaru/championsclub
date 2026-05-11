from datetime import datetime
from fastapi import HTTPException
from sqlmodel import Session

from app.models.app_user import AppUser
from app.models.reward_catalog import RewardCatalog
from app.sales_advisor_dashboard.overview_service import validate_sales_advisor
from app.sales_advisor_shop.cart_management.cart_repository import (
    get_cart_items,
    get_or_create_cart,
    get_reward_by_id,
)
from app.sales_advisor_shop.checkout.checkout_repository import (
    clear_cart,
    create_redemption_order,
    add_order_items,
)
from app.sales_advisor_shop.checkout.checkout_schemas import (
    CheckoutResponse,
    RedeemedItem,
)
from app.sales_advisor_shop.shared.stock_repository import (
    decrement_inventory,
    get_stock_quantity,
)


def _ensure_reward_exists_and_active(reward: RewardCatalog | None) -> RewardCatalog:
    if reward is None:
        raise HTTPException(status_code=409, detail="Reward is no longer available")
    if not reward.is_active:
        raise HTTPException(status_code=409, detail="Reward is no longer available")
    return reward


def checkout_cart(session: Session, current_user: AppUser) -> CheckoutResponse:
    validate_sales_advisor(current_user)

    cart = get_or_create_cart(session, current_user.user_id or 0)
    items = get_cart_items(session, cart.cart_id or 0)
    if not items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Gather validated rewards and current stock, build pricing
    validated: list[tuple[RewardCatalog, int, float, float]] = []  # reward, qty, unit_cost, total_cost
    total_cost = 0.0

    for it in items:
        reward = _ensure_reward_exists_and_active(get_reward_by_id(session, it.reward_id))
        stock_qty = get_stock_quantity(session, reward)
        if stock_qty <= 0:
            raise HTTPException(status_code=409, detail=f"Reward '{reward.name}' is out of stock")
        if it.quantity > stock_qty:
            raise HTTPException(status_code=409, detail=f"Requested quantity for '{reward.name}' exceeds stock")
        unit = float(reward.credit_cost)
        line_total = unit * it.quantity
        total_cost += line_total
        validated.append((reward, it.quantity, unit, line_total))

    available_credit = float(current_user.credit or 0.0)
    if total_cost > available_credit:
        raise HTTPException(status_code=400, detail="Insufficient credit for checkout")

    # Perform atomic operation
    with session.begin():
        # Deduct credit
        current_user.credit = available_credit - total_cost
        session.add(current_user)

        # Decrement stock for each reward
        for reward, qty, _, _ in validated:
            try:
                decrement_inventory(session, reward, qty)
            except ValueError:
                raise HTTPException(status_code=409, detail=f"Stock changed for '{reward.name}'")

        # Create redemption order + items
        order = create_redemption_order(
            session,
            user_id=current_user.user_id or 0,
            total_credit_spent=round(total_cost, 2),
            status="completed",
        )
        add_order_items(
            session,
            order,
            (
                (reward.reward_id or 0, qty, unit, total)
                for reward, qty, unit, total in validated
            ),
        )

        # Clear cart items
        clear_cart(session, cart)

    redeemed_items = [
        RedeemedItem(
            reward_id=reward.reward_id or 0,
            reward_name=reward.name,
            quantity=qty,
            credit_cost_per_item=unit,
            total_credit_cost=total,
        )
        for reward, qty, unit, total in validated
    ]

    return CheckoutResponse(
        checkout_status="success",
        redemption_id=order.order_id or 0,
        redeemed_items=redeemed_items,
        total_credit_spent=round(total_cost, 2),
        remaining_credit=float(current_user.credit or 0.0),
        confirmation_message="Checkout completed successfully",
    )
