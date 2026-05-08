from sqlmodel import Session, select

from app.models.app_user import AppUser
from app.models.sale_transaction import SaleTransaction


def get_completed_sales_transactions_for_advisor(
    session: Session,
    user_id: int,
):
    statement = (
        select(
            SaleTransaction.transaction_date,
            SaleTransaction.amount,
            SaleTransaction.points_earned,
        )
        .where(SaleTransaction.user_id == user_id)
        .where(SaleTransaction.status.ilike("completed"))
        .order_by(SaleTransaction.transaction_date)
    )

    return list(session.exec(statement).all())


def get_sales_advisor_team_members(
    session: Session,
    manager_user_id: int,
) -> list[AppUser]:
    statement = (
        select(AppUser)
        .where(AppUser.manager_user_id == manager_user_id)
        .where(AppUser.role.ilike("sales_advisor"))
    )

    return list(session.exec(statement).all())
