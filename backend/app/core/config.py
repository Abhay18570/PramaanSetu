from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="PRAMAANSETU_", env_file=".env", extra="ignore")
    api_host: str = "127.0.0.1"
    api_port: int = 8000
    allowed_origins: str = "http://127.0.0.1:5173,http://localhost:5173"
    max_file_size: int = 10 * 1024 * 1024
    max_files: int = 12
    max_pdf_pages: int = 30
    max_ocr_pages: int = 8
    ocr_language: str = "eng"
    ocr_timeout: int = 20
    max_evidence_length: int = 280
    engine_version: str = "1.0.0"
    ai_provider: str = "deterministic"
    ai_model: str = ""
    ai_api_key: str = ""
    ai_base_url: str = ""

    @property
    def origins(self) -> list[str]:
        return [item.strip() for item in self.allowed_origins.split(",") if item.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
