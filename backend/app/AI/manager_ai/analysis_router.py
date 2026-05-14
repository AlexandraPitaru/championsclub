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
from app.sales_advisor_profile.ai_forecast_recommendations_schemas import (
    SalesAdvisorForecastRecommendationsResponse,
)
from app.AI.manager_ai.forecast_service import (
    get_manager_ai_forecast_recommendations,
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


@router.get(
    "/ai-forecast-recommendations",
    response_model=SalesAdvisorForecastRecommendationsResponse,
    response_model_by_alias=True,
    status_code=200,
)
def read_manager_ai_forecast_recommendations(
    session: Session = Depends(get_session),
    current_user: AppUser = Depends(get_current_user),
):
    return get_manager_ai_forecast_recommendations(
        session=session,
        current_user=current_user,
    )


@router.post(
    "/ai-insights/refresh",
    status_code=200,
)
def refresh_manager_ai_insights(
    session: Session = Depends(get_session),
    current_user: AppUser = Depends(get_current_user),
):
    analysis = get_manager_ai_analysis(
        session=session,
        current_user=current_user,
    )
    forecast = get_manager_ai_forecast_recommendations(
        session=session,
        current_user=current_user,
    )

    return {
        "analysis": analysis,
        "forecast": forecast.model_dump(mode="json", by_alias=True),
    }
