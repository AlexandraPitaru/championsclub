from fastapi import HTTPException, status
from sqlmodel import Session

from app.AI.sales_advisor_alerts.sales_advisor_repository import (
    get_latest_priority_alert_for_sales_advisor,
)
from app.AI.sales_advisor_alerts.sales_advisor_schemas import (
    SalesAdvisorAlertResponse,
    SalesAdvisorLatestPriorityAlertResponse,
)


def validate_sales_advisor(current_user) -> None:
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    if current_user.role.lower() != "sales_advisor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sales advisors can access this alert",
        )


def get_sales_advisor_latest_priority_alert_service(
    session: Session,
    current_user,
) -> SalesAdvisorLatestPriorityAlertResponse:
    validate_sales_advisor(current_user)

    alert = get_latest_priority_alert_for_sales_advisor(
        session=session,
        sales_advisor_id=current_user.user_id,
    )

    if alert is None:
        return SalesAdvisorLatestPriorityAlertResponse(
            sales_advisor_id=current_user.user_id,
            alert=None,
        )

    return SalesAdvisorLatestPriorityAlertResponse(
        sales_advisor_id=current_user.user_id,
        alert=SalesAdvisorAlertResponse(
            alert_id=alert.alert_id,
            user_id=alert.user_id,
            alert_type=alert.alert_type,
            title=alert.title,
            message=alert.message,
            priority=alert.priority,
            is_read=alert.is_read,
            created_at=alert.created_at,
        ),
    )
