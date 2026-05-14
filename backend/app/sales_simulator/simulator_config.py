import os
from dataclasses import dataclass


def _get_bool_env(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default

    return value.strip().lower() in {"1", "true", "yes", "on"}


def _get_optional_int_env(name: str) -> int | None:
    value = os.getenv(name)
    if value is None or not value.strip():
        return None

    try:
        parsed = int(value)
    except ValueError:
        return None

    return parsed if parsed > 0 else None


def _get_int_env(name: str, default: int, minimum: int = 1) -> int:
    value = os.getenv(name)
    if value is None or not value.strip():
        return default

    try:
        parsed = int(value)
    except ValueError:
        return default

    return max(parsed, minimum)


def _get_float_env(name: str, default: float, minimum: float = 0.0) -> float:
    value = os.getenv(name)
    if value is None or not value.strip():
        return default

    try:
        parsed = float(value)
    except ValueError:
        return default

    return max(parsed, minimum)


@dataclass(frozen=True)
class SalesSimulatorSettings:
    enabled: bool
    interval_seconds: int
    manager_id: int | None
    advisor_id: int | None
    batch_size: int
    max_products_per_sale: int
    points_multiplier: float
    credit_rate: float


def load_sales_simulator_settings() -> SalesSimulatorSettings:
    return SalesSimulatorSettings(
        enabled=_get_bool_env("SALES_SIMULATOR_ENABLED", False),
        interval_seconds=_get_int_env("SALES_SIMULATOR_INTERVAL_SECONDS", 60),
        manager_id=_get_optional_int_env("SALES_SIMULATOR_MANAGER_ID"),
        advisor_id=_get_optional_int_env("SALES_SIMULATOR_ADVISOR_ID"),
        batch_size=_get_int_env("SALES_SIMULATOR_BATCH_SIZE", 1),
        max_products_per_sale=_get_int_env("SALES_SIMULATOR_MAX_PRODUCTS_PER_SALE", 3),
        points_multiplier=_get_float_env("SALES_SIMULATOR_POINTS_MULTIPLIER", 0.25),
        credit_rate=_get_float_env("SALES_SIMULATOR_CREDIT_RATE", 0.1),
    )
