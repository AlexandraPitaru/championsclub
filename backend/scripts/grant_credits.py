from sqlmodel import Session, select
from app.database import engine
from app.models.app_user import AppUser

EMAIL = "user380@championsclub.demo"
CREDITS = 400

def main():
    with Session(engine) as session:
        user = session.exec(select(AppUser).where(AppUser.email == EMAIL)).first()
        if not user:
            print(f"User with email {EMAIL} not found.")
            return
        user.credit = CREDITS
        session.add(user)
        session.commit()
        print(f"Set {CREDITS} credits for {EMAIL} (user_id={user.user_id})")

if __name__ == "__main__":
    main()
