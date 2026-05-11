from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.database import get_session
from app.manager_statistics.router import get_current_user
from app.models.app_user import AppUser
from app.sales_advisor_shop.history.history_schemas import RedemptionHistoryResponse
from app.sales_advisor_shop.history.history_service import get_redemption_history


router = APIRouter(prefix="/api/sales-advisor/shop", tags=["sales-advisor-history"])


@router.get("/redemptions", response_model=RedemptionHistoryResponse, status_code=200)
def read_redemption_history(
    session: Session = Depends(get_session),
    current_user: AppUser = Depends(get_current_user),
):
    return get_redemption_history(session=session, current_user=current_user)
