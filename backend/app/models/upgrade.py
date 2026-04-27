from sqlmodel import SQLModel, Field


class Upgrade(SQLModel, table=True):
    __tablename__ = "upgrade"

    upgrade_id: int | None = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.product_id")
    upgrade_type: str
    brand_scope: str
    installation_required: bool = False
