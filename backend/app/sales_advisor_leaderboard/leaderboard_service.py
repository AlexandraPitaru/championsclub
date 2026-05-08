from fastapi import HTTPException
from sqlmodel import Session

from app.models.app_user import AppUser
from app.sales_advisor_dashboard.overview_service import validate_sales_advisor
from app.sales_advisor_leaderboard.leaderboard_repository import (
    get_global_sales_advisors,
    get_team_sales_advisors,
)
from app.sales_advisor_leaderboard.leaderboard_schemas import (
    LeaderboardScope,
    SalesAdvisorLeaderboardEntry,
    SalesAdvisorLeaderboardResponse,
)


VALID_LEADERBOARD_SCOPES: set[LeaderboardScope] = {"team", "global"}
MIN_LEADERBOARD_LIMIT = 1


def ensure_current_user_in_leaderboard(
    current_user: AppUser,
    advisors: list[AppUser],
) -> list[AppUser]:
    if any(advisor.user_id == current_user.user_id for advisor in advisors):
        return advisors

    return [*advisors, current_user]


def sort_advisors_for_ranking(advisors: list[AppUser]) -> list[AppUser]:
    return sorted(
        advisors,
        key=lambda advisor: (
            -(advisor.points or 0),
            (advisor.last_name or "").lower(),
            (advisor.first_name or "").lower(),
            advisor.user_id or 0,
        ),
    )


def build_leaderboard_entry(
    advisor: AppUser,
    position: int,
) -> SalesAdvisorLeaderboardEntry:
    return SalesAdvisorLeaderboardEntry(
        position=position,
        first_name=advisor.first_name,
        last_name=advisor.last_name,
        points=advisor.points or 0,
        rank=advisor.rank,
    )


def normalize_leaderboard_scope(scope: str) -> LeaderboardScope:
    normalized_scope = scope.strip().lower()

    if normalized_scope not in VALID_LEADERBOARD_SCOPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid scope. Use team or global.",
        )

    return normalized_scope


def normalize_leaderboard_limit(limit: str | int) -> int:
    try:
        normalized_limit = int(limit)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="Invalid limit. Use a positive integer.",
        )

    if str(limit).strip() != str(normalized_limit):
        raise HTTPException(
            status_code=400,
            detail="Invalid limit. Use a positive integer.",
        )

    if normalized_limit < MIN_LEADERBOARD_LIMIT:
        raise HTTPException(
            status_code=400,
            detail="Invalid limit. Limit must be greater than 0.",
        )

    return normalized_limit


def get_sales_advisor_leaderboard(
    session: Session,
    current_user: AppUser,
    scope: str,
    limit: str | int,
) -> SalesAdvisorLeaderboardResponse:
    validate_sales_advisor(current_user)
    normalized_scope = normalize_leaderboard_scope(scope)
    normalized_limit = normalize_leaderboard_limit(limit)

    if normalized_scope == "global":
        advisors = get_global_sales_advisors(session=session)
    else:
        advisors = get_team_sales_advisors(
            session=session,
            manager_user_id=current_user.manager_user_id,
        )

    advisors = ensure_current_user_in_leaderboard(current_user, advisors)
    ranked_advisors = sort_advisors_for_ranking(advisors)

    position_by_user_id = {
        advisor.user_id: position
        for position, advisor in enumerate(ranked_advisors, start=1)
    }
    top_advisors = ranked_advisors[:normalized_limit]
    leaderboard_list = [
        build_leaderboard_entry(
            advisor=advisor,
            position=position_by_user_id[advisor.user_id],
        )
        for advisor in top_advisors
    ]

    current_user_position = position_by_user_id.get(current_user.user_id)
    current_user_entry = None

    if current_user_position is not None and not any(
        advisor.user_id == current_user.user_id for advisor in top_advisors
    ):
        current_user_entry = build_leaderboard_entry(
            advisor=current_user,
            position=current_user_position,
        )

    return SalesAdvisorLeaderboardResponse(
        leaderboard_list=leaderboard_list,
        current_user_position=current_user_position,
        current_user=current_user_entry,
    )
