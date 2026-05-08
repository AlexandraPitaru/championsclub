from datetime import datetime
from sqlmodel import SQLModel, Field


class Cart(SQLModel, table=True):
    __tablename__ = "cart"

    cart_id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="app_user.user_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
