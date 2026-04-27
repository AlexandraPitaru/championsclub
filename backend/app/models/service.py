from sqlmodel import SQLModel, Field


class Service(SQLModel, table=True):
    __tablename__ = "service"

    service_id: int | None = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.product_id")
    service_type: str
    duration_months: int
    provider_name: str
    renewable: bool = True