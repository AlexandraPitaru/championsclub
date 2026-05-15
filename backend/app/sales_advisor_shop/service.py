from fastapi import HTTPException
from sqlmodel import Session

from app.models.app_user import AppUser
from app.models.redemption_order import RedemptionOrder
from app.models.cart_item import CartItem
from app.models.redemption_order_item import RedemptionOrderItem
from app.models.reward_catalog import RewardCatalog
from app.sales_advisor_shop.repository import (
    delete_cart_item,
    get_cart_by_user,
    get_cart_item,
    get_cart_item_by_reward,
    get_or_create_cart,
    get_reward_by_id,
    list_active_rewards,
    list_cart_items,
    list_redemption_order_items,
    list_redemption_orders_for_user,
    save_cart_item,
)
from app.sales_advisor_shop.schemas import (
    AddCartItemRequest,
    CartItemResponse,
    CheckoutResponse,
    RedemptionHistoryResponse,
    RedemptionHistoryItemResponse,
    RedemptionHistoryRecordResponse,
    SalesAdvisorCartResponse,
    SalesAdvisorShopOverviewResponse,
    ShopRewardResponse,
    UpdateCartItemRequest,
)


LOW_STOCK_THRESHOLD = 5
DEFAULT_REWARD_IMAGE_URL = "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80"
CREDIT_EPSILON = 1e-6


def normalize_credit(value: float | int | None) -> float:
    result = round(float(value or 0), 2)
    # Convert near-zero values (including -0.0) to 0.0 to avoid precision edge cases.
    return 0.0 if abs(result) <= CREDIT_EPSILON else result


def validate_sales_advisor(current_user: AppUser) -> None:
    if current_user.role.lower() != "sales_advisor":
        raise HTTPException(
            status_code=403,
            detail="Access denied: Sales advisor role required",
        )


def get_reward_image_url(reward: RewardCatalog) -> str:
    reward_name = reward.name.lower()

    if "headphone" in reward_name or "earbud" in reward_name or "speaker" in reward_name:
        return "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80"
    if "watch" in reward_name:
        return "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80"
    if "voucher" in reward_name or "card" in reward_name:
        return "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=80"
    if "backpack" in reward_name or "travel" in reward_name:
        return "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80"
    if "coffee" in reward_name or "espresso" in reward_name:
        return "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80"
    if "console" in reward_name or "gaming" in reward_name:
        return "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=900&q=80"

    return DEFAULT_REWARD_IMAGE_URL


def get_availability_status(stock_quantity: int) -> str:
    if stock_quantity <= 0:
        return "out_of_stock"
    if stock_quantity <= LOW_STOCK_THRESHOLD:
        return "low_stock"
    return "available"


def map_reward_response(reward: RewardCatalog) -> ShopRewardResponse:
    return ShopRewardResponse(
        reward_id=reward.reward_id,
        name=reward.name,
        description=reward.description,
        image_url=get_reward_image_url(reward),
        credit_cost=reward.credit_cost,
        stock_quantity=reward.stock_quantity,
        availability_status=get_availability_status(reward.stock_quantity),
    )


def build_cart_response(
    session: Session,
    current_user: AppUser,
) -> SalesAdvisorCartResponse:
    cart = get_or_create_cart(session, current_user.user_id)
    items = list_cart_items(session, cart.cart_id)

    reward_cache: dict[int, RewardCatalog] = {}
    response_items: list[CartItemResponse] = []
    total_credit_cost = 0.0

    for item in items:
        reward = reward_cache.get(item.reward_id)
        if reward is None:
            reward = get_reward_by_id(session, item.reward_id)
            if reward is None:
                continue
            reward_cache[item.reward_id] = reward

        line_total = normalize_credit(reward.credit_cost * item.quantity)
        total_credit_cost += line_total
        response_items.append(
            CartItemResponse(
                cart_item_id=item.cart_item_id,
                reward_id=reward.reward_id,
                reward_name=reward.name,
                quantity=item.quantity,
                credit_cost_per_item=normalize_credit(reward.credit_cost),
                total_credit_cost=line_total,
                image_url=get_reward_image_url(reward),
                availability_status=get_availability_status(reward.stock_quantity),
                stock_quantity=reward.stock_quantity,
            )
        )

    total_credit_cost = normalize_credit(total_credit_cost)
    available_credit = normalize_credit(current_user.credit)
    remaining_credit_after_checkout = normalize_credit(available_credit - total_credit_cost)
    checkout_eligible = bool(response_items) and remaining_credit_after_checkout >= -CREDIT_EPSILON

    return SalesAdvisorCartResponse(
        cart_id=cart.cart_id,
        available_credit=available_credit,
        total_credit_cost=total_credit_cost,
        remaining_credit_after_checkout=remaining_credit_after_checkout,
        checkout_eligible=checkout_eligible,
        items=response_items,
    )


