from datetime import datetime, date
from sqlmodel import SQLModel, Field


class AppUser(SQLModel, table=True):
    __tablename__ = "app_user"

    user_id: int | None = Field(default=None, primary_key=True)
    dealership_id: int = Field(foreign_key="dealership.dealership_id")
    department_id: int = Field(foreign_key="department.department_id")
    manager_user_id: int | None = Field(default=None, foreign_key="app_user.user_id")

    role: str
    first_name: str
    last_name: str
    email: str = Field(index=True, unique=True)
    phone: str | None = None
    employee_number: str = Field(index=True, unique=True)

    rank: str
    points: int = 0
    credit: float = 0
    hire_date: date
    status: str = "active"
    last_login_at: datetime | None = None