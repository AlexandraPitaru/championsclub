from fastapi import FastAPI
from sqlmodel import Session, select

from app.config import settings
from app.database import create_db_and_tables, engine
from app.data.seeds.seed import main as run_seed_data
from app.models import AppUser
from app import models
from app.account.account_router import router as account_router
from app.manager_statistics.router import router as manager_statistics_router
from app.manager_alerts.manager_notifications_router import router as manager_notifications_router
from app.leaderboard.router import router as leaderboard_router
from app.AI.summary.manager_router import router as ai_summary_router
from app.AI.activity_summary.activity_summary_router import router as ai_activity_summary_router
from app.sales_advisor_dashboard.overview_router import router as sales_advisor_dashboard_router
from app.sales_advisor_leaderboard.leaderboard_router import (
    router as sales_advisor_leaderboard_router,
)
from app.sales_advisor_leaderboard_my_position.my_position_router import (
    router as sales_advisor_leaderboard_my_position_router,
)
from app.sales_advisor_profile.profile_router import (
    router as sales_advisor_profile_router,
)
from app.sales_advisor_performance_charts.performance_charts_router import (
    router as sales_advisor_performance_charts_router,
)
from app.sales_advisor_shop.overview.overview_router import (
    router as sales_advisor_shop_overview_router,
)
from app.sales_advisor_shop.cart_management.cart_router import (
    router as sales_advisor_cart_router,
)
from app.sales_advisor_shop.checkout.checkout_router import (
    router as sales_advisor_checkout_router,
)
from app.sales_advisor_shop.history.history_router import (
    router as sales_advisor_history_router,
)

from app.sales_advisor_profile.ai_analysis_router import (
    router as sales_advisor_profile_ai_router,
)
from app.sales_advisor_shop.router import router as sales_advisor_shop_router
from app.AI.manager_ai.analysis_router import (
    router as manager_ai_router,
)


from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="ChampionsClub API")
    
import os
# CORS flexibil: orice origine în development (pentru Docker), doar localhost în producție sau local
if os.environ.get("APP_ENV", "development") == "development":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
        ],
        allow_origin_regex=r"https?://(localhost|127\\.0\\.0\\.1)(:\\d+)?$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(manager_statistics_router)
app.include_router(leaderboard_router)
app.include_router(account_router)
app.include_router(ai_summary_router)
app.include_router(ai_activity_summary_router)
app.include_router(sales_advisor_dashboard_router)
app.include_router(sales_advisor_leaderboard_router)
app.include_router(sales_advisor_leaderboard_my_position_router)
app.include_router(sales_advisor_profile_router)
app.include_router(sales_advisor_performance_charts_router)
app.include_router(sales_advisor_shop_overview_router)
app.include_router(sales_advisor_cart_router)
app.include_router(sales_advisor_checkout_router)
app.include_router(sales_advisor_history_router)
app.include_router(sales_advisor_profile_ai_router)
app.include_router(sales_advisor_shop_router)
app.include_router(manager_ai_router)

app.include_router(manager_notifications_router)
from app.sales_advisor_alerts.router import router as sales_advisor_alerts_router
app.include_router(sales_advisor_alerts_router)

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
