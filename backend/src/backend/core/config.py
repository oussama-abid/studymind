from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_FILE = Path(__file__).resolve().parents[4] / ".env"


class Settings(BaseSettings):
    database_url: str
    cors_origins: list[str]
    upload_dir: str = "uploads"
    gemini_api_key: str
    jwt_secret_key: str
    access_token_minutes: int = 60
    max_documents_per_user: int = 20
    max_questions_per_hour: int = 30
    model_config = SettingsConfigDict(env_file=ENV_FILE, extra="ignore")


settings = Settings()
