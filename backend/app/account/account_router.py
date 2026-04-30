from fastapi import APIRouter, Depends, Header, HTTPException
from sqlmodel import Session

from app.database import get_session
from app.account.account_schemas import UserLoginRequest, UserLoginResponse, CurrentUserResponse
from app.account.account_service import login_user, get_current_user_profile

router = APIRouter(
    prefix = '/api/account',
    tags=['Account']
)

@router.post('/login', response_model=UserLoginResponse, status_code=200)
def login(request: UserLoginRequest, session: Session = Depends(get_session)):
    return login_user(session, request)


def get_current_user_id(x_user_id: int | None = Header(default=None)) -> int:
    if x_user_id is None:
        raise HTTPException(status_code=401, detail="Authentication required")
    return x_user_id


@router.get('/me', response_model=CurrentUserResponse, status_code=200)
def read_current_user(
    current_user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
):
    return get_current_user_profile(session, current_user_id)