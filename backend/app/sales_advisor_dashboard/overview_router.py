from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.database import get_session
from app.manager_statistics.router import get_current_user
from app.models.app_user import AppUser
from app.sales_advisor_dashboard.overview_schemas import (
    SalesAdvisorDashboardOverviewResponse,
)
from app.sales_advisor_dashboard.overview_service import (
    get_sales_advisor_dashboard_overview,
)


router = APIRouter(
    prefix="/api/sales-advisor/dashboard",
    tags=["sales-advisor-dashboard"],
)


@router.get(
    "/overview",
    response_model=SalesAdvisorDashboardOverviewResponse,
    status_code=200,
)
def read_sales_advisor_dashboard_overview(
    session: Session = Depends(get_session),
    current_user: AppUser = Depends(get_current_user),
):
    return get_sales_advisor_dashboard_overview(
        session=session,
        current_user=current_user,
    )