def get_shop_overview(
    session: Session,
    current_user: AppUser,
) -> SalesAdvisorShopOverviewResponse:
    validate_sales_advisor(current_user)
    rewards = [map_reward_response(reward) for reward in list_active_rewards(session)]

    return SalesAdvisorShopOverviewResponse(
        available_credit=current_user.credit or 0,
        rewards=rewards,
    )


def get_cart(
    session: Session,
    current_user: AppUser,
) -> SalesAdvisorCartResponse:
    validate_sales_advisor(current_user)
    return build_cart_response(session, current_user)


def ensure_reward_can_be_added(
    reward: RewardCatalog,
    quantity: int,
) -> None:
    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than zero")
    if not reward.is_active:
        raise HTTPException(status_code=400, detail="Reward is not available")
    if reward.stock_quantity <= 0:
        raise HTTPException(status_code=400, detail="Reward is out of stock")
    if quantity > reward.stock_quantity:
        raise HTTPException(status_code=400, detail="Requested quantity exceeds stock")


def validate_reward_for_checkout(reward: RewardCatalog, quantity: int) -> None:
    if not reward.is_active:
        raise HTTPException(status_code=409, detail="Reward is no longer available")
    if reward.stock_quantity <= 0:
        raise HTTPException(status_code=409, detail="Reward is out of stock")
    if quantity > reward.stock_quantity:
        raise HTTPException(status_code=409, detail="Requested quantity exceeds available stock")


def add_cart_item(
    session: Session,
    current_user: AppUser,
    payload: AddCartItemRequest,
) -> SalesAdvisorCartResponse:
    validate_sales_advisor(current_user)
    reward = get_reward_by_id(session, payload.reward_id)
    if reward is None:
        raise HTTPException(status_code=404, detail="Reward not found")

    cart = get_or_create_cart(session, current_user.user_id)
    existing_item = get_cart_item_by_reward(session, cart.cart_id, payload.reward_id)
    next_quantity = payload.quantity if existing_item is None else existing_item.quantity + payload.quantity

    ensure_reward_can_be_added(reward, next_quantity)

    if existing_item is None:
        cart_item = CartItem(
            cart_id=cart.cart_id,
            reward_id=payload.reward_id,
            quantity=payload.quantity,
        )
    else:
        existing_item.quantity = next_quantity
        cart_item = existing_item

    save_cart_item(session, cart_item)
    return build_cart_response(session, current_user)


def update_cart_item_quantity(
    session: Session,
    current_user: AppUser,
    cart_item_id: int,
    payload: UpdateCartItemRequest,
) -> SalesAdvisorCartResponse:
    validate_sales_advisor(current_user)
    cart = get_or_create_cart(session, current_user.user_id)
    cart_item = get_cart_item(session, cart.cart_id, cart_item_id)
    if cart_item is None:
        raise HTTPException(status_code=404, detail="Cart item not found")

    if payload.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than zero")

    reward = get_reward_by_id(session, cart_item.reward_id)
    if reward is None:
        raise HTTPException(status_code=404, detail="Reward not found")

    ensure_reward_can_be_added(reward, payload.quantity)
    cart_item.quantity = payload.quantity
    save_cart_item(session, cart_item)
    return build_cart_response(session, current_user)


def remove_cart_item(
    session: Session,
    current_user: AppUser,
    cart_item_id: int,
) -> SalesAdvisorCartResponse:
    validate_sales_advisor(current_user)
    cart = get_or_create_cart(session, current_user.user_id)
    cart_item = get_cart_item(session, cart.cart_id, cart_item_id)
    if cart_item is None:
        raise HTTPException(status_code=404, detail="Cart item not found")

    delete_cart_item(session, cart_item)
    return build_cart_response(session, current_user)


