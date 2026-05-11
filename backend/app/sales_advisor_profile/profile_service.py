from datetime import datetime

from fastapi import HTTPException
from sqlmodel import Session

from app.models.app_user import AppUser
from app.models.user_skill import UserSkill
from app.sales_advisor_dashboard.overview_repository import (
    get_sales_advisor_team_members,
)
from app.sales_advisor_dashboard.overview_service import (
    build_rank_progress,
    build_team_comparison,
    ensure_current_user_in_team,
    validate_sales_advisor,
)
from app.sales_advisor_dashboard.overview_schemas import (
    RankProgressResponse,
    TeamComparisonResponse,
)
from app.sales_advisor_profile.profile_repository import (
    get_sales_advisor_performance_metrics,
    get_sales_advisor_profile_row,
    get_sales_advisor_skills,
)
from app.sales_advisor_profile.profile_schemas import (
    PerformanceStatus,
    SalesAdvisorPerformanceSummary,
    SalesAdvisorProfileDealership,
    SalesAdvisorProfileDepartment,
    SalesAdvisorProfileDetails,
    SalesAdvisorProfileManager,
    SalesAdvisorProfileResponse,
    SalesAdvisorSkill,
    SalesAdvisorTeamDetails,
)


PROGRESSING_WELL_PROGRESS_THRESHOLD = 70.0
STABLE_PROGRESS_MIN_THRESHOLD = 35.0
STABLE_TEAM_RATIO_MIN_THRESHOLD = 0.8
STABLE_TEAM_RATIO_MAX_THRESHOLD = 1.0


def build_department_details(
    department_id: int | None,
    department_name: str | None,
) -> SalesAdvisorProfileDepartment | None:
    if department_id is None or department_name is None:
        return None

    return SalesAdvisorProfileDepartment(
        department_id=department_id,
        name=department_name,
    )


def build_dealership_details(
    dealership_id: int | None,
    dealership_name: str | None,
    dealer_code: str | None,
    city: str | None,
    country: str | None,
    region: str | None,
) -> SalesAdvisorProfileDealership | None:
    if dealership_id is None or dealership_name is None:
        return None

    return SalesAdvisorProfileDealership(
        dealership_id=dealership_id,
        name=dealership_name,
        dealer_code=dealer_code or "",
        city=city or "",
        country=country or "",
        region=region or "",
    )


def build_manager_details(
    manager_user_id: int | None,
    manager_first_name: str | None,
    manager_last_name: str | None,
    manager_email: str | None,
) -> SalesAdvisorProfileManager | None:
    if manager_user_id is None:
        return None

    return SalesAdvisorProfileManager(
        user_id=manager_user_id,
        first_name=manager_first_name or "",
        last_name=manager_last_name or "",
        email=manager_email or "",
    )


def calculate_team_points_ratio(
    current_points: int,
    team_average_points: float | None,
) -> float | None:
    if team_average_points is None or team_average_points <= 0:
        return None

    return round(current_points / team_average_points, 2)


def format_metric_number(value: float) -> str:
    rounded_value = round(float(value), 2)

    if rounded_value.is_integer():
        return str(int(rounded_value))

    return f"{rounded_value:.2f}"


def build_team_average_status_reason(
    current_points: int,
    team_average_points: float | None,
) -> str:
    if team_average_points is None:
        return (
            f"The advisor has {format_metric_number(current_points)} points. "
            "Team average is not available."
        )

    if team_average_points <= 0:
        return (
            f"The team average is {format_metric_number(team_average_points)} "
            f"points. The advisor has {format_metric_number(current_points)} points."
        )

    difference_percentage = (
        (current_points - team_average_points) / team_average_points
    ) * 100

    if difference_percentage > 0:
        comparison_text = (
            f"{format_metric_number(abs(difference_percentage))}% above "
            "the team average"
        )
    elif difference_percentage < 0:
        comparison_text = (
            f"{format_metric_number(abs(difference_percentage))}% below "
            "the team average"
        )
    else:
        comparison_text = "at the team average"

    return (
        f"The team average is {format_metric_number(team_average_points)} "
        f"points. The advisor has {format_metric_number(current_points)} points, "
        f"{comparison_text}."
    )


def build_team_position_status_reason(
    team_position: int | None,
    total_sales_advisors: int | None,
) -> str | None:
    if team_position is None or total_sales_advisors is None:
        return None

    if total_sales_advisors <= 1:
        return "The advisor is the only sales advisor on the team."

    advisors_behind = max(total_sales_advisors - team_position, 0)
    outperforming_percentage = (advisors_behind / (total_sales_advisors - 1)) * 100

    return (
        f"The advisor is ranked {team_position} out of {total_sales_advisors} "
        f"and is ahead of {format_metric_number(outperforming_percentage)}% "
        "of the other advisors on the team."
    )


