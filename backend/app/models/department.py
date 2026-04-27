from sqlmodel import SQLModel, Field


class Department(SQLModel, table=True):
    __tablename__ = "department"

    department_id: int | None = Field(default=None, primary_key=True)
    dealership_id: int = Field(foreign_key="dealership.dealership_id")
    name: str