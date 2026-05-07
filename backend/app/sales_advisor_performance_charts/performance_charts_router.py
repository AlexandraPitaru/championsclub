from fastapi import APIRouter, Depends, Header, HTTPException
from sqlmodel import Session

from app.database import get_session
from app.models.app_user import AppUser
from app.sales_advisor_performance_charts.performance_charts_schemas import (
    SalesAdvisorPerformanceChartsResponse,
)
from app.sales_advisor_performance_charts.performance_charts_service import (
    get_sales_advisor_performance_charts,
)


def get_current_user_for_performance_charts(
    x_user_id: str | None = Header(default=None),
    session: Session = Depends(get_session),
) -> AppUser:
    if x_user_id is None:
        raise HTTPException(status_code=401, detail="Authentication required")

    try:
        user_id = int(x_user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid request.")

    user = session.get(AppUser, user_id)

    if user is None:
        raise HTTPException(status_code=401, detail="Invalid user ID")

    return user


router = APIRouter(
    prefix="/api/sales-advisor/dashboard",
    tags=["sales-advisor-performance-charts"],
)


@router.get(
    "/charts",
    response_model=SalesAdvisorPerformanceChartsResponse,
    status_code=200,
)
def read_sales_advisor_performance_charts(
    session: Session = Depends(get_session),
    current_user: AppUser = Depends(get_current_user_for_performance_charts),
):
    return get_sales_advisor_performance_charts(
        session=session,
        current_user=current_user,
    )
