from datetime import datetime

from sqlalchemy.orm import aliased
from sqlmodel import Session, func, select

from app.models.app_user import AppUser
from app.models.dealership import Dealership
from app.models.department import Department
from app.models.sale_transaction import SaleTransaction
from app.models.sale_transaction_item import SaleTransactionItem
from app.models.user_skill import UserSkill


def get_sales_advisor_profile_row(session: Session, user_id: int):
    manager = aliased(AppUser)

    statement = (
        select(
            AppUser,
            Department.department_id,
            Department.name,
            Dealership.dealership_id,
            Dealership.name,
            Dealership.dealer_code,
            Dealership.city,
            Dealership.country,
            Dealership.region,
            manager.user_id,
            manager.first_name,
            manager.last_name,
            manager.email,
        )
        .outerjoin(Department, Department.department_id == AppUser.department_id)
        .outerjoin(Dealership, Dealership.dealership_id == AppUser.dealership_id)
        .outerjoin(manager, manager.user_id == AppUser.manager_user_id)
        .where(AppUser.user_id == user_id)
    )

    return session.exec(statement).first()


def get_sales_advisor_skills(
    session: Session,
    user_id: int,
) -> list[UserSkill]:
    statement = (
        select(UserSkill)
        .where(UserSkill.user_id == user_id)
        .order_by(UserSkill.skill_name, UserSkill.user_skill_id)
    )

    return list(session.exec(statement).all())


def get_sales_advisor_performance_metrics(
    session: Session,
    user_id: int,
) -> tuple[int, float, int, int, datetime | None]:
    sales_result = session.exec(
        select(
            func.count(SaleTransaction.transaction_id),
            func.coalesce(func.sum(SaleTransaction.amount), 0),
            func.coalesce(func.sum(SaleTransaction.points_earned), 0),
            func.max(SaleTransaction.transaction_date),
        ).where(SaleTransaction.user_id == user_id)
    ).one()

    total_products_sold = session.exec(
        select(func.coalesce(func.sum(SaleTransactionItem.quantity), 0))
        .join(
            SaleTransaction,
            SaleTransaction.transaction_id == SaleTransactionItem.transaction_id,
        )
        .where(SaleTransaction.user_id == user_id)
    ).one()

    return (
        int(sales_result[0] or 0),
        float(sales_result[1] or 0),
        int(sales_result[2] or 0),
        int(total_products_sold or 0),
        sales_result[3],
    )
