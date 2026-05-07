from sqlmodel import Session

from app.models.app_user import AppUser
from app.sales_advisor_dashboard.overview_service import (
    build_rank_progress,
    build_team_comparison,
    ensure_current_user_in_team,
    validate_sales_advisor,
)
from app.sales_advisor_performance_charts.performance_charts_repository import (
    get_completed_sales_transactions_for_advisor,
    get_sales_advisor_team_members,
)
from app.sales_advisor_performance_charts.performance_charts_schemas import (
    PersonalPerformanceChartPoint,
    PersonalPerformanceChartSection,
    PersonalVsTeamAverageChartSection,
    PointsComparisonChartPoint,
    RankProgressChartPoint,
    RankProgressChartSection,
    SalesAdvisorPerformanceChartsResponse,
    TeamPositionChartPoint,
    TeamPositionChartSection,
)


NO_PERSONAL_PERFORMANCE_DATA = (
    "Not enough completed sales data is available for the personal performance chart."
)
TEAM_DATA_UNAVAILABLE = "Team data unavailable: advisor is not assigned to a manager."


def build_personal_performance_chart(
    transactions,
) -> PersonalPerformanceChartSection:
    if not transactions:
        return PersonalPerformanceChartSection(
            is_available=False,
            unavailable_reason=NO_PERSONAL_PERFORMANCE_DATA,
            labels=[],
            values=[],
            data=[],
        )

    grouped: dict[str, dict[str, float | int]] = {}

    for transaction_date, amount, points_earned in transactions:
        period = transaction_date.date().isoformat()

        if period not in grouped:
            grouped[period] = {
                "sales": 0.0,
                "points": 0,
                "transaction_count": 0,
            }

        grouped[period]["sales"] = float(grouped[period]["sales"]) + float(amount or 0)
        grouped[period]["points"] = int(grouped[period]["points"]) + int(
            points_earned or 0
        )
        grouped[period]["transaction_count"] = int(
            grouped[period]["transaction_count"]
        ) + 1

    data = [
        PersonalPerformanceChartPoint(
            label=period,
            value=float(values["points"]),
            period=period,
            sales=round(float(values["sales"]), 2),
            points=int(values["points"]),
            transaction_count=int(values["transaction_count"]),
        )
        for period, values in grouped.items()
    ]

    return PersonalPerformanceChartSection(
        is_available=True,
        unavailable_reason=None,
        labels=[point.label for point in data],
        values=[point.value for point in data],
        data=data,
    )


def build_personal_vs_team_average_chart(
    current_points: int,
    team_average_points: float | None,
    unavailable_reason: str | None,
) -> PersonalVsTeamAverageChartSection:
    if team_average_points is None:
        return PersonalVsTeamAverageChartSection(
            is_available=False,
            unavailable_reason=unavailable_reason,
            labels=[],
            values=[],
            data=[],
        )

    data = [
        PointsComparisonChartPoint(
            label="Personal",
            value=float(current_points),
        ),
        PointsComparisonChartPoint(
            label="Team average",
            value=round(team_average_points, 2),
        ),
    ]

    return PersonalVsTeamAverageChartSection(
        is_available=True,
        unavailable_reason=None,
        labels=[point.label for point in data],
        values=[point.value for point in data],
        data=data,
    )


def build_rank_progress_chart(current_points: int) -> RankProgressChartSection:
    rank_progress = build_rank_progress(current_points)

    if rank_progress.is_highest_rank:
        data = [
            RankProgressChartPoint(
                label="Progress",
                value=100.0,
            )
        ]
    else:
        remaining_percentage = round(100.0 - rank_progress.progress_percentage, 2)
        data = [
            RankProgressChartPoint(
                label="Progress",
                value=rank_progress.progress_percentage,
            ),
            RankProgressChartPoint(
                label="Remaining",
                value=max(remaining_percentage, 0.0),
            ),
        ]

    return RankProgressChartSection(
        is_available=True,
        unavailable_reason=None,
        labels=[point.label for point in data],
        values=[point.value for point in data],
        data=data,
        current_rank=rank_progress.current_rank,
        next_rank=rank_progress.next_rank,
        current_points=rank_progress.current_points,
        start_points=rank_progress.current_rank_min_points,
        target_points=rank_progress.next_rank_min_points,
        remaining_points=rank_progress.points_to_next_rank,
        progress_percentage=rank_progress.progress_percentage,
        is_highest_rank=rank_progress.is_highest_rank,
    )


def build_team_position_chart(
    team_position: int | None,
    total_sales_advisors: int | None,
    unavailable_reason: str | None,
) -> TeamPositionChartSection:
    if team_position is None or total_sales_advisors is None:
        return TeamPositionChartSection(
            is_available=False,
            unavailable_reason=unavailable_reason,
            labels=[],
            values=[],
            data=[],
            team_position=None,
            total_sales_advisors=None,
            advisors_ahead=None,
            advisors_behind=None,
        )

    advisors_ahead = team_position - 1
    advisors_behind = total_sales_advisors - team_position
    data = [
        TeamPositionChartPoint(
            label="Advisors ahead",
            value=float(advisors_ahead),
        ),
        TeamPositionChartPoint(
            label="Current advisor",
            value=1.0,
        ),
        TeamPositionChartPoint(
            label="Advisors behind",
            value=float(advisors_behind),
        ),
    ]

    return TeamPositionChartSection(
        is_available=True,
        unavailable_reason=None,
        labels=[point.label for point in data],
        values=[point.value for point in data],
        data=data,
        team_position=team_position,
        total_sales_advisors=total_sales_advisors,
        advisors_ahead=advisors_ahead,
        advisors_behind=advisors_behind,
    )


def get_sales_advisor_performance_charts(
    session: Session,
    current_user: AppUser,
) -> SalesAdvisorPerformanceChartsResponse:
    validate_sales_advisor(current_user)

    current_points = current_user.points or 0
    transactions = get_completed_sales_transactions_for_advisor(
        session=session,
        user_id=current_user.user_id,
    )
    personal_performance = build_personal_performance_chart(transactions)

    team_average_points = None
    team_position = None
    total_sales_advisors = None
    team_unavailable_reason = TEAM_DATA_UNAVAILABLE

    if current_user.manager_user_id is not None:
        team_members = get_sales_advisor_team_members(
            session=session,
            manager_user_id=current_user.manager_user_id,
        )
        team_members = ensure_current_user_in_team(current_user, team_members)
        team_comparison = build_team_comparison(current_user, team_members)
        team_average_points = team_comparison.team_average_points
        team_position = team_comparison.team_position
        total_sales_advisors = team_comparison.total_sales_advisors
        team_unavailable_reason = None

    return SalesAdvisorPerformanceChartsResponse(
        user_id=current_user.user_id,
        personal_performance=personal_performance,
        personal_vs_team_average=build_personal_vs_team_average_chart(
            current_points=current_points,
            team_average_points=team_average_points,
            unavailable_reason=team_unavailable_reason,
        ),
        rank_progress=build_rank_progress_chart(current_points),
        team_position=build_team_position_chart(
            team_position=team_position,
            total_sales_advisors=total_sales_advisors,
            unavailable_reason=team_unavailable_reason,
        ),
    )
