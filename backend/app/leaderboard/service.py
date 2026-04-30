from datetime import datetime, timedelta, timezone
from math import ceil

from fastapi import HTTPException
from sqlmodel import Session

from app.models.app_user import AppUser
from app.leaderboard.repository import (
    get_leaderboard_rows_for_manager,
    get_manager_points_aggregate_for_window,
)
from app.leaderboard.schemas import (
    LeaderboardItemResponse,
    LeaderboardPaginationResponse,
    LeaderboardResponse,
    LeaderboardSummaryCompareResponse,
    LeaderboardSummaryResponse,
    LeaderboardSummaryTopAdvisorResponse,
)
from app.manager_statistics.service import get_interval_start_date


def validate_manager(current_user: AppUser) -> None:
    if current_user.role.upper() != "MANAGER":
        raise HTTPException(
            status_code=403,
            detail="Access denied: Manager role required",
        )


def build_avatar_initials(first_name: str, last_name: str) -> str:
    return f"{first_name[:1]}{last_name[:1]}".upper()


def get_medal(position: int) -> str | None:
    if position == 1:
        return "gold"
    if position == 2:
        return "silver"
    if position == 3:
        return "bronze"
    return None


def get_sort_value(row, sort_by: str):
    if sort_by == "first_name":
        return (row.first_name or "").lower()
    if sort_by == "last_name":
        return (row.last_name or "").lower()
    if sort_by == "email":
        return (row.email or "").lower()
    if sort_by == "position":
        return row.points
    return row.points


def get_manager_leaderboard(
    session: Session,
    current_user: AppUser,
    interval: str,
    q: str | None,
    sort_by: str,
    sort_dir: str,
    page: int,
    page_size: int,
) -> LeaderboardResponse:
    validate_manager(current_user)

    interval_start = get_interval_start_date(interval)

    rows = get_leaderboard_rows_for_manager(
        session=session,
        manager_user_id=current_user.user_id,
        interval_start=interval_start,
        q=q,
    )

    # Assign positions always based on points descending (stable tiebreak by name)
    rows_by_points = sorted(
        rows,
        key=lambda row: (
            -row.points,
            row.last_name.lower(),
            row.first_name.lower(),
            row.user_id,
        ),
    )
    position_map = {row.user_id: idx for idx, row in enumerate(rows_by_points, start=1)}

    max_points = max((row.points for row in rows), default=0)

    enriched_map: dict[int, LeaderboardItemResponse] = {}
    for row in rows:
        position = position_map[row.user_id]
        performance_pct = round((row.points / max_points) * 100) if max_points > 0 else 0
        enriched_map[row.user_id] = LeaderboardItemResponse(
            user_id=row.user_id,
            first_name=row.first_name,
            last_name=row.last_name,
            email=row.email,
            role=row.role,
            status=row.status.capitalize(),
            tier=row.rank,
            points=row.points,
            position=position,
            performance_pct=performance_pct,
            avatar_initials=build_avatar_initials(row.first_name, row.last_name),
            medal=get_medal(position),
        )

    # Sort for display
    reverse = sort_dir == "desc"

    if sort_by == "position":
        enriched_rows = sorted(
            enriched_map.values(),
            key=lambda item: item.position,
            reverse=not reverse,
        )
    else:
        enriched_rows = sorted(
            enriched_map.values(),
            key=lambda item: (
                get_sort_value(item, sort_by),
                item.last_name.lower(),
                item.first_name.lower(),
                item.user_id,
            ),
            reverse=reverse,
        )
    enriched_rows = list(enriched_rows)

    total_items = len(enriched_rows)
    total_pages = ceil(total_items / page_size) if total_items > 0 else 1

    start_index = (page - 1) * page_size
    end_index = start_index + page_size
    paginated_items = enriched_rows[start_index:end_index]

    top_advisor = enriched_rows[0] if enriched_rows else None
    total_points = sum(item.points for item in enriched_rows)
    average_points = total_points / total_items if total_items > 0 else 0

    return LeaderboardResponse(
        items=paginated_items,
        pagination=LeaderboardPaginationResponse(
            total_items=total_items,
            total_pages=total_pages,
            page=page,
            page_size=page_size,
        ),
        summary=LeaderboardSummaryResponse(
            top_advisor=(
                LeaderboardSummaryTopAdvisorResponse(
                    user_id=top_advisor.user_id,
                    full_name=f"{top_advisor.first_name} {top_advisor.last_name}",
                    points=top_advisor.points,
                )
                if top_advisor
                else None
            ),
            total_advisors=total_items,
            average_points=round(average_points, 2),
            total_points=total_points,
        ),
    )


def _get_interval_windows(
    interval: str,
) -> tuple[datetime | None, datetime | None, datetime | None, datetime | None, str]:
    now = datetime.now(timezone.utc)

    if interval == "day":
        current_start = now - timedelta(days=1)
        current_end = now
        previous_start = now - timedelta(days=2)
        previous_end = now - timedelta(days=1)
        return current_start, current_end, previous_start, previous_end, "vs last day"

    if interval == "week":
        current_start = now - timedelta(weeks=1)
        current_end = now
        previous_start = now - timedelta(weeks=2)
        previous_end = now - timedelta(weeks=1)
        return current_start, current_end, previous_start, previous_end, "vs last week"

    if interval == "month":
        current_start = now - timedelta(days=30)
        current_end = now
        previous_start = now - timedelta(days=60)
        previous_end = now - timedelta(days=30)
        return current_start, current_end, previous_start, previous_end, "vs last month"

    return None, None, None, None, ""


def _delta_pct(current: float, previous: float) -> float | None:
    if previous == 0:
        if current == 0:
            return 0.0
        return None
    return round(((current - previous) / previous) * 100, 1)


def get_manager_leaderboard_summary(
    session: Session,
    current_user: AppUser,
    interval: str,
) -> LeaderboardSummaryCompareResponse:
    validate_manager(current_user)

    current_start, current_end, previous_start, previous_end, label = _get_interval_windows(interval)

    total_current, avg_current = get_manager_points_aggregate_for_window(
        session, current_user.user_id, current_start, current_end
    )
    total_previous, avg_previous = get_manager_points_aggregate_for_window(
        session, current_user.user_id, previous_start, previous_end
    )

    avg_delta = _delta_pct(avg_current, avg_previous) if interval != "all" else None
    total_delta = _delta_pct(float(total_current), float(total_previous)) if interval != "all" else None

    rows = get_leaderboard_rows_for_manager(
        session=session,
        manager_user_id=current_user.user_id,
        interval_start=current_start,
        q=None,
    )
    rows = sorted(rows, key=lambda r: r.points, reverse=True)

    top_advisor = None
    if rows:
        top_advisor = LeaderboardSummaryTopAdvisorResponse(
            user_id=rows[0].user_id,
            full_name=f"{rows[0].first_name} {rows[0].last_name}",
            points=rows[0].points,
        )

    return LeaderboardSummaryCompareResponse(
        interval=interval,
        comparison_label=label if interval != "all" else "",
        top_advisor=top_advisor,
        total_advisors=len(rows),
        average_points_current=round(avg_current, 2),
        average_points_previous=round(avg_previous, 2),
        average_points_delta_pct=avg_delta,
        total_points_current=total_current,
        total_points_previous=total_previous,
        total_points_delta_pct=total_delta,
    )