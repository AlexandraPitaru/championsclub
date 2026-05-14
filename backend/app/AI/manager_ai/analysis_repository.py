from datetime import datetime
from collections import defaultdict
from typing import Iterable

from sqlmodel import Session, func, select

from app.models.app_user import AppUser
from app.models.sale_transaction import SaleTransaction
from app.models.sale_transaction_item import SaleTransactionItem
from app.models.user_skill import UserSkill
from app.sales_advisor_dashboard.overview_repository import (
    get_sales_advisor_team_members,
)
from app.AI.manager_ai.analysis_schemas import (
    ManagerTeamRecentPerformanceContext,
    ManagerTeamPointsSummary,
    ManagerTeamSkillAggregate,
)


def _team_member_ids(session: Session, manager_user_id: int) -> list[int]:
    members = get_sales_advisor_team_members(session, manager_user_id)
    return [m.user_id for m in members if m.user_id is not None]


def get_team_recent_performance(
    session: Session,
    manager_user_id: int,
    interval_start: datetime | None,
) -> ManagerTeamRecentPerformanceContext:
    user_ids = _team_member_ids(session, manager_user_id)

    if not user_ids:
        return ManagerTeamRecentPerformanceContext(
            total_transactions=0,
            total_sales_amount=0.0,
            total_points_earned=0,
            total_products_sold=0,
            last_transaction_date=None,
        )

    conditions = [SaleTransaction.user_id.in_(user_ids)]
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

    return ManagerTeamRecentPerformanceContext(
        total_transactions=int(sales_result[0] or 0),
        total_sales_amount=float(sales_result[1] or 0),
        total_points_earned=int(sales_result[2] or 0),
        total_products_sold=int(total_products_sold or 0),
        last_transaction_date=sales_result[3],
    )


def get_team_points_summary(
    session: Session,
    manager_user_id: int,
) -> ManagerTeamPointsSummary:
    members = get_sales_advisor_team_members(session, manager_user_id)

    if not members:
        return ManagerTeamPointsSummary(
            total_points=0,
            average_points=0.0,
            top_points=None,
            bottom_points=None,
        )

    points = [m.points or 0 for m in members]
    total_points = sum(points)
    avg = float(total_points / len(points)) if points else 0.0
    return ManagerTeamPointsSummary(
        total_points=total_points,
        average_points=round(avg, 2),
        top_points=max(points) if points else None,
        bottom_points=min(points) if points else None,
    )


def get_team_skills_aggregate(
    session: Session,
    manager_user_id: int,
) -> list[ManagerTeamSkillAggregate]:
    user_ids = _team_member_ids(session, manager_user_id)
    if not user_ids:
        return []

    rows: Iterable[tuple[str, str, int]] = session.exec(
        select(
            UserSkill.skill_name,
            UserSkill.skill_level,
            func.count(UserSkill.user_skill_id),
        )
        .where(UserSkill.user_id.in_(user_ids))
        .group_by(UserSkill.skill_name, UserSkill.skill_level)
    ).all()

    aggregated: dict[str, ManagerTeamSkillAggregate] = {}
    for skill_name, skill_level, count in rows:
        if skill_name not in aggregated:
            aggregated[skill_name] = ManagerTeamSkillAggregate(
                skill_name=skill_name,
                total_users_with_skill=0,
                beginner_count=0,
                intermediate_count=0,
                advanced_count=0,
            )
        item = aggregated[skill_name]
        level = (skill_level or "").lower()
        if level == "beginner":
            item.beginner_count += int(count)
        elif level == "intermediate":
            item.intermediate_count += int(count)
        elif level == "advanced":
            item.advanced_count += int(count)
        else:
            # Unknown level, count it towards total only
            pass
        item.total_users_with_skill += int(count)

    aggregates = list(aggregated.values())
    aggregates.sort(key=lambda s: s.total_users_with_skill, reverse=True)
    return aggregates


def get_team_performance_history(
    session: Session,
    manager_user_id: int,
    interval_start: datetime | None,
) -> list[tuple[datetime, float, int]]:
    user_ids = _team_member_ids(session, manager_user_id)
    if not user_ids:
        return []

    conditions = [SaleTransaction.user_id.in_(user_ids)]
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
