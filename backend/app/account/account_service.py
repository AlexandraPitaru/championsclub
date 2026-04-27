from datetime import datetime, timezone
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlmodel import Session, select

from app.account.account_repository import get_user_by_email, get_user_profile
from app.account.account_schemas import (
    DealershipInfo,
    DepartmentInfo,
    ManagerInfo,
    MeResponse,
    UserLoginRequest,
    UserLoginResponse,
)
from app.database import get_session
from app.models.app_user import AppUser
from app.security import create_access_token, decode_access_token, verify_password

bearer_scheme = HTTPBearer()


def login_user(session: Session, request: UserLoginRequest) -> UserLoginResponse:
    user = get_user_by_email(session, request.email)

    if user is None or not verify_password(request.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    user.last_login_at = datetime.now(timezone.utc)
    session.add(user)
    session.commit()

    return UserLoginResponse(access_token=create_access_token(user.user_id))


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    session: Annotated[Session, Depends(get_session)],
) -> AppUser:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        user_id = decode_access_token(credentials.credentials)
    except (JWTError, ValueError):
        raise credentials_exception

    user = session.exec(select(AppUser).where(AppUser.user_id == user_id)).first()
    if user is None:
        raise credentials_exception

    return user


def get_me(session: Session, current_user: AppUser) -> MeResponse:
    row = get_user_profile(session, current_user.user_id)

    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user, dealership, department, manager = row

    return MeResponse(
        user_id=user.user_id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone,
        employee_number=user.employee_number,
        role=user.role,
        rank=user.rank,
        points=user.points,
        credit=user.credit,
        status=user.status,
        last_login_at=user.last_login_at,
        department=DepartmentInfo(
            department_id=department.department_id,
            name=department.name,
        ),
        dealership=DealershipInfo(
            dealership_id=dealership.dealership_id,
            name=dealership.name,
            dealer_code=dealership.dealer_code,
            city=dealership.city,
            country=dealership.country,
            region=dealership.region,
        ),
        manager_user_id=user.manager_user_id,
        manager=ManagerInfo(
            user_id=manager.user_id,
            first_name=manager.first_name,
            last_name=manager.last_name,
            email=manager.email,
        ) if manager is not None else None,
    )
