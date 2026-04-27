from sqlmodel import SQLModel, Field


class Dealership(SQLModel, table=True):
    __tablename__ = "dealership"

    dealership_id: int | None = Field(default=None, primary_key=True)
    name: str
    dealer_code: str
    city: str
    country: str
    region: str