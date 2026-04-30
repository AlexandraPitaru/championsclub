from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlmodel import Session, select, func

from app.models.app_user import AppUser
from app.models.sale_transaction import SaleTransaction
from app.models.sale_transaction_item import SaleTransactionItem
from app.manager_statistics.schemas import UserKpiResponse, TeamKpiResponse


def validate_manager(current_user: AppUser):
    if current_user.role.upper() != "MANAGER":
        raise HTTPException(status_code=403, detail="Access denied: Manager role required")


def get_interval_start_date(interval: str):
    now = datetime.now(timezone.utc)

    if interval == "all":
        return None

    if interval == "day":
        return now - timedelta(days=1)

    if interval == "week":
        return now - timedelta(weeks=1)

    if interval == "month":
        return now - timedelta(days=30)

    raise HTTPException(
        status_code=400,
        detail="Invalid interval. Use day, week, month, or all.",
    )


def get_user_kpis(
    session: Session,
    current_manager: AppUser,
    user_id: int,
    interval: str,
) -> UserKpiResponse:
    validate_manager(current_manager)

    target_user = session.get(AppUser, user_id)

    if target_user is None or target_user.manager_user_id != current_manager.user_id:
        raise HTTPException(
            status_code=404,
            detail="User not found or not under your management",
        )

    start_date = get_interval_start_date(interval)

    sales_conditions = [SaleTransaction.user_id == user_id]

    if start_date is not None:
        sales_conditions.append(SaleTransaction.transaction_date >= start_date)

    sales_result = session.exec(
        select(
            func.count(SaleTransaction.transaction_id),
            func.coalesce(func.sum(SaleTransaction.amount), 0),
            func.coalesce(func.sum(SaleTransaction.points_earned), 0),
            func.max(SaleTransaction.transaction_date),
        ).where(*sales_conditions)
    ).one()

    total_transactions = sales_result[0]
    total_sales_amount = sales_result[1]
    total_points_earned = sales_result[2]
    last_transaction_date = sales_result[3]

    total_products_sold = session.exec(
        select(func.coalesce(func.sum(SaleTransactionItem.quantity), 0))
        .join(
            SaleTransaction,
            SaleTransaction.transaction_id == SaleTransactionItem.transaction_id,
        )
        .where(*sales_conditions)
    ).one()

    return {
        "user_id": target_user.user_id,
        "first_name": target_user.first_name,
        "last_name": target_user.last_name,
        "email": target_user.email,
        "role": target_user.role,
        "current_rank": target_user.rank,
        "total_points": target_user.points,
        "credit": target_user.credit,
        "status": target_user.status,
        "interval": interval,
        "total_transactions": total_transactions,
        "total_sales_amount": total_sales_amount,
        "total_points_earned": total_points_earned,
        "total_products_sold": total_products_sold,
        "last_transaction_date": last_transaction_date,
    }


def get_team_kpis(
    session: Session,
    current_manager: AppUser,
    interval: str,
) -> TeamKpiResponse:
    validate_manager(current_manager)

    start_date = get_interval_start_date(interval)

    team_employees = session.exec(
        select(AppUser).where(AppUser.manager_user_id == current_manager.user_id)
    ).all()

    total_employees = len(team_employees)

    user_kpis = session.exec(
        select(
            func.coalesce(func.sum(AppUser.points), 0),
            func.coalesce(func.avg(AppUser.points), 0),
            func.coalesce(func.sum(AppUser.credit), 0),
        ).where(AppUser.manager_user_id == current_manager.user_id)
    ).one()

    total_points = user_kpis[0] or 0
    average_points = user_kpis[1] or 0.0
    total_credit = user_kpis[2] or 0.0

    team_sales_conditions = [AppUser.manager_user_id == current_manager.user_id]

    if start_date is not None:
        team_sales_conditions.append(SaleTransaction.transaction_date >= start_date)

    sales_result = session.exec(
        select(
            func.count(SaleTransaction.transaction_id),
            func.coalesce(func.sum(SaleTransaction.amount), 0),
            func.coalesce(func.sum(SaleTransaction.points_earned), 0),
            func.max(SaleTransaction.transaction_date),
        )
        .join(AppUser, AppUser.user_id == SaleTransaction.user_id)
        .where(*team_sales_conditions)
    ).one()

    total_transactions = sales_result[0]
    total_sales_amount = sales_result[1]
    total_points_earned = sales_result[2]
    last_transaction_date = sales_result[3]

    total_products_sold = session.exec(
        select(func.coalesce(func.sum(SaleTransactionItem.quantity), 0))
        .join(
            SaleTransaction,
            SaleTransaction.transaction_id == SaleTransactionItem.transaction_id,
        )
        .join(AppUser, AppUser.user_id == SaleTransaction.user_id)
        .where(*team_sales_conditions)
    ).one()

    return {
        "manager_id": current_manager.user_id,
        "team_kpis": {
            "total_employees": total_employees,
            "total_points": total_points,
            "average_points": average_points,
            "total_credit": total_credit,
            "interval": interval,
            "total_transactions": total_transactions,
            "total_sales_amount": total_sales_amount,
            "total_points_earned": total_points_earned,
            "total_products_sold": total_products_sold,
            "last_transaction_date": last_transaction_date,
        },
    }