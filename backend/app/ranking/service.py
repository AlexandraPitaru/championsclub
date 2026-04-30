from fastapi import HTTPException
from sqlmodel import Session

from app.models.app_user import AppUser
from app.ranking.repository import get_employees_by_manager_id
from app.ranking.schemas import (
    EmployeePointsListResponse,
    EmployeePointsResponse,
)


def validate_manager(current_user: AppUser) -> None:
    if current_user.role.upper() != "MANAGER":
        raise HTTPException(
            status_code=403,
            detail="Access denied: Manager role required",
        )


def get_employee_points_for_manager(
    session: Session,
    current_user: AppUser,
) -> EmployeePointsListResponse:
    validate_manager(current_user)

    employees = get_employees_by_manager_id(
        session=session,
        manager_user_id=current_user.user_id,
    )

    return EmployeePointsListResponse(
        employees=[
            EmployeePointsResponse(
                user_id=employee.user_id,
                first_name=employee.first_name,
                last_name=employee.last_name,
                email=employee.email,
                role=employee.role,
                points=employee.points,
                rank=employee.rank,
            )
            for employee in employees
        ]
    )