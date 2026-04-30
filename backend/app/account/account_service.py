from datetime import datetime, timezone

from fastapi import HTTPException
from sqlmodel import Session
from sqlmodel import select

from app.models.app_user import AppUser
from app.account.account_repository import get_user_by_email, get_current_user_profile_row
from app.account.account_schemas import (
    UserLoginRequest,
    UserLoginResponse,
    CurrentUserResponse,
    DepartmentSummary,
    DealershipSummary,
    ManagerSummary,
    UserRole,
)


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


def get_current_user_by_id(
    session: Session,
    user_id: int,
) -> AppUser:
    user = session.exec(
        select(AppUser).where(AppUser.user_id == user_id)
    ).first()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid authenticated user"
        )

    return user


def get_current_user_profile(session: Session, current_user_id: int) -> CurrentUserResponse:
    row = get_current_user_profile_row(session, current_user_id)

    if row is None:
        raise HTTPException(status_code=404, detail="User not found")

    (
        user,
        department_id,
        department_name,
        dealership_id,
        dealership_name,
        dealer_code,
        city,
        country,
        region,
        manager_user_id,
        manager_first_name,
        manager_last_name,
        manager_email,
    ) = row

    manager = None
    if manager_user_id is not None:
        manager = ManagerSummary(
            user_id=manager_user_id,
            first_name=manager_first_name,
            last_name=manager_last_name,
            email=manager_email,
        )

    return CurrentUserResponse(
        user_id=user.user_id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone,
        employee_number=user.employee_number,
        role=UserRole(user.role.lower()),
        rank=user.rank,
        points=user.points,
        credit=user.credit,
        status=user.status,
        last_login_at=user.last_login_at,
        department=DepartmentSummary(
            department_id=department_id,
            name=department_name,
        ),
        dealership=DealershipSummary(
            dealership_id=dealership_id,
            name=dealership_name,
            dealer_code=dealer_code,
            city=city,
            country=country,
            region=region,
        ),
        manager=manager,
    )