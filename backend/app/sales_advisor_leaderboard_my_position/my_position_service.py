from sqlmodel import Session

from app.models.app_user import AppUser
from app.sales_advisor_dashboard.overview_service import validate_sales_advisor
from app.sales_advisor_leaderboard.leaderboard_service import (
    ensure_current_user_in_leaderboard,
    normalize_leaderboard_scope,
    sort_advisors_for_ranking,
)
from app.sales_advisor_leaderboard_my_position.my_position_repository import (
    get_global_sales_advisors_for_position,
    get_team_sales_advisors_for_position,
)
from app.sales_advisor_leaderboard_my_position.my_position_schemas import (
    SalesAdvisorLeaderboardMyPositionResponse,
)


def get_sales_advisor_leaderboard_my_position(
    session: Session,
    current_user: AppUser,
    scope: str,
) -> SalesAdvisorLeaderboardMyPositionResponse:
    validate_sales_advisor(current_user)
    normalized_scope = normalize_leaderboard_scope(scope)

    if normalized_scope == "global":
        advisors = get_global_sales_advisors_for_position(session=session)
    else:
        advisors = get_team_sales_advisors_for_position(
            session=session,
            manager_user_id=current_user.manager_user_id,
        )

    advisors = ensure_current_user_in_leaderboard(current_user, advisors)
    ranked_advisors = sort_advisors_for_ranking(advisors)

    position_by_user_id = {
        advisor.user_id: position
        for position, advisor in enumerate(ranked_advisors, start=1)
    }

    return SalesAdvisorLeaderboardMyPositionResponse(
        position=position_by_user_id[current_user.user_id],
        total_users=len(ranked_advisors),
        points=current_user.points or 0,
        rank=current_user.rank,
    )
