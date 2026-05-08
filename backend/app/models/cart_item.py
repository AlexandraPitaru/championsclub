from sqlmodel import SQLModel, Field


class CartItem(SQLModel, table=True):
    __tablename__ = "cart_item"

    cart_item_id: int | None = Field(default=None, primary_key=True)
    cart_id: int = Field(foreign_key="cart.cart_id")
    reward_id: int = Field(foreign_key="reward_catalog.reward_id")
    quantity: int
