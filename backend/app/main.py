from fastapi import FastAPI
from sqlmodel import Session, select

from app.config import settings
from app.database import create_db_and_tables, engine
from app.models import AppUser
from app import models  # noqa: F401 - registers all SQLModel tables
from app.routers import account_router


app = FastAPI(title="ChampionsClub API")

app.include_router(account_router)


def _seed_database_if_empty() -> None:
    if not settings.auto_seed:
        return

    with Session(engine) as session:
        has_users = session.exec(select(AppUser).limit(1)).first() is not None

    if has_users:
        return

    from app.data.seeds.seed import main as run_seed_data

    run_seed_data()


@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    _seed_database_if_empty()


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {
        "status": "ok",
        "environment": settings.app_env,
        "database_configured": str(bool(settings.database_url)).lower(),
    }