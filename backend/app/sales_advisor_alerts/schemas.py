from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class SalesAdvisorAlertItem(BaseModel):
    alert_id: int
    alert_type: str
    title: str
    message: str
    priority: str
    is_read: bool
    created_at: Optional[datetime]


class SalesAdvisorAlertsResponse(BaseModel):
    user_id: int
    total_alerts: int
    unread_alerts: int
    limit: int
    offset: int
    has_more: bool
    next_offset: Optional[int]
    alerts: List[SalesAdvisorAlertItem]
