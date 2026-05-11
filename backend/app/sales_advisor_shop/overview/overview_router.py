from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.database import get_session
from app.manager_statistics.router import get_current_user
from app.models.app_user import AppUser
from app.sales_advisor_shop.overview.overview_schemas import (
    SalesAdvisorShopOverviewResponse,
)
from app.sales_advisor_shop.overview.overview_service import (
    get_sales_advisor_shop_overview,
)


router = APIRouter(prefix="/api/sales-advisor", tags=["sales-advisor-shop"])


@router.get("/shop", response_model=SalesAdvisorShopOverviewResponse, status_code=200)
def read_sales_advisor_shop_overview(
    session: Session = Depends(get_session),
    current_user: AppUser = Depends(get_current_user),
):
    return get_sales_advisor_shop_overview(session=session, current_user=current_user)
