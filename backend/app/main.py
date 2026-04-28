from fastapi import FastAPI

from app.config import settings
from app.database import create_db_and_tables
from app import models
from app.manager_statistics.router import router as manager_statistics_router

app = FastAPI(title="ChampionsClub API")

app.include_router(manager_statistics_router)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {
        "status": "ok",
        "environment": settings.app_env,
        "database_configured": str(bool(settings.database_url)).lower(),
    }