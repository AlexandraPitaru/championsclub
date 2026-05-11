from typing import Optional

from fastapi import HTTPException, status
from sqlmodel import Session

from app.models.app_user import AppUser
from app.sales_advisor_alerts.repository import get_sales_advisor_alerts_from_db
from app.sales_advisor_alerts.schemas import (
    SalesAdvisorAlertItem,
    SalesAdvisorAlertsResponse,
)


def get_sales_advisor_alerts_service(
    session: Session,
    current_user: AppUser,
    priority: Optional[str] = None,
    is_read: Optional[bool] = None,
    alert_type: Optional[str] = None,
    limit: int = 10,
    offset: int = 0,
) -> SalesAdvisorAlertsResponse:
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    if current_user.role.lower() != "sales_advisor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sales advisors can access their alerts",
        )

    results, total_alerts, unread_alerts = get_sales_advisor_alerts_from_db(
        session=session,
        user_id=current_user.user_id,
        priority=priority,
        is_read=is_read,
        alert_type=alert_type,
        limit=limit,
        offset=offset,
    )

    if offset > 0 and offset >= total_alerts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Offset {offset} is out of range.",
        )

    alerts = [
        SalesAdvisorAlertItem(
            alert_id=a.alert_id,
            alert_type=a.alert_type,
            title=a.title,
            message=a.message,
            priority=a.priority,
            is_read=a.is_read,
            created_at=a.created_at,
        )
        for a in results
    ]

    next_offset = offset + len(alerts)
    has_more = next_offset < total_alerts

    return SalesAdvisorAlertsResponse(
        user_id=current_user.user_id,
        total_alerts=total_alerts,
        unread_alerts=unread_alerts,
        limit=limit,
        offset=offset,
        has_more=has_more,
        next_offset=next_offset if has_more else None,
        alerts=alerts,
    )
