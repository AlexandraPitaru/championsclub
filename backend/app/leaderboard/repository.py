from datetime import datetime
from sqlmodel import Session, select, func

from app.models.app_user import AppUser
from app.models.sale_transaction import SaleTransaction


def get_manager_points_aggregate_for_window(
    session: Session,
    manager_user_id: int,
    start_date: datetime | None,
    end_date: datetime | None,
) -> tuple[int, float]:
    conditions = [AppUser.manager_user_id == manager_user_id]

    if start_date is not None:
        conditions.append(SaleTransaction.transaction_date >= start_date)
    if end_date is not None:
        conditions.append(SaleTransaction.transaction_date < end_date)

    result = session.exec(
        select(
            func.coalesce(func.sum(SaleTransaction.points_earned), 0),
            func.coalesce(func.avg(SaleTransaction.points_earned), 0.0),
        )
        .join(AppUser, AppUser.user_id == SaleTransaction.user_id)
        .where(*conditions)
    ).one()

    total_points = int(result[0] or 0)
    average_points = float(result[1] or 0.0)
    return total_points, average_points


def get_leaderboard_rows_for_manager(
    session: Session,
    manager_user_id: int,
    interval_start: datetime | None,
    q: str | None,
):
    statement = (
        select(
            AppUser.user_id,
            AppUser.first_name,
            AppUser.last_name,
            AppUser.email,
            AppUser.role,
            AppUser.status,
            AppUser.rank,
            func.coalesce(func.sum(SaleTransaction.points_earned), 0).label("points"),
        )
        .select_from(AppUser)
        .join(
            SaleTransaction,
            SaleTransaction.user_id == AppUser.user_id,
            isouter=True,
        )
        .where(AppUser.manager_user_id == manager_user_id)
        .group_by(
            AppUser.user_id,
            AppUser.first_name,
            AppUser.last_name,
            AppUser.email,
            AppUser.role,
            AppUser.status,
            AppUser.rank,
        )
    )

    if interval_start is not None:
        statement = statement.where(
            (SaleTransaction.transaction_date >= interval_start)
            | (SaleTransaction.transaction_id.is_(None))
        )

    if q:
        search = f"%{q.strip()}%"
        statement = statement.where(
            (AppUser.first_name.ilike(search))
            | (AppUser.last_name.ilike(search))
            | (AppUser.email.ilike(search))
        )

    return list(session.exec(statement).all())