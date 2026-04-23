from fastapi import FastAPI

from app.config import settings


app = FastAPI(title="ChampionsClub API")


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {
        "status": "ok",
        "environment": settings.app_env,
        "database_configured": str(bool(settings.database_url)).lower(),
    }