from fastapi import APIRouter

from app.AI.summary.manager_schemas import (
    ManagerTeamSummaryRequest,
    ManagerTeamSummaryResponse,
)
from app.AI.summary.manager_service import generate_manager_team_summary


router = APIRouter(
    prefix="/api/manager/dashboard",
    tags=["Manager AI Summary"],
)


@router.post("/summary", response_model=ManagerTeamSummaryResponse)
def create_manager_team_summary(payload: ManagerTeamSummaryRequest):
    return generate_manager_team_summary(payload)