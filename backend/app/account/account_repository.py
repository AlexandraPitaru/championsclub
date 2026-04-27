from sqlalchemy import select as sa_select
from sqlalchemy.orm import aliased
from sqlmodel import Session, select

from app.models.app_user import AppUser
from app.models.dealership import Dealership
from app.models.department import Department


def get_user_by_email(session: Session, email: str) -> AppUser | None:
    statement = select(AppUser).where(AppUser.email == email)
    return session.exec(statement).first()


def get_user_profile(session: Session, user_id: int):
    ManagerAlias = aliased(AppUser, name="manager")

    stmt = (
        sa_select(AppUser, Dealership, Department, ManagerAlias)
        .join(Dealership, Dealership.dealership_id == AppUser.dealership_id)
        .join(Department, Department.department_id == AppUser.department_id)
        .outerjoin(ManagerAlias, ManagerAlias.user_id == AppUser.manager_user_id)
        .where(AppUser.user_id == user_id)
    )

    return session.execute(stmt).first()
