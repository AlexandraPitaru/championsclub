from sqlmodel import SQLModel, Field


class SaleTransactionItem(SQLModel, table=True):
    __tablename__ = "sale_transaction_item"

    transaction_item_id: int | None = Field(default=None, primary_key=True)
    transaction_id: int = Field(foreign_key="sale_transaction.transaction_id")
    product_id: int = Field(foreign_key="product.product_id")
    quantity: int
