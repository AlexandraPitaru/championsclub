from typing import Optional

from fastapi import HTTPException, status
from sqlmodel import Session

from app.manager_alerts.manager_notifications_repository import (
    get_manager_notifications_from_db,
)
from app.manager_alerts.manager_notifications_schemas import (
    ManagerNotificationItem,
    ManagerNotificationsResponse,
)


def get_manager_notifications_service(
    session: Session,
    current_user,
    priority: Optional[str] = None,
    is_read: Optional[bool] = None,
) -> ManagerNotificationsResponse:
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    if current_user.role.lower() != "manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only managers can access notifications",
        )

    results = get_manager_notifications_from_db(
        session=session,
        manager_id=current_user.user_id,
        priority=priority,
        is_read=is_read,
    )

    notifications = []

    for alert, employee in results:
        notifications.append(
            ManagerNotificationItem(
                alert_id=alert.alert_id,
                user_id=alert.user_id,
                employee_name=f"{employee.first_name} {employee.last_name}",
                employee_email=employee.email,
                employee_number=employee.employee_number,
                rank=employee.rank,
                points=employee.points,
                alert_type=alert.alert_type,
                title=alert.title,
                message=alert.message,
                priority=alert.priority,
                is_read=alert.is_read,
                created_at=alert.created_at,
            )
        )

    unread_alerts = sum(
        1 for notification in notifications if notification.is_read is False
    )

    return ManagerNotificationsResponse(
        manager_id=current_user.user_id,
        total_alerts=len(notifications),
        unread_alerts=unread_alerts,
        notifications=notifications,
    )