from sqlmodel import Session, select

from app.models.app_user import AppUser


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
