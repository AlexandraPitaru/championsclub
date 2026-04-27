from sqlmodel import Session, select
from app.models.app_user import AppUser

def get_user_by_email(session:Session, email:str) -> AppUser | None:
    statement = select(AppUser).where(AppUser.email == email)
    return session.exec(statement).first()