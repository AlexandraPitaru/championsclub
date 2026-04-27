from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlmodel import Session

from app.auth import get_current_user_id
from app.database import get_session
from app.schemas.account import (
    DealershipResponse,
    DepartmentResponse,
    ManagerResponse,
    MeResponse,
    UserRole,
)

router = APIRouter(prefix="/api/account", tags=["account"])

_ME_QUERY = text(
    """
    SELECT
        u.user_id,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.employee_number,
        u.role,
        u.rank,
        u.points,
        u.credit,
        u.status,
        u.last_login_at,
        u.department_id,
        dep.name            AS department_name,
        u.dealership_id,
        dl.name             AS dealership_name,
        dl.dealer_code,
        dl.city,
        dl.country,
        dl.region,
        u.manager_user_id,
        mgr.user_id         AS manager_user_id_val,
        mgr.first_name      AS manager_first_name,
        mgr.last_name       AS manager_last_name,
        mgr.email           AS manager_email
    FROM app_user u
    JOIN department dep ON dep.department_id = u.department_id
    JOIN dealership dl  ON dl.dealership_id  = u.dealership_id
    LEFT JOIN app_user mgr ON mgr.user_id = u.manager_user_id
    WHERE u.user_id = :user_id
    """
)


@router.get("/me", response_model=MeResponse)
def get_me(
    user_id: int = Depends(get_current_user_id),
    session: Session = Depends(get_session),
) -> MeResponse:
    row = session.execute(_ME_QUERY, {"user_id": user_id}).mappings().first()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    manager: ManagerResponse | None = None
    if row["manager_user_id"] is not None:
        manager = ManagerResponse(
            user_id=row["manager_user_id_val"],
            first_name=row["manager_first_name"],
            last_name=row["manager_last_name"],
            email=row["manager_email"],
        )

    return MeResponse(
        user_id=row["user_id"],
        email=row["email"],
        first_name=row["first_name"],
        last_name=row["last_name"],
        phone=row["phone"],
        employee_number=row["employee_number"],
        role=UserRole(row["role"]),
        rank=row["rank"],
        points=row["points"],
        credit=row["credit"],
        status=row["status"],
        last_login_at=row["last_login_at"],
        department=DepartmentResponse(
            department_id=row["department_id"],
            name=row["department_name"],
        ),
        dealership=DealershipResponse(
            dealership_id=row["dealership_id"],
            name=row["dealership_name"],
            dealer_code=row["dealer_code"],
            city=row["city"],
            country=row["country"],
            region=row["region"],
        ),
        manager=manager,
    )
