from typing import Literal

from pydantic import BaseModel


LeaderboardScope = Literal["team", "global"]


class SalesAdvisorLeaderboardEntry(BaseModel):
    position: int
    first_name: str
    last_name: str
    points: int
    rank: str


class SalesAdvisorLeaderboardResponse(BaseModel):
    leaderboard_list: list[SalesAdvisorLeaderboardEntry]
    current_user_position: int | None
    current_user: SalesAdvisorLeaderboardEntry | None
