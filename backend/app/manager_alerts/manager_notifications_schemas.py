from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class ManagerNotificationItem(BaseModel):
    alert_id: int
    user_id: int
    employee_name: str
    employee_email: str
    employee_number: str
    rank: str
    points: int
    alert_type: str
    title: str
    message: str
    priority: str
    is_read: bool
    created_at: Optional[datetime]


class ManagerNotificationsResponse(BaseModel):
    manager_id: int
    total_alerts: int
    unread_alerts: int
    notifications: List[ManagerNotificationItem]