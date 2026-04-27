from sqlmodel import SQLModel, Field


class Vehicle(SQLModel, table=True):
    __tablename__ = "vehicle"

    vehicle_id: int | None = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.product_id")
    brand: str
    model: str
    trim_name: str | None = None
    model_year: int
    fuel_type: str
    body_type: str
    transmission: str
