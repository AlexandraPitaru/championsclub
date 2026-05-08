from fastapi import HTTPException
from sqlmodel import Session

from app.models.app_user import AppUser
from app.sales_advisor_dashboard.overview_repository import (
    get_sales_advisor_team_members,
)
from app.sales_advisor_dashboard.overview_schemas import (
    DashboardSummaryResponse,
    PointsComparisonChartPoint,
    RankProgressChartData,
    RankProgressResponse,
    SalesAdvisorDashboardOverviewResponse,
    SalesAdvisorOverviewChartData,
    TeamAverageComparison,
    TeamComparisonResponse,
    TeamPositionChartData,
)


RANK_THRESHOLDS: tuple[tuple[str, int], ...] = (
    ("Default", 0),
    ("Bronze", 500),
    ("Silver", 1000),
    ("Gold", 2000),
)


def validate_sales_advisor(current_user: AppUser) -> None:
    if current_user.role.lower() != "sales_advisor":
        raise HTTPException(
            status_code=403,
            detail="Access denied: Sales advisor role required",
        )


def get_current_rank_for_points(points: int) -> tuple[str, int]:
    current_rank = RANK_THRESHOLDS[0]

    for rank in RANK_THRESHOLDS:
        if points >= rank[1]:
            current_rank = rank
        else:
            break

    return current_rank


def get_next_rank_for_points(points: int) -> tuple[str, int] | None:
    for rank in RANK_THRESHOLDS:
        if points < rank[1]:
            return rank

    return None


def build_rank_progress(points: int) -> RankProgressResponse:
    current_rank, current_rank_min_points = get_current_rank_for_points(points)
    next_rank = get_next_rank_for_points(points)

    if next_rank is None:
        return RankProgressResponse(
            current_rank=current_rank,
            current_rank_min_points=current_rank_min_points,
            next_rank=None,
            next_rank_min_points=None,
            current_points=points,
            points_to_next_rank=None,
            progress_percentage=100.0,
            is_highest_rank=True,
        )

    next_rank_name, next_rank_min_points = next_rank
    rank_span = next_rank_min_points - current_rank_min_points
    points_in_rank = max(points - current_rank_min_points, 0)
    progress_percentage = round((points_in_rank / rank_span) * 100, 2)

    return RankProgressResponse(
        current_rank=current_rank,
        current_rank_min_points=current_rank_min_points,
        next_rank=next_rank_name,
        next_rank_min_points=next_rank_min_points,
        current_points=points,
        points_to_next_rank=max(next_rank_min_points - points, 0),
        progress_percentage=min(progress_percentage, 100.0),
        is_highest_rank=False,
    )


def compare_to_team_average(points: int, team_average: float) -> TeamAverageComparison:
    if points > team_average:
        return "above"
    if points < team_average:
        return "below"
    return "equal"


def ensure_current_user_in_team(
    current_user: AppUser,
    team_members: list[AppUser],
) -> list[AppUser]:
    if any(member.user_id == current_user.user_id for member in team_members):
        return team_members

    return [*team_members, current_user]


def get_team_position(current_user: AppUser, team_members: list[AppUser]) -> int:
    sorted_members = sorted(
        team_members,
        key=lambda member: (
            -(member.points or 0),
            (member.last_name or "").lower(),
            (member.first_name or "").lower(),
            member.user_id or 0,
        ),
    )

    for index, member in enumerate(sorted_members, start=1):
        if member.user_id == current_user.user_id:
            return index

    return len(sorted_members)


def build_team_comparison(
    current_user: AppUser,
    team_members: list[AppUser],
) -> TeamComparisonResponse:
    current_points = current_user.points or 0
    total_sales_advisors = len(team_members)
    total_points = sum(member.points or 0 for member in team_members)
    team_average = total_points / total_sales_advisors if total_sales_advisors else 0
    team_position = get_team_position(current_user, team_members)

    return TeamComparisonResponse(
        team_average_points=round(team_average, 2),
        comparison_to_team_average=compare_to_team_average(current_points, team_average),
        points_difference_from_average=round(current_points - team_average, 2),
        team_position=team_position,
        total_sales_advisors=total_sales_advisors,
    )


def build_rank_progress_chart(
    rank_progress: RankProgressResponse,
) -> RankProgressChartData:
    label = (
        f"{rank_progress.current_rank} to {rank_progress.next_rank}"
        if rank_progress.next_rank is not None
        else "Highest rank"
    )

    return RankProgressChartData(
        label=label,
        current_points=rank_progress.current_points,
        start_points=rank_progress.current_rank_min_points,
        target_points=rank_progress.next_rank_min_points,
        progress_percentage=rank_progress.progress_percentage,
        remaining_points=rank_progress.points_to_next_rank,
    )


def build_chart_data(
    current_points: int,
    rank_progress: RankProgressResponse,
    team_comparison: TeamComparisonResponse | None,
) -> SalesAdvisorOverviewChartData:
    personal_points_vs_team_average = None
    team_position_summary = None

    if team_comparison is not None:
        personal_points_vs_team_average = [
            PointsComparisonChartPoint(label="Personal", points=float(current_points)),
            PointsComparisonChartPoint(
                label="Team average",
                points=team_comparison.team_average_points,
            ),
        ]
        team_position_summary = TeamPositionChartData(
            team_position=team_comparison.team_position,
            total_sales_advisors=team_comparison.total_sales_advisors,
            advisors_ahead=team_comparison.team_position - 1,
            advisors_behind=(
                team_comparison.total_sales_advisors - team_comparison.team_position
            ),
        )

    return SalesAdvisorOverviewChartData(
        personal_points_vs_team_average=personal_points_vs_team_average,
        rank_progress_toward_next_rank=build_rank_progress_chart(rank_progress),
        team_position_summary=team_position_summary,
    )


def get_sales_advisor_dashboard_overview(
    session: Session,
    current_user: AppUser,
) -> SalesAdvisorDashboardOverviewResponse:
    validate_sales_advisor(current_user)

    current_points = current_user.points or 0
    rank_progress = build_rank_progress(current_points)

    team_comparison = None
    if current_user.manager_user_id is not None:
        team_members = get_sales_advisor_team_members(
            session=session,
            manager_user_id=current_user.manager_user_id,
        )
        team_members = ensure_current_user_in_team(current_user, team_members)
        team_comparison = build_team_comparison(current_user, team_members)

    return SalesAdvisorDashboardOverviewResponse(
        dashboard_summary=DashboardSummaryResponse(
            user_id=current_user.user_id,
            current_points=current_points,
            current_rank=rank_progress.current_rank,
            next_rank=rank_progress.next_rank,
            points_to_next_rank=rank_progress.points_to_next_rank,
            is_highest_rank=rank_progress.is_highest_rank,
            advisor_name=f"{current_user.first_name} {current_user.last_name}",
        ),
        rank_progress=rank_progress,
        team_comparison=team_comparison,
        chart_data=build_chart_data(
            current_points=current_points,
            rank_progress=rank_progress,
            team_comparison=team_comparison,
        ),
    )
