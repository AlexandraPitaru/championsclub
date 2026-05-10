from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlmodel import Session

from app.database import get_session
from app.manager_statistics.router import get_current_user
from app.models.app_user import AppUser
from app.sales_advisor_alerts.service import get_sales_advisor_alerts_service
from app.sales_advisor_alerts.schemas import SalesAdvisorAlertsResponse


router = APIRouter(
    prefix="/api/sales-advisor",
    tags=["sales-advisor-alerts"],
)


@router.get(
    "/alerts",
    response_model=SalesAdvisorAlertsResponse,
)
def get_sales_advisor_alerts(
    priority: Optional[str] = Query(default=None),
    is_read: Optional[bool] = Query(default=None),
    alert_type: Optional[str] = Query(default=None),
    limit: Optional[str] = Query(default=None),
    offset: Optional[str] = Query(default=None),
    session: Session = Depends(get_session),
    current_user: AppUser = Depends(get_current_user),
):
    try:
        parsed_limit = 10 if limit is None else int(limit)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Limit must be a valid number",
        )

    try:
        parsed_offset = 0 if offset is None else int(offset)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Offset must be a valid number",
        )

    if parsed_limit < 1 or parsed_limit > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Limit must be between 1 and 100",
        )

    if parsed_offset < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Offset must be greater than or equal to 0",
        )

    return get_sales_advisor_alerts_service(
        session=session,
        current_user=current_user,
        priority=priority,
        is_read=is_read,
        alert_type=alert_type,
        limit=parsed_limit,
        offset=parsed_offset,
    )
