from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.AI.activity_summary.activity_summary_schemas import (
    AdvisorActivitySummaryResponse,
    IntervalType,
)
from app.AI.activity_summary.activity_summary_service import (
    generate_advisor_activity_summary,
)
from app.database import get_session
from app.manager_statistics.router import get_current_user
from app.models.app_user import AppUser


router = APIRouter(
    prefix="/api/manager/profile",
    tags=["Advisor AI Activity Summary"],
)


@router.get(
    "/users/{user_id}/activity-summary",
    response_model=AdvisorActivitySummaryResponse,
)
def read_advisor_activity_summary(
    user_id: int,
    interval: IntervalType = Query(default="all"),
    session: Session = Depends(get_session),
    current_user: AppUser = Depends(get_current_user),
):
    return generate_advisor_activity_summary(
        session=session,
        current_manager=current_user,
        advisor_id=user_id,
        interval=interval,
    )
