from fastapi import HTTPException
from sqlmodel import Session, select, func

from app.models.app_user import AppUser
from app.models.dealership import Dealership
from app.models.sale_transaction import SaleTransaction
from app.models.sale_transaction_item import SaleTransactionItem
from app.manager_statistics.schemas import UserKpiResponse, TeamKpiResponse


def validate_manager(current_user: AppUser):
    if current_user.role.upper() != "MANAGER":
        raise HTTPException(status_code=403, detail="Access denied: Manager role required")


def get_user_kpis(session: Session, current_manager: AppUser, user_id: int) -> UserKpiResponse:
    validate_manager(current_manager)

    target_user = session.get(AppUser, user_id)

    if target_user is None or target_user.manager_user_id != current_manager.user_id:
        raise HTTPException(status_code=404, detail="User not found or not under your management")
    
    sales_result = session.exec(
        select(
            func.count(SaleTransaction.transaction_id),
            func.coalesce(func.sum(SaleTransaction.amount), 0),
            func.coalesce(func.sum(SaleTransaction.points_earned), 0),
            func.max(SaleTransaction.transaction_date),
        ).where(SaleTransaction.user_id == user_id)
    ).one()

    total_trascations = sales_result[0]
    total_sales_amount = sales_result[1]
    total_points_earned = sales_result[2]
    last_transaction_date = sales_result[3]

    total_products_sold = session.exec(
        select(func.coalesce(func.sum(SaleTransactionItem.quantity), 0))
            .join(SaleTransaction,
                  SaleTransaction.transaction_id == SaleTransactionItem.transaction_id)
            .where(SaleTransaction.user_id == user_id)
    ).one()

    return {
        "user_id": target_user.user_id,
        "first_name": target_user.first_name,
        "last_name": target_user.last_name,   
        "email": target_user.email,
        "role": target_user.role,
        "current_rank": target_user.rank,
        "total_points": target_user.points,
        "credit": target_user.credit,
        "status": target_user.status,
        "total_transactions": total_trascations,
        "total_sales_amount": total_sales_amount,
        "total_points_earned": total_points_earned,
        "total_products_sold": total_products_sold,
        "last_transaction_date": last_transaction_date,
    }

def get_team_kpis(session: Session, current_manager: AppUser, dealership_id: int) -> TeamKpiResponse:

    validate_manager(current_manager)

    dealership = session.get(Dealership, dealership_id)

    if dealership is None or dealership.dealership_id != current_manager.dealership_id:
        raise HTTPException(status_code=404, detail="Dealership not found")
    
    total_users = session.exec(
        select(func.count(AppUser.user_id)).where(
            AppUser.manager_user_id == current_manager.user_id,
            AppUser.dealership_id == dealership_id
        )
    ).one()

    active_users = session.exec(
        select(func.count(AppUser.user_id)).where(
            AppUser.manager_user_id == current_manager.user_id,
            AppUser.dealership_id == dealership_id,
            AppUser.status == "active"
        )
    ).one()

    sales_result = session.exec(
        select(
            func.count(SaleTransaction.transaction_id),
            func.coalesce(func.sum(SaleTransaction.amount), 0),
            func.coalesce(func.sum(SaleTransaction.points_earned), 0)
        )
        .join(AppUser, AppUser.user_id == SaleTransaction.user_id)
        .where(
            AppUser.manager_user_id == current_manager.user_id, 
            AppUser.dealership_id == dealership_id,
            )
    ).one()

    total_transactions = sales_result[0]
    total_sales_amount = sales_result[1]
    total_points_earned = sales_result[2]

    total_products_sold = session.exec(
        select(func.coalesce(func.sum(SaleTransactionItem.quantity), 0))
            .join(
                SaleTransaction,
                SaleTransaction.transaction_id == SaleTransactionItem.transaction_id,
                )
            .join(AppUser, AppUser.user_id == SaleTransaction.user_id)
            .where(
                AppUser.manager_user_id == current_manager.user_id, 
                SaleTransaction.dealership_id == dealership_id,
            )
    ).one()

    return {
        "dealership_id": dealership.dealership_id,
        "dealership_name": dealership.name,
        "total_users": total_users,
        "active_users": active_users,
        "total_transactions": sales_result[0],
        "total_sales_amount": total_sales_amount,
        "total_points_earned": total_points_earned,
        "total_products_sold": total_products_sold,
    }
