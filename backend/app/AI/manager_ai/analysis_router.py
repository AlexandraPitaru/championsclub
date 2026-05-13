from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.database import get_session
from app.manager_statistics.router import get_current_user
from app.models.app_user import AppUser
from app.sales_advisor_profile.ai_analysis_schemas import (
    SalesAdvisorAiAnalysisResponse,
)
from app.AI.manager_ai.analysis_service import (
    get_manager_ai_analysis,
)


router = APIRouter(
    prefix="/api/manager",
    tags=["manager-ai"],
)


@router.get(
    "/ai-analysis",
    response_model=SalesAdvisorAiAnalysisResponse,
    status_code=200,
)
def read_manager_ai_analysis(
    session: Session = Depends(get_session),
    current_user: AppUser = Depends(get_current_user),
):
    return get_manager_ai_analysis(
        session=session,
        current_user=current_user,
    )
