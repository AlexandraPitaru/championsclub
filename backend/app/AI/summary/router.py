from fastapi import APIRouter

from app.AI.summary.schemas import KpiSummaryRequest, KpiSummaryResponse
from app.AI.summary.service import generate_kpi_summary


router = APIRouter(
    prefix="/ai-summary",
    tags=["AI Summary"],
)


@router.post("/kpi", response_model=KpiSummaryResponse)
def create_kpi_summary(payload: KpiSummaryRequest):
    return generate_kpi_summary(payload)