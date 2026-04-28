from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.database import get_session
from app.account.account_schemas import UserLoginRequest, UserLoginResponse
from app.account.account_service import login_user

router = APIRouter(
    prefix = '/api/account',
    tags=['Account']
)

@router.post('/login', response_model=UserLoginResponse, status_code=200)
def login(request: UserLoginRequest, session: Session = Depends(get_session)):
    return login_user(session, request)