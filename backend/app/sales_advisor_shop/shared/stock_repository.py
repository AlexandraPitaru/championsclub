from sqlmodel import Session

from app.models.reward_catalog import RewardCatalog


def get_stock_quantity(session: Session, reward: RewardCatalog) -> int:
    session.refresh(reward)
    return int(reward.stock_quantity or 0)


def decrement_inventory(session: Session, reward: RewardCatalog, quantity: int) -> RewardCatalog:
    session.refresh(reward)
    if quantity <= 0:
        return reward
    current = int(reward.stock_quantity or 0)
    if current < quantity:
        raise ValueError("Insufficient stock")
    reward.stock_quantity = current - quantity
    session.add(reward)
    session.flush()
    return reward
