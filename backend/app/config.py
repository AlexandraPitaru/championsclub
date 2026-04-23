import os


class Settings:
    app_env: str = os.getenv("APP_ENV", "development")
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql://championsclub:championsclub_dev_password@localhost:5432/championsclub",
    )


settings = Settings()