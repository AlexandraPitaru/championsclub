from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlmodel import Session

from app.database import get_session
from app.account.account_service import get_current_user_by_id

from app.manager_alerts.manager_notifications_service import (
    get_manager_notifications_service,
)
from app.manager_alerts.manager_notifications_schemas import (
    ManagerNotificationsResponse,
)


router = APIRouter(
    prefix="/api/manager/dashboard",
    tags=["Manager Dashboard Notifications"],
)


@router.get(
    "/notifications",
    response_model=ManagerNotificationsResponse,
)
def get_manager_dashboard_notifications(
    priority: Optional[str] = Query(default=None),
    is_read: Optional[bool] = Query(default=None),
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

    return get_manager_notifications_service(
        session=session,
        current_user=current_user,
        priority=priority,
        is_read=is_read,
    )