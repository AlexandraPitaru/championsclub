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
    limit: int = 10,
    offset: int = 0,
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

    results, total_alerts, unread_alerts = get_manager_notifications_from_db(
        session=session,
        manager_id=current_user.user_id,
        priority=priority,
        is_read=is_read,
        limit=limit,
        offset=offset,
    )

    if offset > 0 and offset >= total_alerts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Offset {offset} is out of range.",
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

    next_offset = offset + len(notifications)
    has_more = next_offset < total_alerts

    return ManagerNotificationsResponse(
        manager_id=current_user.user_id,
        total_alerts=total_alerts,
        unread_alerts=unread_alerts,
        limit=limit,
        offset=offset,
        has_more=has_more,
        next_offset=next_offset if has_more else None,
        notifications=notifications,
    )
