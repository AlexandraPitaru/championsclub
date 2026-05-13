import asyncio
import logging
from contextlib import suppress

from sqlmodel import Session

from app.database import engine
from app.sales_simulator.simulator_config import (
    SalesSimulatorSettings,
    load_sales_simulator_settings,
)
from app.sales_simulator.simulator_service import (
    SalesSimulatorError,
    simulate_sales_batch,
)

logger = logging.getLogger(__name__)

_sales_simulator_task: asyncio.Task[None] | None = None


async def _run_sales_simulator_forever(settings: SalesSimulatorSettings) -> None:
    while True:
        try:
            with Session(engine) as session:
                sales = simulate_sales_batch(session=session, settings=settings)
                session.commit()

            if sales:
                logger.info("Sales simulator created %s sale(s).", len(sales))
        except SalesSimulatorError as exc:
            logger.warning("Sales simulator skipped a cycle: %s", exc)
        except Exception:
            logger.exception("Sales simulator failed during a cycle.")

        await asyncio.sleep(settings.interval_seconds)


def start_sales_simulator_scheduler() -> None:
    global _sales_simulator_task

    settings = load_sales_simulator_settings()
    if not settings.enabled:
        logger.info("Sales simulator is disabled.")
        return

    if settings.manager_id is None:
        logger.warning(
            "Sales simulator is enabled but SALES_SIMULATOR_MANAGER_ID is missing."
        )
        return

    if _sales_simulator_task is not None and not _sales_simulator_task.done():
        return

    _sales_simulator_task = asyncio.create_task(
        _run_sales_simulator_forever(settings)
    )
    logger.info(
        "Sales simulator started for manager_id=%s, advisor_id=%s, batch_size=%s.",
        settings.manager_id,
        settings.advisor_id,
        settings.batch_size,
    )


async def stop_sales_simulator_scheduler() -> None:
    global _sales_simulator_task

    if _sales_simulator_task is None:
        return

    _sales_simulator_task.cancel()
    with suppress(asyncio.CancelledError):
        await _sales_simulator_task

    _sales_simulator_task = None
