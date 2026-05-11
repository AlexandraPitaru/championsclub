from sqlmodel import Session

from app.models.app_user import AppUser
from app.sales_advisor_dashboard.overview_service import validate_sales_advisor
from app.sales_advisor_shop.history.history_repository import (
    get_items_for_orders,
    get_user_redemption_orders,
)
from app.sales_advisor_shop.history.history_schemas import (
    RedemptionHistoryEntry,
    RedemptionHistoryResponse,
    RedeemedHistoryItem,
)


def get_redemption_history(session: Session, current_user: AppUser) -> RedemptionHistoryResponse:
    validate_sales_advisor(current_user)

    orders = get_user_redemption_orders(session, current_user.user_id or 0)
    order_ids = [o.order_id or 0 for o in orders]
    items_by_order = get_items_for_orders(session, order_ids)

    entries: list[RedemptionHistoryEntry] = []
    for order in orders:
        pairs = items_by_order.get(order.order_id or 0, [])
        items = [
            RedeemedHistoryItem(
                reward_id=it.reward_id,
                reward_name=name,
                quantity=it.quantity,
                credit_cost_per_item=float(it.credit_cost_per_item),
                total_credit_cost=float(it.total_credit_cost),
            )
            for (it, name) in pairs
        ]

        entries.append(
            RedemptionHistoryEntry(
                redemption_id=order.order_id or 0,
                redeemed_items=items,
                total_credit_spent=float(order.total_credit_spent),
                status=order.status,
                created_at=order.created_at.isoformat(),
            )
        )

    return RedemptionHistoryResponse(redemptions=entries)
