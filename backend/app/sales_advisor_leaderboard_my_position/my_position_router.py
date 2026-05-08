from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlmodel import Session

from app.database import get_session
from app.models.app_user import AppUser
from app.sales_advisor_leaderboard_my_position.my_position_schemas import (
    SalesAdvisorLeaderboardMyPositionResponse,
)
from app.sales_advisor_leaderboard_my_position.my_position_service import (
    get_sales_advisor_leaderboard_my_position,
)


def get_current_user_for_my_position(
    x_user_id: str | None = Header(default=None),
    session: Session = Depends(get_session),
) -> AppUser:
    if x_user_id is None:
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        user_id = int(x_user_id)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="Invalid X-User-Id. Use an integer.",
        )

    user = session.get(AppUser, user_id)

    if user is None:
        raise HTTPException(status_code=401, detail="Invalid user ID")

    return user


router = APIRouter(
    prefix="/api/sales-advisor/leaderboard",
    tags=["sales-advisor-leaderboard-my-position"],
)


@router.get(
    "/my-position",
    response_model=SalesAdvisorLeaderboardMyPositionResponse,
    status_code=200,
)
def read_sales_advisor_leaderboard_my_position(
    scope: str = Query(default="team"),
    session: Session = Depends(get_session),
    current_user: AppUser = Depends(get_current_user_for_my_position),
):
    return get_sales_advisor_leaderboard_my_position(
        session=session,
        current_user=current_user,
        scope=scope,
    )
