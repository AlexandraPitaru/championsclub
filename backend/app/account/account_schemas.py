from pydantic import BaseModel
from datetime import datetime
from enum import Enum

class UserLoginRequest(BaseModel):
    email: str | None = None
    password: str | None = None

class UserLoginResponse(BaseModel):
    email: str
    user_id: int
    role: str 

class UserRole(str, Enum):
    manager = "manager"
    sales_advisor = "sales_advisor"

class DepartmentSummary(BaseModel):
    department_id: int
    name: str


class DealershipSummary(BaseModel):
    dealership_id: int
    name: str
    dealer_code: str
    city: str
    country: str
    region: str


class ManagerSummary(BaseModel):
    user_id: int
    first_name: str
    last_name: str
    email: str

class CurrentUserResponse(BaseModel):
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
    department: DepartmentSummary
    dealership: DealershipSummary
    manager: ManagerSummary | None

