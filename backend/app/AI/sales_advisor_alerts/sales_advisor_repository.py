from sqlalchemy import case, desc, func
from sqlmodel import Session, select

from app.models.user_alert import UserAlert


def get_latest_priority_alert_for_sales_advisor(
    session: Session,
    sales_advisor_id: int,
) -> UserAlert | None:
    priority_order = case(
        (func.lower(UserAlert.priority) == "high", 1),
        (func.lower(UserAlert.priority) == "medium", 2),
        (func.lower(UserAlert.priority) == "low", 3),
        else_=4,
    )

    statement = (
        select(UserAlert)
        .where(UserAlert.user_id == sales_advisor_id)
        .order_by(
            priority_order,
            desc(UserAlert.created_at),
            desc(UserAlert.alert_id),
        )
        .limit(1)
    )

    return session.exec(statement).first()
