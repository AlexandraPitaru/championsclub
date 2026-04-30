from sqlmodel import Session, select

from app.models.app_user import AppUser


def get_employees_by_manager_id(
    session: Session,
    manager_user_id: int,
) -> list[AppUser]:
    statement = select(AppUser).where(
        AppUser.manager_user_id == manager_user_id
    )

    return list(session.exec(statement).all())