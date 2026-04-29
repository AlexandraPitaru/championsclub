from fastapi import FastAPI
from sqlmodel import Session, select

from app.config import settings
from app.database import create_db_and_tables, engine
from app.data.seeds.seed import main as run_seed_data
from app.models import AppUser
from app import models
from app.account.account_router import router as account_router
from app.manager_statistics.router import router as manager_statistics_router
from app.manager_alerts.manager_notifications_router import (router as manager_notifications_router,)

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="ChampionsClub API")
    
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(manager_statistics_router)

app.include_router(account_router)

app.include_router(manager_notifications_router)

def seed_database_if_empty() -> None:
    if not settings.auto_seed:
        return

    with Session(engine) as session:
        has_users = session.exec(select(AppUser).limit(1)).first() is not None

    if has_users:
        return

    run_seed_data()


@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    seed_database_if_empty()


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {
        "status": "ok",
        "environment": settings.app_env,
        "database_configured": str(bool(settings.database_url)).lower(),
    }