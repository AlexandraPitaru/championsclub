import random
from dataclasses import dataclass

from sqlmodel import Session

from app.models.app_user import AppUser
from app.models.product import Product
from app.sales_advisor_dashboard.overview_service import get_current_rank_for_points
from app.sales_simulator.simulator_config import SalesSimulatorSettings
from app.sales_simulator.simulator_repository import (
    create_completed_sale_transaction,
    create_sale_transaction_item,
    get_active_sales_advisor_by_id,
    get_active_sales_advisors_for_manager,
    get_manager_by_id,
    get_sale_products,
)


class SalesSimulatorError(ValueError):
    pass


@dataclass(frozen=True)
class SimulatedProductSale:
    product_id: int
    name: str
    item_type: str
    price: float
    points_value: int
    quantity: int


@dataclass(frozen=True)
class SimulatedSale:
    transaction_id: int
    advisor_id: int
    advisor_name: str
    manager_id: int | None
    amount: float
    points_earned: int
    credit_earned: float
    points_before: int
    points_after: int
    credit_before: float
    credit_after: float
    rank_before: str
    rank_after: str
    products: list[SimulatedProductSale]


def _validate_manager_scope(
    session: Session,
    settings: SalesSimulatorSettings,
) -> AppUser:
    if settings.manager_id is None:
        raise SalesSimulatorError("SALES_SIMULATOR_MANAGER_ID is required.")

    manager = get_manager_by_id(session, settings.manager_id)
    if manager is None:
        raise SalesSimulatorError(
            f"Manager with id {settings.manager_id} was not found."
        )

    return manager


def _choose_target_advisors(
    session: Session,
    settings: SalesSimulatorSettings,
) -> list[AppUser]:
    manager = _validate_manager_scope(session, settings)

    if settings.advisor_id is not None:
        advisor = get_active_sales_advisor_by_id(session, settings.advisor_id)
        if advisor is None or advisor.manager_user_id != manager.user_id:
            raise SalesSimulatorError(
                "Configured advisor must be active and managed by the configured manager."
            )
        return [advisor]

    advisors = get_active_sales_advisors_for_manager(session, manager.user_id or 0)
    if not advisors:
        raise SalesSimulatorError(
            f"Manager {manager.user_id} does not have active sales advisors."
        )

    batch_size = min(max(settings.batch_size, 1), len(advisors))
    return random.sample(advisors, batch_size)


def _select_products_for_sale(
    products: list[Product],
    max_products_per_sale: int,
) -> list[tuple[Product, int]]:
    if not products:
        raise SalesSimulatorError("Cannot simulate sales without products.")

    max_items = max(max_products_per_sale, 1)
    vehicles = [product for product in products if product.item_type == "vehicle"]
    selected: list[Product] = []

    if vehicles and random.random() < 0.7:
        selected.append(random.choice(vehicles))

    while len(selected) < max_items:
        if selected and random.random() < 0.35:
            break
        selected.append(random.choice(products))

    if not selected:
        selected.append(random.choice(products))

    grouped: dict[int, tuple[Product, int]] = {}
    for product in selected:
        product_id = product.product_id or 0
        _, quantity = grouped.get(product_id, (product, 0))
        grouped[product_id] = (product, quantity + 1)

    return list(grouped.values())


def simulate_sale_for_advisor(
    session: Session,
    advisor: AppUser,
    settings: SalesSimulatorSettings,
    products: list[Product] | None = None,
) -> SimulatedSale:
    available_products = (
        products if products is not None else get_sale_products(session)
    )
    selected_products = _select_products_for_sale(
        products=available_products,
        max_products_per_sale=settings.max_products_per_sale,
    )

    amount = round(
        sum(
            float(product.price or 0) * quantity
            for product, quantity in selected_products
        ),
        2,
    )
    raw_points_earned = sum(
        int(product.points_value or 0) * quantity
        for product, quantity in selected_products
    )
    points_earned = max(
        1,
        int(raw_points_earned * settings.points_multiplier),
    ) if raw_points_earned > 0 else 0

    points_before = int(advisor.points or 0)
    credit_before = float(advisor.credit or 0.0)
    rank_before = advisor.rank

    transaction = create_completed_sale_transaction(
        session=session,
        advisor=advisor,
        amount=amount,
        points_earned=points_earned,
    )

    for product, quantity in selected_products:
        create_sale_transaction_item(
            session=session,
            transaction_id=transaction.transaction_id or 0,
            product_id=product.product_id or 0,
            quantity=quantity,
        )

    credit_earned = round(points_earned * settings.credit_rate, 2)
    advisor.points = points_before + points_earned
    advisor.credit = round(credit_before + credit_earned, 2)
    advisor.rank = get_current_rank_for_points(advisor.points)[0]
    session.add(advisor)
    session.flush()

    return SimulatedSale(
        transaction_id=transaction.transaction_id or 0,
        advisor_id=advisor.user_id or 0,
        advisor_name=f"{advisor.first_name} {advisor.last_name}",
        manager_id=advisor.manager_user_id,
        amount=amount,
        points_earned=points_earned,
        credit_earned=credit_earned,
        points_before=points_before,
        points_after=advisor.points,
        credit_before=credit_before,
        credit_after=float(advisor.credit or 0.0),
        rank_before=rank_before,
        rank_after=advisor.rank,
        products=[
            SimulatedProductSale(
                product_id=product.product_id or 0,
                name=product.name,
                item_type=product.item_type,
                price=float(product.price or 0),
                points_value=int(product.points_value or 0),
                quantity=quantity,
            )
            for product, quantity in selected_products
        ],
    )


def simulate_sales_batch(
    session: Session,
    settings: SalesSimulatorSettings,
) -> list[SimulatedSale]:
    advisors = _choose_target_advisors(session, settings)
    products = get_sale_products(session)
    return [
        simulate_sale_for_advisor(
            session=session,
            advisor=advisor,
            settings=settings,
            products=products,
        )
        for advisor in advisors
    ]
