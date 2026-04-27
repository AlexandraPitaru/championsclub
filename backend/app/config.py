import os


def _get_bool_env(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default

    return value.strip().lower() in {"1", "true", "yes", "on"}


class Settings:
    app_env: str = os.getenv("APP_ENV", "development")
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql://championsclub:championsclub_dev_password@localhost:5432/championsclub",
    )
    auto_seed: bool = _get_bool_env("AUTO_SEED", False)
    secret_key: str = os.getenv("SECRET_KEY", "change-me-in-production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))


settings = Settings()