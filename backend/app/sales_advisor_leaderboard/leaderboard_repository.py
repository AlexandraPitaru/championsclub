from sqlmodel import Session, select

from app.models.app_user import AppUser


def get_global_sales_advisors(session: Session) -> list[AppUser]:
    statement = select(AppUser).where(AppUser.role.ilike("sales_advisor"))

    return list(session.exec(statement).all())


def get_team_sales_advisors(
    session: Session,
    manager_user_id: int | None,
) -> list[AppUser]:
    statement = (
        select(AppUser)
        .where(AppUser.manager_user_id == manager_user_id)
        .where(AppUser.role.ilike("sales_advisor"))
    )

    return list(session.exec(statement).all())
