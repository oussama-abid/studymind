from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    cors_origins: list[str]
    upload_dir: str = "uploads"
    model_config = SettingsConfigDict(env_file="../.env", extra="ignore")


settings = Settings()
