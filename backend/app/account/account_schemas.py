from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr


class UserRole(str, Enum):
    manager = "manager"
    sales_advisor = "sales_advisor"


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class DepartmentInfo(BaseModel):
    department_id: int
    name: str


class DealershipInfo(BaseModel):
    dealership_id: int
    name: str
    dealer_code: str
    city: str
    country: str
    region: str


class ManagerInfo(BaseModel):
    user_id: int
    first_name: str
    last_name: str
    email: str


class MeResponse(BaseModel):
    user_id: int
    email: str
    first_name: str
    last_name: str
    phone: str | None
    employee_number: str
    role: UserRole
    rank: str
    points: int
    credit: float
    status: str
    last_login_at: datetime | None
    department: DepartmentInfo
    dealership: DealershipInfo
    manager_user_id: int | None
    manager: ManagerInfo | None
