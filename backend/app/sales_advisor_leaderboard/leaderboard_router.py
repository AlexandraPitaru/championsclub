from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.database import get_session
from app.manager_statistics.router import get_current_user
from app.models.app_user import AppUser
from app.sales_advisor_leaderboard.leaderboard_schemas import (
    SalesAdvisorLeaderboardResponse,
)
from app.sales_advisor_leaderboard.leaderboard_service import (
    get_sales_advisor_leaderboard,
)


router = APIRouter(
    prefix="/api/sales-advisor",
    tags=["sales-advisor-leaderboard"],
)


@router.get(
    "/leaderboard",
    response_model=SalesAdvisorLeaderboardResponse,
    status_code=200,
)
def read_sales_advisor_leaderboard(
    scope: str = Query(default="team"),
    limit: str = Query(default="10"),
    session: Session = Depends(get_session),
    current_user: AppUser = Depends(get_current_user),
):
    return get_sales_advisor_leaderboard(
        session=session,
        current_user=current_user,
        scope=scope,
        limit=limit,
    )
