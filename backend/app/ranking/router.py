from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.database import get_session
from app.auth.dependencies import get_current_user
from app.models.app_user import AppUser
from app.ranking.schemas import EmployeePointsListResponse
from app.ranking.service import get_employee_points_for_manager


router = APIRouter(
    prefix="/api/manager/dashboard",
    tags=["Ranking"],
)


@router.get(
    "/employee-points",
    response_model=EmployeePointsListResponse,
    status_code=200,
)
def get_manager_employee_points(
    session: Session = Depends(get_session),
    current_user: AppUser = Depends(get_current_user),
):
    return get_employee_points_for_manager(
        session=session,
        current_user=current_user,
    )