from pathlib import Path
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parents[3]
ENV_FILE = ROOT_DIR / ".env"


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI HR Platform API"
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    BACKEND_CORS_ORIGINS: list[str] = ["*"]

    # Initial Admin Config
    INITIAL_ADMIN_EMAIL: str = "admin@company.com"
    INITIAL_ADMIN_PASSWORD: str = "admin123"

    # LLM Settings
    LLM_PROVIDER: str = "gemini"
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-3.5-flash"
    LLM_TIMEOUT: float = 30.0

    # LLM Fallback Settings
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "llama3-8b-8192"
    LLM_FALLBACK_PROVIDER: str = "groq"
    LLM_ENABLE_FALLBACK: bool = True

    # GitHub Settings
    GITHUB_TOKEN: Optional[str] = None
    MOCK_GITHUB: bool = False

    # Storage settings
    STORAGE_PROVIDER: str = "s3"
    S3_ENDPOINT_URL: Optional[str] = None
    S3_PUBLIC_ENDPOINT_URL: Optional[str] = None
    S3_ACCESS_KEY: Optional[str] = None
    S3_SECRET_KEY: Optional[str] = None
    S3_BUCKET_NAME: str = "ai-hr-resumes"
    S3_REGION: str = "us-east-1"

    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()