from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from app.database import get_session
from app.manager_statistics.router import get_current_user
from app.models.app_user import AppUser
from app.sales_advisor_shop.schemas import (
    AddCartItemRequest,
    CheckoutResponse,
    RedemptionHistoryResponse,
    RedemptionHistoryRecordResponse,
    SalesAdvisorCartResponse,
    SalesAdvisorShopOverviewResponse,
    UpdateCartItemRequest,
)
from app.sales_advisor_shop.service import (
    add_cart_item,
    checkout_cart,
    get_cart,
    get_redemption_history,
    get_shop_overview,
    remove_cart_item,
    update_cart_item_quantity,
)


router = APIRouter(
    prefix="/api/sales-advisor/shop",
    tags=["sales-advisor-shop"],
)


@router.get("", response_model=SalesAdvisorShopOverviewResponse, status_code=status.HTTP_200_OK)
def read_shop_overview(
    session: Session = Depends(get_session),
    current_user: AppUser = Depends(get_current_user),
):
    return get_shop_overview(session=session, current_user=current_user)


@router.get("/cart", response_model=SalesAdvisorCartResponse, status_code=status.HTTP_200_OK)
def read_cart(
    session: Session = Depends(get_session),
    current_user: AppUser = Depends(get_current_user),
):
    return get_cart(session=session, current_user=current_user)


@router.post("/cart/items", response_model=SalesAdvisorCartResponse, status_code=status.HTTP_201_CREATED)
def create_cart_item(
    payload: AddCartItemRequest,
    session: Session = Depends(get_session),
    current_user: AppUser = Depends(get_current_user),
):
    return add_cart_item(session=session, current_user=current_user, payload=payload)


@router.patch("/cart/items/{cart_item_id}", response_model=SalesAdvisorCartResponse, status_code=status.HTTP_200_OK)
def patch_cart_item(
    cart_item_id: int,
    payload: UpdateCartItemRequest,
    session: Session = Depends(get_session),
    current_user: AppUser = Depends(get_current_user),
):
    return update_cart_item_quantity(
        session=session,
        current_user=current_user,
        cart_item_id=cart_item_id,
        payload=payload,
    )


@router.delete("/cart/items/{cart_item_id}", response_model=SalesAdvisorCartResponse, status_code=status.HTTP_200_OK)
def delete_cart_item_route(
    cart_item_id: int,
    session: Session = Depends(get_session),
    current_user: AppUser = Depends(get_current_user),
):
    return remove_cart_item(
        session=session,
        current_user=current_user,
        cart_item_id=cart_item_id,
    )


@router.post("/checkout", response_model=CheckoutResponse, status_code=status.HTTP_201_CREATED)
def post_checkout(
    session: Session = Depends(get_session),
    current_user: AppUser = Depends(get_current_user),
):
    return checkout_cart(session=session, current_user=current_user)


@router.get(
    "/redemptions",
    response_model=RedemptionHistoryResponse,
    status_code=status.HTTP_200_OK,
)
def read_redemptions(
    session: Session = Depends(get_session),
    current_user: AppUser = Depends(get_current_user),
):
    return get_redemption_history(session=session, current_user=current_user)
