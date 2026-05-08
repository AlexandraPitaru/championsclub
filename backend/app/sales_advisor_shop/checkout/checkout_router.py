from fastapi import APIRouter, Depends, Response, status
from sqlmodel import Session

from app.database import get_session
from app.manager_statistics.router import get_current_user
from app.models.app_user import AppUser
from app.sales_advisor_shop.checkout.checkout_schemas import CheckoutResponse
from app.sales_advisor_shop.checkout.checkout_service import checkout_cart


router = APIRouter(prefix="/api/sales-advisor/shop", tags=["sales-advisor-checkout"])


@router.post("/checkout", response_model=CheckoutResponse)
def post_checkout(
    response: Response,
    session: Session = Depends(get_session),
    current_user: AppUser = Depends(get_current_user),
):
    result = checkout_cart(session=session, current_user=current_user)
    response.status_code = status.HTTP_201_CREATED
    return result
