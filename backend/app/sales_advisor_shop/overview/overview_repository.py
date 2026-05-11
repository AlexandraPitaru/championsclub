from sqlmodel import Session, select

from app.models.reward_catalog import RewardCatalog


def get_active_rewards(session: Session) -> list[RewardCatalog]:
    statement = select(RewardCatalog).where(RewardCatalog.is_active == True)  # noqa: E712
    return list(session.exec(statement).all())
