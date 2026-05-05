from datetime import datetime

from sqlmodel import Session, func, select

from app.AI.activity_summary.activity_summary_schemas import (
    AdvisorActivitySummaryData,
    IntervalType,
)
from app.models.app_user import AppUser
from app.models.sale_transaction import SaleTransaction
from app.models.sale_transaction_item import SaleTransactionItem


def get_advisor_activity_summary_data(
    session: Session,
    manager_id: int,
    advisor_id: int,
    interval: IntervalType,
    interval_start: datetime | None,
) -> AdvisorActivitySummaryData | None:
    advisor = session.exec(
        select(AppUser)
        .where(AppUser.user_id == advisor_id)
        .where(AppUser.manager_user_id == manager_id)
    ).first()

    if advisor is None:
        return None

    sales_conditions = [SaleTransaction.user_id == advisor_id]

    if interval_start is not None:
        sales_conditions.append(SaleTransaction.transaction_date >= interval_start)

    sales_result = session.exec(
        select(
            func.count(SaleTransaction.transaction_id),
            func.coalesce(func.sum(SaleTransaction.amount), 0),
            func.coalesce(func.sum(SaleTransaction.points_earned), 0),
            func.max(SaleTransaction.transaction_date),
        ).where(*sales_conditions)
    ).one()

    total_products_sold = session.exec(
        select(func.coalesce(func.sum(SaleTransactionItem.quantity), 0))
        .join(
            SaleTransaction,
            SaleTransaction.transaction_id == SaleTransactionItem.transaction_id,
        )
        .where(*sales_conditions)
    ).one()

    return AdvisorActivitySummaryData(
        advisor_id=advisor.user_id,
        first_name=advisor.first_name,
        last_name=advisor.last_name,
        email=advisor.email,
        role=advisor.role,
        current_rank=advisor.rank,
        total_points=advisor.points,
        credit=advisor.credit,
        status=advisor.status,
        interval=interval,
        total_transactions=int(sales_result[0] or 0),
        total_sales_amount=float(sales_result[1] or 0),
        total_points_earned=int(sales_result[2] or 0),
        total_products_sold=int(total_products_sold or 0),
        last_transaction_date=sales_result[3],
    )
