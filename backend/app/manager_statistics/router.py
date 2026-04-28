from fastapi import APIRouter, Depends, Header, HTTPException
from sqlmodel import Session

from app.database import get_session
from app.models.app_user import AppUser
from app.manager_statistics.schemas import UserKpiResponse, TeamKpiResponse
from app.manager_statistics.service import get_user_kpis, get_team_kpis

router = APIRouter(prefix="/api/manager", tags=["manager-statistics"])


def get_current_user(
    x_user_id: int | None = Header(default=None),
    session: Session = Depends(get_session),
) -> AppUser:

    if x_user_id is None:
        raise HTTPException(status_code=401, detail="Authentication required")

    user = session.get(AppUser, x_user_id)

    if user is None:
        raise HTTPException(status_code=401, detail="Invalid user ID")

    return user

@router.get("/dashboard/users/{user_id}/kpis", response_model=UserKpiResponse)
def read_user_kpis(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: AppUser = Depends(get_current_user),
):
    return get_user_kpis(session, current_user, user_id)

@router.get("/profile/users/{user_id}/kpis", response_model=UserKpiResponse)
def read_user_kpis(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: AppUser = Depends(get_current_user),
):
    return get_user_kpis(session, current_user, user_id)


@router.get("/dashboard/team/kpis", response_model=TeamKpiResponse)
def read_team_kpis(
    session: Session = Depends(get_session),
    current_user: AppUser = Depends(get_current_user),
):
    return get_team_kpis(session, current_user)