from pydantic import BaseModel


class SalesAdvisorLeaderboardMyPositionResponse(BaseModel):
    position: int
    total_users: int
    points: int
    rank: str
