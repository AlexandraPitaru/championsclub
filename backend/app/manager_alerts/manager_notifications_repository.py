from typing import Optional

from sqlalchemy import case, desc, func
from sqlmodel import Session, select

from app.models.app_user import AppUser
from app.models.user_alert import UserAlert


def get_manager_notifications_from_db(
    session: Session,
    manager_id: int,
    priority: Optional[str] = None,
    is_read: Optional[bool] = None,
):
    priority_order = case(
        (func.lower(UserAlert.priority) == "high", 1),
        (func.lower(UserAlert.priority) == "medium", 2),
        (func.lower(UserAlert.priority) == "low", 3),
        else_=4,
    )

    statement = (
        select(UserAlert, AppUser)
        .join(AppUser, UserAlert.user_id == AppUser.user_id)
        .where(AppUser.manager_user_id == manager_id)
    )

    if priority is not None:
        statement = statement.where(
            func.lower(UserAlert.priority) == priority.lower()
        )

    if is_read is not None:
        statement = statement.where(UserAlert.is_read == is_read)

    statement = statement.order_by(
        priority_order,
        desc(UserAlert.created_at),
    )

    return session.exec(statement).all()