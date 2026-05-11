from fastapi import APIRouter, Depends, Response, status
from sqlmodel import Session

from app.database import get_session
from app.manager_statistics.router import get_current_user
from app.models.app_user import AppUser
from app.sales_advisor_shop.cart_management.cart_schemas import (
    AddCartItemRequest,
    CartResponse,
    UpdateCartItemRequest,
)
from app.sales_advisor_shop.cart_management.cart_service import (
    add_item_to_cart,
    get_cart,
    remove_cart_item,
    update_cart_item,
)


router = APIRouter(prefix="/api/sales-advisor/shop", tags=["sales-advisor-cart"])


@router.get("/cart", response_model=CartResponse, status_code=200)
def read_cart(
    session: Session = Depends(get_session),
    current_user: AppUser = Depends(get_current_user),
):
    return get_cart(session=session, current_user=current_user)


@router.post("/cart/items", response_model=CartResponse)
def add_item(
    payload: AddCartItemRequest,
    response: Response,
    session: Session = Depends(get_session),
    current_user: AppUser = Depends(get_current_user),
):
    cart_response, created = add_item_to_cart(session=session, current_user=current_user, payload=payload)
    response.status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
    return cart_response


@router.patch("/cart/items/{cart_item_id}", response_model=CartResponse, status_code=200)
def update_item(
    cart_item_id: int,
    payload: UpdateCartItemRequest,
    session: Session = Depends(get_session),
    current_user: AppUser = Depends(get_current_user),
):
    return update_cart_item(session=session, current_user=current_user, cart_item_id=cart_item_id, payload=payload)


@router.delete("/cart/items/{cart_item_id}")
def delete_item(
    cart_item_id: int,
    session: Session = Depends(get_session),
    current_user: AppUser = Depends(get_current_user),
):
    remove_cart_item(session=session, current_user=current_user, cart_item_id=cart_item_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
