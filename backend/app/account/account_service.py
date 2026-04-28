from datetime import datetime, timezone
from fastapi import HTTPException
from sqlmodel import Session

from app.account.account_repository import get_user_by_email
from app.account.account_schemas import UserLoginRequest, UserLoginResponse


def login_user(session: Session, request: UserLoginRequest) -> UserLoginResponse:
    if not request.email or not request.password:
        raise HTTPException(
            status_code=400,
            detail="Email and password are required"
        )

    user = get_user_by_email(session, request.email)

    if user is None or user.password != request.password:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )

    user.last_login_at = datetime.now(timezone.utc)
    session.add(user)
    session.commit()
    session.refresh(user)

    return UserLoginResponse(
        user_id=user.user_id,
        email=user.email,
        role=user.role
    )