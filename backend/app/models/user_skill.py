from datetime import datetime
from sqlmodel import SQLModel, Field


class UserSkill(SQLModel, table=True):
    __tablename__ = "user_skill"

    user_skill_id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="app_user.user_id")
    skill_name: str
    skill_level: str
    verified: bool = False
    updated_at: datetime
