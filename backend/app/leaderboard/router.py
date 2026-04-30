from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.database import get_session
from app.models.app_user import AppUser
from app.manager_statistics.router import get_current_user
from app.leaderboard.schemas import (
    LeaderboardResponse,
    LeaderboardSummaryCompareResponse,
)
from app.leaderboard.service import (
    get_manager_leaderboard,
    get_manager_leaderboard_summary,
)

router = APIRouter(
    prefix="/api/manager/dashboard",
    tags=["Ranking"],
)


@router.get(
    "/leaderboard",
    response_model=LeaderboardResponse,
    status_code=200,
)
def read_manager_leaderboard(
    interval: str = Query(default="all", pattern="^(day|week|month|all)$"),
    q: str | None = Query(default=None),
    sort_by: str = Query(
        default="points",
        alias="sortBy",
        pattern="^(points|first_name|last_name|email|position)$",
    ),
    sort_dir: str = Query(
        default="desc",
        alias="sortDir",
        pattern="^(asc|desc)$",
    ),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, alias="pageSize", ge=1, le=100),
    session: Session = Depends(get_session),
    current_user: AppUser = Depends(get_current_user),
):
    return get_manager_leaderboard(
        session=session,
        current_user=current_user,
        interval=interval,
        q=q,
        sort_by=sort_by,
        sort_dir=sort_dir,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/leaderboard/summary",
    response_model=LeaderboardSummaryCompareResponse,
    status_code=200,
)
def read_manager_leaderboard_summary(
    interval: str = Query(default="all", pattern="^(day|week|month|all)$"),
    session: Session = Depends(get_session),
    current_user: AppUser = Depends(get_current_user),
):
    return get_manager_leaderboard_summary(
        session=session,
        current_user=current_user,
        interval=interval,
    )