from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlmodel import Session

from app.account.account_service import get_current_user_by_id
from app.AI.sales_advisor_alerts.sales_advisor_schemas import (
    SalesAdvisorLatestPriorityAlertResponse,
)
from app.AI.sales_advisor_alerts.sales_advisor_service import (
    get_sales_advisor_latest_priority_alert_service,
)
from app.database import get_session


router = APIRouter(
    prefix="/api/sales-advisor/dashboard",
    tags=["Sales Advisor Alerts"],
)


@router.get(
    "/alerts/latest-priority",
    response_model=SalesAdvisorLatestPriorityAlertResponse,
)
def get_sales_advisor_latest_priority_alert(
    x_user_id: Optional[str] = Header(default=None),
    session: Session = Depends(get_session),
):
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    try:
        user_id = int(x_user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="x-user-id must be a valid integer",
        )

    current_user = get_current_user_by_id(
        session=session,
        user_id=user_id,
    )

    return get_sales_advisor_latest_priority_alert_service(
        session=session,
        current_user=current_user,
    )