def build_rank_progress_status_reason(
    progress_percentage: float,
    is_highest_rank: bool,
) -> str:
    if is_highest_rank:
        return "The advisor is already at the highest rank."

    return (
        "Progress toward the next rank is "
        f"{format_metric_number(progress_percentage)}%."
    )


def build_performance_status_reason(
    current_points: int,
    progress_percentage: float,
    is_highest_rank: bool,
    team_average_points: float | None,
    team_position: int | None,
    total_sales_advisors: int | None,
) -> str:
    reason_parts = [
        build_team_average_status_reason(
            current_points=current_points,
            team_average_points=team_average_points,
        ),
        build_team_position_status_reason(
            team_position=team_position,
            total_sales_advisors=total_sales_advisors,
        ),
        build_rank_progress_status_reason(
            progress_percentage=progress_percentage,
            is_highest_rank=is_highest_rank,
        ),
    ]

    return " ".join(reason_part for reason_part in reason_parts if reason_part)


def determine_performance_status(
    current_points: int,
    progress_percentage: float,
    team_average_points: float | None,
    is_highest_rank: bool,
    team_position: int | None,
    total_sales_advisors: int | None,
) -> tuple[PerformanceStatus, str]:
    status_reason = build_performance_status_reason(
        current_points=current_points,
        progress_percentage=progress_percentage,
        is_highest_rank=is_highest_rank,
        team_average_points=team_average_points,
        team_position=team_position,
        total_sales_advisors=total_sales_advisors,
    )

    if team_average_points is not None and current_points > team_average_points:
        return (
            "progressing_well",
            status_reason,
        )

    if progress_percentage >= PROGRESSING_WELL_PROGRESS_THRESHOLD:
        return (
            "progressing_well",
            status_reason,
        )

    team_points_ratio = calculate_team_points_ratio(
        current_points=current_points,
        team_average_points=team_average_points,
    )

    if (
        team_points_ratio is not None
        and STABLE_TEAM_RATIO_MIN_THRESHOLD
        <= team_points_ratio
        <= STABLE_TEAM_RATIO_MAX_THRESHOLD
    ):
        return (
            "stable",
            status_reason,
        )

    if (
        STABLE_PROGRESS_MIN_THRESHOLD
        <= progress_percentage
        < PROGRESSING_WELL_PROGRESS_THRESHOLD
    ):
        return (
            "stable",
            status_reason,
        )

    return (
        "needs_attention",
        status_reason,
    )


def build_profile_details(
    advisor: AppUser,
    department: SalesAdvisorProfileDepartment | None,
    dealership: SalesAdvisorProfileDealership | None,
    current_rank: str,
) -> SalesAdvisorProfileDetails:
    if advisor.user_id is None:
        raise HTTPException(status_code=401, detail="Invalid authenticated user")

    return SalesAdvisorProfileDetails(
        user_id=advisor.user_id,
        first_name=advisor.first_name,
        last_name=advisor.last_name,
        email=advisor.email,
        phone=advisor.phone,
        employee_number=advisor.employee_number,
        role=advisor.role,
        status=advisor.status,
        hire_date=advisor.hire_date,
        points=advisor.points or 0,
        rank=current_rank,
        credit=advisor.credit,
        department=department,
        dealership=dealership,
    )


def build_team_details(
    manager: SalesAdvisorProfileManager | None,
    team_comparison: TeamComparisonResponse | None,
) -> SalesAdvisorTeamDetails | None:
    if team_comparison is None:
        return None

    return SalesAdvisorTeamDetails(
        manager=manager,
        team_position=team_comparison.team_position,
        total_sales_advisors=team_comparison.total_sales_advisors,
        team_average_points=team_comparison.team_average_points,
        comparison_to_team_average=team_comparison.comparison_to_team_average,
        points_difference_from_average=team_comparison.points_difference_from_average,
    )


def build_skill_response(skill: UserSkill) -> SalesAdvisorSkill:
    return SalesAdvisorSkill(
        skill_id=skill.user_skill_id,
        name=skill.skill_name,
        level=skill.skill_level,
        verified=skill.verified,
        updated_at=skill.updated_at,
    )


