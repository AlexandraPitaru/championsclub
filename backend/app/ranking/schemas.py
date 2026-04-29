from pydantic import BaseModel


class EmployeePointsResponse(BaseModel):
    user_id: int
    first_name: str
    last_name: str
    email: str
    role: str
    points: int
    rank: str


class EmployeePointsListResponse(BaseModel):
    employees: list[EmployeePointsResponse]