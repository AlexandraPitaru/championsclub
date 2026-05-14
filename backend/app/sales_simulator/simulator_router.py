from fastapi import APIRouter, Depends, Header, HTTPException
from sqlmodel import Session

from app.database import get_session
from app.models.app_user import AppUser
from app.sales_simulator.simulator_config import (
    SalesSimulatorSettings,
    load_sales_simulator_settings,
)
from app.sales_simulator.simulator_schemas import (
    SalesSimulationProductResponse,
    SalesSimulationRunRequest,
    SalesSimulationRunResponse,
    SalesSimulationSaleResponse,
    SalesSimulatorConfigurationResponse,
)
from app.sales_simulator.simulator_service import (
    SalesSimulatorError,
    SimulatedSale,
    simulate_sales_batch,
)

router = APIRouter(prefix="/api/sales-simulator", tags=["sales-simulator"])


def get_current_manager(
    x_user_id: int | None = Header(default=None),
    session: Session = Depends(get_session),
) -> AppUser:
    if x_user_id is None:
        raise HTTPException(status_code=401, detail="Authentication required")

    user = session.get(AppUser, x_user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid user ID")

    if user.role.upper() != "MANAGER":
        raise HTTPException(status_code=403, detail="Manager role required")

    return user


def _to_sale_response(sale: SimulatedSale) -> SalesSimulationSaleResponse:
    return SalesSimulationSaleResponse(
        transaction_id=sale.transaction_id,
        advisor_id=sale.advisor_id,
        advisor_name=sale.advisor_name,
        manager_id=sale.manager_id,
        amount=sale.amount,
        points_earned=sale.points_earned,
        credit_earned=sale.credit_earned,
        points_before=sale.points_before,
        points_after=sale.points_after,
        credit_before=sale.credit_before,
        credit_after=sale.credit_after,
        rank_before=sale.rank_before,
        rank_after=sale.rank_after,
        products=[
            SalesSimulationProductResponse(
                product_id=product.product_id,
                name=product.name,
                item_type=product.item_type,
                price=product.price,
                points_value=product.points_value,
                quantity=product.quantity,
            )
            for product in sale.products
        ],
    )


@router.get(
    "/configuration",
    response_model=SalesSimulatorConfigurationResponse,
)
def read_sales_simulator_configuration():
    settings = load_sales_simulator_settings()
    return SalesSimulatorConfigurationResponse(**settings.__dict__)


@router.post("/run-once", response_model=SalesSimulationRunResponse)
def run_sales_simulation_once(
    payload: SalesSimulationRunRequest | None = None,
    session: Session = Depends(get_session),
    current_manager: AppUser = Depends(get_current_manager),
):
    base_settings = load_sales_simulator_settings()
    requested_advisor_id = payload.advisor_id if payload else None
    requested_batch_size = (
        payload.batch_size
        if payload and payload.batch_size
        else base_settings.batch_size
    )
    max_products_per_sale = (
        payload.max_products_per_sale
        if payload and payload.max_products_per_sale
        else base_settings.max_products_per_sale
    )

    settings = SalesSimulatorSettings(
        enabled=True,
        interval_seconds=base_settings.interval_seconds,
        manager_id=current_manager.user_id,
        advisor_id=requested_advisor_id,
        batch_size=requested_batch_size,
        max_products_per_sale=max_products_per_sale,
        points_multiplier=base_settings.points_multiplier,
        credit_rate=base_settings.credit_rate,
    )

    try:
        sales = simulate_sales_batch(session=session, settings=settings)
        session.commit()
    except SalesSimulatorError as exc:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(exc))

    return SalesSimulationRunResponse(
        manager_id=current_manager.user_id or 0,
        requested_advisor_id=requested_advisor_id,
        requested_batch_size=requested_batch_size,
        sales_created=len(sales),
        sales=[_to_sale_response(sale) for sale in sales],
    )