def build_performance_summary(
    rank_progress: RankProgressResponse,
    team_comparison: TeamComparisonResponse | None,
    total_transactions: int,
    total_sales_amount: float,
    total_points_earned: int,
    total_products_sold: int,
    last_transaction_date: datetime | None,
) -> SalesAdvisorPerformanceSummary:
    current_points = rank_progress.current_points
    team_average_points = (
        team_comparison.team_average_points if team_comparison is not None else None
    )
    performance_status, status_reason = determine_performance_status(
        current_points=current_points,
        progress_percentage=rank_progress.progress_percentage,
        team_average_points=team_average_points,
        is_highest_rank=rank_progress.is_highest_rank,
        team_position=(
            team_comparison.team_position if team_comparison is not None else None
        ),
        total_sales_advisors=(
            team_comparison.total_sales_advisors if team_comparison is not None else None
        ),
    )

    return SalesAdvisorPerformanceSummary(
        performance_status=performance_status,
        status_reason=status_reason,
        current_points=current_points,
        current_rank=rank_progress.current_rank,
        next_rank=rank_progress.next_rank,
        points_to_next_rank=rank_progress.points_to_next_rank,
        progress_percentage=rank_progress.progress_percentage,
        is_highest_rank=rank_progress.is_highest_rank,
        team_average_points=team_average_points,
        team_points_ratio=calculate_team_points_ratio(
            current_points=current_points,
            team_average_points=team_average_points,
        ),
        comparison_to_team_average=(
            team_comparison.comparison_to_team_average
            if team_comparison is not None
            else None
        ),
        team_position=(
            team_comparison.team_position if team_comparison is not None else None
        ),
        total_sales_advisors=(
            team_comparison.total_sales_advisors if team_comparison is not None else None
        ),
        total_transactions=total_transactions,
        total_sales_amount=total_sales_amount,
        total_points_earned=total_points_earned,
        total_products_sold=total_products_sold,
        last_transaction_date=last_transaction_date,
    )


def get_sales_advisor_profile(
    session: Session,
    current_user: AppUser,
) -> SalesAdvisorProfileResponse:
    validate_sales_advisor(current_user)

    if current_user.user_id is None:
        raise HTTPException(status_code=401, detail="Invalid authenticated user")

    profile_row = get_sales_advisor_profile_row(
        session=session,
        user_id=current_user.user_id,
    )

    if profile_row is None:
        raise HTTPException(status_code=404, detail="Sales advisor profile not found")

    (
        advisor,
        department_id,
        department_name,
        dealership_id,
        dealership_name,
        dealer_code,
        city,
        country,
        region,
        manager_user_id,
        manager_first_name,
        manager_last_name,
        manager_email,
    ) = profile_row

    if advisor.user_id is None:
        raise HTTPException(status_code=401, detail="Invalid authenticated user")

    current_points = advisor.points or 0
    rank_progress = build_rank_progress(current_points)

    team_comparison = None
    if advisor.manager_user_id is not None:
        team_members = get_sales_advisor_team_members(
            session=session,
            manager_user_id=advisor.manager_user_id,
        )
        team_members = ensure_current_user_in_team(advisor, team_members)
        team_comparison = build_team_comparison(advisor, team_members)

    (
        total_transactions,
        total_sales_amount,
        total_points_earned,
        total_products_sold,
        last_transaction_date,
    ) = get_sales_advisor_performance_metrics(
        session=session,
        user_id=advisor.user_id,
    )

    department = build_department_details(
        department_id=department_id,
        department_name=department_name,
    )
    dealership = build_dealership_details(
        dealership_id=dealership_id,
        dealership_name=dealership_name,
        dealer_code=dealer_code,
        city=city,
        country=country,
        region=region,
    )
    manager = build_manager_details(
        manager_user_id=manager_user_id,
        manager_first_name=manager_first_name,
        manager_last_name=manager_last_name,
        manager_email=manager_email,
    )

    skills = get_sales_advisor_skills(
        session=session,
        user_id=advisor.user_id,
    )

    return SalesAdvisorProfileResponse(
        profile_details=build_profile_details(
            advisor=advisor,
            department=department,
            dealership=dealership,
            current_rank=rank_progress.current_rank,
        ),
        performance_summary=build_performance_summary(
            rank_progress=rank_progress,
            team_comparison=team_comparison,
            total_transactions=total_transactions,
            total_sales_amount=total_sales_amount,
            total_points_earned=total_points_earned,
            total_products_sold=total_products_sold,
            last_transaction_date=last_transaction_date,
        ),
        skills=[build_skill_response(skill) for skill in skills],
        team_details=build_team_details(
            manager=manager,
            team_comparison=team_comparison,
        ),
    )
