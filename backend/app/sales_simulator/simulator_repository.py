from datetime import datetime

from sqlmodel import Session, select

from app.models.app_user import AppUser
from app.models.product import Product
from app.models.sale_transaction import SaleTransaction
from app.models.sale_transaction_item import SaleTransactionItem


def get_manager_by_id(session: Session, manager_id: int) -> AppUser | None:
    statement = (
        select(AppUser)
        .where(AppUser.user_id == manager_id)
        .where(AppUser.role.ilike("manager"))
    )
    return session.exec(statement).first()


def get_active_sales_advisor_by_id(
    session: Session,
    advisor_id: int,
) -> AppUser | None:
    statement = (
        select(AppUser)
        .where(AppUser.user_id == advisor_id)
        .where(AppUser.role.ilike("sales_advisor"))
        .where(AppUser.status.ilike("active"))
    )
    return session.exec(statement).first()


def get_active_sales_advisors_for_manager(
    session: Session,
    manager_id: int,
) -> list[AppUser]:
    statement = (
        select(AppUser)
        .where(AppUser.manager_user_id == manager_id)
        .where(AppUser.role.ilike("sales_advisor"))
        .where(AppUser.status.ilike("active"))
        .order_by(AppUser.user_id)
    )
    return list(session.exec(statement).all())


def get_sale_products(session: Session) -> list[Product]:
    statement = select(Product).order_by(Product.product_id)
    return list(session.exec(statement).all())


def create_completed_sale_transaction(
    session: Session,
    advisor: AppUser,
    amount: float,
    points_earned: int,
) -> SaleTransaction:
    transaction = SaleTransaction(
        dealership_id=advisor.dealership_id,
        user_id=advisor.user_id or 0,
        transaction_date=datetime.utcnow(),
        amount=amount,
        points_earned=points_earned,
        status="completed",
    )
    session.add(transaction)
    session.flush()
    return transaction


def create_sale_transaction_item(
    session: Session,
    transaction_id: int,
    product_id: int,
    quantity: int,
) -> SaleTransactionItem:
    item = SaleTransactionItem(
        transaction_id=transaction_id,
        product_id=product_id,
        quantity=quantity,
    )
    session.add(item)
    session.flush()
    return item
