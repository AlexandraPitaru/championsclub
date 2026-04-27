from datetime import datetime
from sqlmodel import SQLModel, Field


class UserAlert(SQLModel, table=True):
    __tablename__ = "user_alert"

    alert_id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="app_user.user_id")
    alert_type: str
    title: str
    message: str
    priority: str
    is_read: bool = False
    created_at: datetime