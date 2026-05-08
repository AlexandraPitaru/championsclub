from datetime import datetime

from sqlmodel import Session, func, select

from app.models.sale_transaction import SaleTransaction
from app.models.sale_transaction_item import SaleTransactionItem
from app.models.user_skill import UserSkill
from app.sales_advisor_profile.ai_analysis_schemas import (
    SalesAdvisorRecentPerformanceContext,
    SalesAdvisorSkillContext,
)


def get_sales_advisor_recent_performance(
    session: Session,
    user_id: int,
    interval_start: datetime | None,
) -> SalesAdvisorRecentPerformanceContext:
    conditions = [SaleTransaction.user_id == user_id]

    if interval_start is not None:
        conditions.append(SaleTransaction.transaction_date >= interval_start)

    sales_result = session.exec(
        select(
            func.count(SaleTransaction.transaction_id),
            func.coalesce(func.sum(SaleTransaction.amount), 0),
            func.coalesce(func.sum(SaleTransaction.points_earned), 0),
            func.max(SaleTransaction.transaction_date),
        ).where(*conditions)
    ).one()

    total_products_sold = session.exec(
        select(func.coalesce(func.sum(SaleTransactionItem.quantity), 0))
        .join(
            SaleTransaction,
            SaleTransaction.transaction_id == SaleTransactionItem.transaction_id,
        )
        .where(*conditions)
    ).one()

    return SalesAdvisorRecentPerformanceContext(
        total_transactions=int(sales_result[0] or 0),
        total_sales_amount=float(sales_result[1] or 0),
        total_points_earned=int(sales_result[2] or 0),
        total_products_sold=int(total_products_sold or 0),
        last_transaction_date=sales_result[3],
    )


def get_sales_advisor_skills(
    session: Session,
    user_id: int,
) -> list[SalesAdvisorSkillContext]:
    statement = (
        select(UserSkill)
        .where(UserSkill.user_id == user_id)
        .order_by(
            UserSkill.verified.desc(),
            UserSkill.updated_at.desc(),
            UserSkill.skill_name,
        )
    )

    skills = session.exec(statement).all()

    return [
        SalesAdvisorSkillContext(
            skill_name=skill.skill_name,
            skill_level=skill.skill_level,
            verified=skill.verified,
            updated_at=skill.updated_at,
        )
        for skill in skills
    ]


def get_sales_advisor_performance_history(
    session: Session,
    user_id: int,
    interval_start: datetime | None,
) -> list[tuple[datetime, float, int]]:
    conditions = [SaleTransaction.user_id == user_id]

    if interval_start is not None:
        conditions.append(SaleTransaction.transaction_date >= interval_start)

    statement = (
        select(
            SaleTransaction.transaction_date,
            SaleTransaction.amount,
            SaleTransaction.points_earned,
        )
        .where(*conditions)
        .order_by(SaleTransaction.transaction_date)
    )

    return [
        (
            transaction_date,
            float(amount or 0),
            int(points_earned or 0),
        )
        for transaction_date, amount, points_earned in session.exec(statement).all()
    ]
