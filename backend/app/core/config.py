from pydantic import field_validator
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
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120  # 2 horas — validade do token do admin

    # ── Área administrativa ───────────────────────────────────────────────────
    # Credenciais do único usuário administrador. O hash é gerado por:
    #     cd backend && python -m scripts.hash_admin_password
    # Se qualquer um dos dois estiver vazio, o login fica desativado (fail-closed).
    ADMIN_USERNAME: str = ""
    ADMIN_PASSWORD_HASH: str = ""
    # Proteção contra força bruta no endpoint de login (janela deslizante em memória)
    ADMIN_LOGIN_MAX_ATTEMPTS: int = 5
    ADMIN_LOGIN_WINDOW_MINUTES: int = 15
    # Teto somando todos os IPs, para o caso de um atacante trocar de origem a
    # cada tentativa. Precisa ficar bem acima do limite por IP: se ficar perto,
    # um único visitante insistente tranca o login de todo mundo.
    ADMIN_LOGIN_GLOBAL_MAX_ATTEMPTS: int = 100

    @field_validator("ADMIN_USERNAME", "ADMIN_PASSWORD_HASH", mode="after")
    @classmethod
    def _strip_admin_credential(cls, value: str) -> str:
        """
        Remove espaços e quebras de linha das pontas.

        Os campos de valor do painel do Render são textareas: um Enter sem
        querer, ou um copiar-e-colar que trouxe junto a quebra de linha, guarda
        `"$2b$12$...\\n"`. O passlib recusa esse hash e todo login vira 401,
        enquanto a tela continua mostrando um hash aparentemente perfeito.
        O mesmo vale para o usuário, comparado byte a byte com compare_digest.
        """
        return value.strip()

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
    # E-mail do pagador de teste (deve ser diferente do e-mail do vendedor/conta MP)
    # Usado apenas em ambiente de testes para satisfazer a validação do MP
    MP_TEST_PAYER_EMAIL: str = "test_user_payer@testuser.com"
    # Texto exibido na fatura do cartão (máx. 22 chars) — reduz chargebacks
    MP_STATEMENT_DESCRIPTOR: str = "LUIZA E IAN"
    # URL base para back_urls do Checkout Pro / notificações de retorno
    MP_BACK_URL: str = "https://luizaeian.com"
    # Mock local: simula respostas do MP sem chamar a API real (útil para dev sem credenciais TEST-)
    MP_MOCK: bool = False

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
