from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.account.account_schemas import MeResponse, UserLoginRequest, UserLoginResponse
from app.account.account_service import get_current_user, get_me, login_user
from app.database import get_session
from app.models.app_user import AppUser

router = APIRouter(prefix="/api/account", tags=["Account"])


@router.post("/login", response_model=UserLoginResponse, status_code=200)
def login(
    request: UserLoginRequest,
    session: Annotated[Session, Depends(get_session)],
) -> UserLoginResponse:
    return login_user(session, request)


@router.get("/me", response_model=MeResponse)
def me(
    current_user: Annotated[AppUser, Depends(get_current_user)],
    session: Annotated[Session, Depends(get_session)],
) -> MeResponse:
    return get_me(session, current_user)
