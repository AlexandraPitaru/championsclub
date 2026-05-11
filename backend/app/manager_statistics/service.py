from datetime import date, datetime, timedelta

from fastapi import HTTPException
from sqlmodel import Session, select, func

from app.models.app_user import AppUser
from app.models.sale_transaction import SaleTransaction
from app.models.sale_transaction_item import SaleTransactionItem
from app.manager_statistics.schemas import UserKpiResponse, TeamKpiResponse, ManagedUserResponse, PerformanceTrendPoint


def validate_manager(current_user: AppUser):
    if current_user.role.upper() != "MANAGER":
        raise HTTPException(status_code=403, detail="Access denied: Manager role required")


def get_interval_start_date(interval: str):
    # transaction_date is stored as naive datetime, so use naive bounds
    now = datetime.utcnow()

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


def get_custom_date_bounds(
    start_date: date | None,
    end_date: date | None,
) -> tuple[datetime | None, datetime | None]:
    if start_date is not None and end_date is not None and start_date > end_date:
        raise HTTPException(status_code=400, detail="start_date must be before or equal to end_date")

    start_dt = (
        datetime(start_date.year, start_date.month, start_date.day)
        if start_date is not None
        else None
    )
    end_dt = (
        datetime(end_date.year, end_date.month, end_date.day) + timedelta(days=1)
        if end_date is not None
        else None
    )
    return start_dt, end_dt


def get_user_kpis(
    session: Session,
    current_manager: AppUser,
    user_id: int,
    interval: str,
    start_date: date | None = None,
    end_date: date | None = None,
) -> UserKpiResponse:
    validate_manager(current_manager)

    target_user = session.get(AppUser, user_id)

    if target_user is None or target_user.manager_user_id != current_manager.user_id:
        raise HTTPException(
            status_code=404,
            detail="User not found or not under your management",
        )

    custom_start, custom_end = get_custom_date_bounds(start_date, end_date)
    interval_start = custom_start if (custom_start is not None or custom_end is not None) else get_interval_start_date(interval)

    sales_conditions = [SaleTransaction.user_id == user_id]

    if interval_start is not None:
        sales_conditions.append(SaleTransaction.transaction_date >= interval_start)
    if custom_end is not None:
        sales_conditions.append(SaleTransaction.transaction_date < custom_end)

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
        "total_points": total_points_earned,
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
    start_date: date | None = None,
    end_date: date | None = None,
) -> TeamKpiResponse:
    validate_manager(current_manager)

    custom_start, custom_end = get_custom_date_bounds(start_date, end_date)
    interval_start = custom_start if (custom_start is not None or custom_end is not None) else get_interval_start_date(interval)

    team_employees = session.exec(
        select(AppUser).where(AppUser.manager_user_id == current_manager.user_id)
    ).all()

    total_employees = len(team_employees)

    total_credit = session.exec(
        select(func.coalesce(func.sum(AppUser.credit), 0)).where(
            AppUser.manager_user_id == current_manager.user_id
        )
    ).one() or 0.0

    team_sales_conditions = [AppUser.manager_user_id == current_manager.user_id]

    if interval_start is not None:
        team_sales_conditions.append(SaleTransaction.transaction_date >= interval_start)
    if custom_end is not None:
        team_sales_conditions.append(SaleTransaction.transaction_date < custom_end)

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

    total_points = int(total_points_earned or 0)
    average_points = (float(total_points) / total_employees) if total_employees > 0 else 0.0

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

def get_managed_users(
    session: Session,
    current_manager: AppUser,
) -> list[ManagedUserResponse]:
    validate_manager(current_manager)

    users = session.exec(
        select(AppUser)
        .where(AppUser.manager_user_id == current_manager.user_id)
        .where(AppUser.role.ilike("sales_advisor"))
    ).all()

    return [
        {
            "user_id": user.user_id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "role": user.role,
            "current_rank": user.rank,
            "total_points": user.points,
            "credit": user.credit,
            "status": user.status,
        }
        for user in users
    ]

##Adding a new service function to get the data for the performance trend chart in the manager dashboard
def build_performance_trend(transactions) -> list[PerformanceTrendPoint]:
    grouped = {}

    for transaction_date, amount, points_earned in transactions:
        period = transaction_date.date().isoformat()

        if period not in grouped:
            grouped[period] = {"sales": 0.0, "points": 0}
        grouped[period]["sales"] += float(amount or 0)
        grouped[period]["points"] += int(points_earned or 0)

    return [
        {
            "period": period,
            "sales": data["sales"],
            "points": data["points"],
        }
        for period, data in grouped.items()
    ]


def get_team_performance_trend(
    session: Session,
    current_manager: AppUser,
    interval: str,
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[PerformanceTrendPoint]:
    validate_manager(current_manager)

    custom_start, custom_end = get_custom_date_bounds(start_date, end_date)
    interval_start = custom_start if (custom_start is not None or custom_end is not None) else get_interval_start_date(interval)

    conditions = [
        AppUser.manager_user_id == current_manager.user_id
    ]

    if interval_start is not None:
        conditions.append(SaleTransaction.transaction_date >= interval_start)
    if custom_end is not None:
        conditions.append(SaleTransaction.transaction_date < custom_end)

    transactions = session.exec(
        select(
            SaleTransaction.transaction_date,
            SaleTransaction.amount,
            SaleTransaction.points_earned,
        )
        .join(AppUser, AppUser.user_id == SaleTransaction.user_id)
        .where(*conditions)
        .order_by(SaleTransaction.transaction_date)
    ).all()

    return build_performance_trend(transactions)


def get_user_performance_trend(
    session: Session,
    current_manager: AppUser,
    user_id: int,
    interval: str,
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[PerformanceTrendPoint]:
    validate_manager(current_manager)

    target_user = session.get(AppUser, user_id)

    if target_user is None or target_user.manager_user_id != current_manager.user_id:
        raise HTTPException(
            status_code=404,
            detail="User not found or not under your management",
        )

    custom_start, custom_end = get_custom_date_bounds(start_date, end_date)
    interval_start = custom_start if (custom_start is not None or custom_end is not None) else get_interval_start_date(interval)

    conditions = [
        SaleTransaction.user_id == user_id
    ]

    if interval_start is not None:
        conditions.append(SaleTransaction.transaction_date >= interval_start)
    if custom_end is not None:
        conditions.append(SaleTransaction.transaction_date < custom_end)

    transactions = session.exec(
        select(
            SaleTransaction.transaction_date,
            SaleTransaction.amount,
            SaleTransaction.points_earned,
        )
        .where(*conditions)
        .order_by(SaleTransaction.transaction_date)
    ).all()

    return build_performance_trend(transactions)
        