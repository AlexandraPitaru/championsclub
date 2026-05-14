from pydantic import BaseModel, Field


class SalesSimulationRunRequest(BaseModel):
    advisor_id: int | None = Field(default=None, gt=0)
    batch_size: int | None = Field(default=None, ge=1, le=100)
    max_products_per_sale: int | None = Field(default=None, ge=1, le=10)


class SalesSimulationProductResponse(BaseModel):
    product_id: int
    name: str
    item_type: str
    price: float
    points_value: int
    quantity: int


class SalesSimulationSaleResponse(BaseModel):
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
    products: list[SalesSimulationProductResponse]


class SalesSimulationRunResponse(BaseModel):
    manager_id: int
    requested_advisor_id: int | None
    requested_batch_size: int
    sales_created: int
    sales: list[SalesSimulationSaleResponse]


class SalesSimulatorConfigurationResponse(BaseModel):
    enabled: bool
    interval_seconds: int
    manager_id: int | None
    advisor_id: int | None
    batch_size: int
    max_products_per_sale: int
    points_multiplier: float
    credit_rate: float