def checkout_cart(
    session: Session,
    current_user: AppUser,
) -> CheckoutResponse:
    validate_sales_advisor(current_user)
    cart = get_cart_by_user(session, current_user.user_id)
    if cart is None:
        raise HTTPException(status_code=400, detail="No active cart found")

    cart_items = list_cart_items(session, cart.cart_id)
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    rewards_by_id: dict[int, RewardCatalog] = {}
    total_credit_spent = 0.0

    for item in cart_items:
        reward = get_reward_by_id(session, item.reward_id)
        if reward is None:
            raise HTTPException(status_code=409, detail=f"Reward {item.reward_id} is no longer available")
        validate_reward_for_checkout(reward, item.quantity)
        rewards_by_id[item.reward_id] = reward
        total_credit_spent += normalize_credit(reward.credit_cost * item.quantity)

    total_credit_spent = normalize_credit(total_credit_spent)

    current_credit = normalize_credit(current_user.credit)
    remaining_credit_after_checkout = normalize_credit(current_credit - total_credit_spent)
    if remaining_credit_after_checkout < -CREDIT_EPSILON:
        raise HTTPException(status_code=400, detail="Insufficient credit for checkout")

    redeemed_items: list[RedemptionHistoryItemResponse] = []

    try:
        order = RedemptionOrder(
            user_id=current_user.user_id,
            total_credit_spent=total_credit_spent,
            status="completed",
        )
        session.add(order)
        session.flush()

        for item in cart_items:
            reward = rewards_by_id[item.reward_id]
            reward.stock_quantity -= item.quantity
            session.add(reward)

            order_item = RedemptionOrderItem(
                order_id=order.order_id,
                reward_id=reward.reward_id,
                quantity=item.quantity,
                credit_cost_per_item=normalize_credit(reward.credit_cost),
                total_credit_cost=normalize_credit(reward.credit_cost * item.quantity),
            )
            session.add(order_item)

            redeemed_items.append(
                RedemptionHistoryItemResponse(
                    reward_id=reward.reward_id,
                    reward_name=reward.name,
                    quantity=item.quantity,
                    credit_cost_per_item=normalize_credit(reward.credit_cost),
                    total_credit_cost=normalize_credit(reward.credit_cost * item.quantity),
                )
            )

        for item in cart_items:
            session.delete(item)

        current_user.credit = normalize_credit(max(0.0, remaining_credit_after_checkout))
        session.add(current_user)

        session.commit()
        session.refresh(order)
        session.refresh(current_user)

    except Exception as error:
        session.rollback()
        # DEV ONLY: Expose the real error for debugging
        raise HTTPException(status_code=500, detail=f"Checkout failed: {error!r}") from error

    return CheckoutResponse(
        checkout_status="success",
        redemption_id=order.order_id,
        redeemed_items=redeemed_items,
        total_credit_spent=normalize_credit(order.total_credit_spent),
        remaining_credit=normalize_credit(current_user.credit),
        confirmation_message="Checkout completed successfully.",
    )


def get_redemption_history(
    session: Session,
    current_user: AppUser,
) -> RedemptionHistoryResponse:
    validate_sales_advisor(current_user)
    orders = list_redemption_orders_for_user(session, current_user.user_id)
    order_ids = [order.order_id for order in orders]
    order_items = list_redemption_order_items(session, order_ids)

    rewards_by_id: dict[int, RewardCatalog] = {}
    items_by_order_id: dict[int, list[RedemptionHistoryItemResponse]] = {}

    for item in order_items:
        reward = rewards_by_id.get(item.reward_id)
        if reward is None:
            reward = get_reward_by_id(session, item.reward_id)
            if reward is None:
                continue
            rewards_by_id[item.reward_id] = reward

        items_by_order_id.setdefault(item.order_id, []).append(
            RedemptionHistoryItemResponse(
                reward_id=item.reward_id,
                reward_name=reward.name,
                quantity=item.quantity,
                credit_cost_per_item=item.credit_cost_per_item,
                total_credit_cost=item.total_credit_cost,
            )
        )

    redemptions = [
        RedemptionHistoryRecordResponse(
            redemption_id=order.order_id,
            created_at=order.created_at,
            total_credit_spent=order.total_credit_spent,
            status=order.status,
            redeemed_items=items_by_order_id.get(order.order_id, []),
        )
        for order in orders
    ]

    return RedemptionHistoryResponse(redemptions=redemptions)
