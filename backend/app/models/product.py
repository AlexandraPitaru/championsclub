from sqlmodel import SQLModel, Field


class Product(SQLModel, table=True):
    __tablename__ = "product"

    product_id: int | None = Field(default=None, primary_key=True)
    item_type: str
    name: str
    description: str | None = None
    price: float
    points_value: int
