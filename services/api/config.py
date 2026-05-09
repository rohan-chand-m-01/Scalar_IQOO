from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"
    groq_api_key: str = ""

    database_url: str = "postgresql+asyncpg://rguser:rgpass123@localhost:5432/regraph"
    sync_database_url: str = "postgresql://rguser:rgpass123@localhost:5432/regraph"
    redis_url: str = "redis://localhost:6379"

    chroma_persist_dir: str = "./chroma_db"
    embedding_model: str = "models/text-embedding-004"

    mock_gstn_url: str = "https://gstn-taupe.vercel.app/regulations.json"
    mock_epfo_url: str = "https://epfo-eight.vercel.app/regulations.json"
    mock_fssai_url: str = "https://fssai-three.vercel.app/regulations.json"
    mock_pt_url: str = "https://pt-states.vercel.app/regulations.json"

    api_base_url: str = "http://localhost:8000"
    clerk_secret_key: str = ""
    clerk_webhook_secret: str = ""
    vault_encryption_key: str = ""

    model_config = SettingsConfigDict(
        env_file=("../../.env", ".env"),
        extra="ignore",
    )


settings = Settings()
