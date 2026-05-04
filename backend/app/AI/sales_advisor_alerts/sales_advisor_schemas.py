from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SalesAdvisorAlertResponse(BaseModel):
    alert_id: int
    user_id: int
    alert_type: str
    title: str
    message: str
    priority: str
    is_read: bool
    created_at: Optional[datetime]


class SalesAdvisorLatestPriorityAlertResponse(BaseModel):
    sales_advisor_id: int
    alert: Optional[SalesAdvisorAlertResponse]
