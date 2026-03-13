from pydantic_settings import BaseSettings
from functools import lru_cache
import json


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Luizaeian API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@db:5432/luizaeian"
    DATABASE_ECHO: bool = False

    # Security
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # CORS — str para evitar conflito de parse com env vars legadas no Render
    CORS_ORIGINS: str = (
        "http://localhost:5173,"
        "http://localhost:3000,"
        "https://luizaeian.com,"
        "https://www.luizaeian.com,"
        "https://luizaeian.onrender.com,"
        "https://luizaeian-frontend.onrender.com"
    )

    @property
    def cors_origins_list(self) -> list[str]:
        v = self.CORS_ORIGINS.strip()
        # Aceita tanto JSON array quanto string separada por vírgula
        if v.startswith("["):
            return json.loads(v)
        return [o.strip() for o in v.split(",") if o.strip()]

    # ── Mercado Pago ──────────────────────────────────────────────────────────
    # Credenciais sandbox: obter em https://www.mercadopago.com.br/developers
    # Sandbox: MP_ACCESS_TOKEN começa com "TEST-"
    # Produção: começa com "APP_USR-"
    MP_ACCESS_TOKEN: str = ""
    MP_PUBLIC_KEY: str = ""
    MP_SANDBOX: bool = True
    MP_PIX_EXPIRATION_MINUTES: int = 30
    # Segredo HMAC para validar assinatura dos webhooks do Mercado Pago
    MP_WEBHOOK_SECRET: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
