from sqlmodel import Session

from app.models.app_user import AppUser
from app.sales_advisor_leaderboard.leaderboard_repository import (
    get_global_sales_advisors,
    get_team_sales_advisors,
)


def get_global_sales_advisors_for_position(session: Session) -> list[AppUser]:
    return get_global_sales_advisors(session=session)


def get_team_sales_advisors_for_position(
    session: Session,
    manager_user_id: int | None,
) -> list[AppUser]:
    return get_team_sales_advisors(
        session=session,
        manager_user_id=manager_user_id,
    )
