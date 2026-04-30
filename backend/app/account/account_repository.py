from sqlalchemy.orm import aliased
from sqlmodel import Session, select

from app.models.app_user import AppUser
from app.models.department import Department
from app.models.dealership import Dealership

def get_user_by_email(session:Session, email:str) -> AppUser | None:
    statement = select(AppUser).where(AppUser.email == email)
    return session.exec(statement).first()


def get_current_user_profile_row(session: Session, user_id: int):
    manager = aliased(AppUser)

    statement = (
        select(
            AppUser,
            Department.department_id,
            Department.name,
            Dealership.dealership_id,
            Dealership.name,
            Dealership.dealer_code,
            Dealership.city,
            Dealership.country,
            Dealership.region,
            manager.user_id,
            manager.first_name,
            manager.last_name,
            manager.email,
        )
        .join(Department, Department.department_id == AppUser.department_id)
        .join(Dealership, Dealership.dealership_id == AppUser.dealership_id)
        .outerjoin(manager, manager.user_id == AppUser.manager_user_id)
        .where(AppUser.user_id == user_id)
    )

    return session.exec(statement).first()