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
    limit: int = 10,
    offset: int = 0,
):
    filters = [AppUser.manager_user_id == manager_id]

    if priority is not None:
        filters.append(func.lower(UserAlert.priority) == priority.lower())

    if is_read is not None:
        filters.append(UserAlert.is_read == is_read)

    priority_order = case(
        (func.lower(UserAlert.priority) == "high", 1),
        (func.lower(UserAlert.priority) == "medium", 2),
        (func.lower(UserAlert.priority) == "low", 3),
        else_=4,
    )

    statement = (
        select(UserAlert, AppUser)
        .join(AppUser, UserAlert.user_id == AppUser.user_id)
        .where(*filters)
    )

    statement = statement.order_by(
        desc(func.date(UserAlert.created_at)),
        priority_order,
        desc(UserAlert.created_at),
    ).offset(
        offset
    ).limit(
        limit
    )

    total_alerts = session.exec(
        select(func.count(UserAlert.alert_id))
        .join(AppUser, UserAlert.user_id == AppUser.user_id)
        .where(*filters)
    ).one()

    if is_read is True:
        unread_alerts = 0
    else:
        unread_filters = [
            AppUser.manager_user_id == manager_id,
            UserAlert.is_read == False,
        ]

        if priority is not None:
            unread_filters.append(func.lower(UserAlert.priority) == priority.lower())

        unread_alerts = session.exec(
            select(func.count(UserAlert.alert_id))
            .join(AppUser, UserAlert.user_id == AppUser.user_id)
            .where(*unread_filters)
        ).one()

    return session.exec(statement).all(), total_alerts, unread_alerts
