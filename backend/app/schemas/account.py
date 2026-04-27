from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class UserRole(str, Enum):
    manager = "manager"
    sales_advisor = "sales_advisor"


class DepartmentResponse(BaseModel):
    department_id: int
    name: str


class DealershipResponse(BaseModel):
    dealership_id: int
    name: str
    dealer_code: str
    city: str
    country: str
    region: str


class ManagerResponse(BaseModel):
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
    department: DepartmentResponse
    dealership: DealershipResponse
    manager: ManagerResponse | None
