"""
Fixtures compartilhadas dos testes.

Os testes de autenticação não precisam de banco: `get_db` abre a sessão com
`async with AsyncSessionLocal()`, que só conecta na primeira query — e nenhuma
query acontece quando a requisição é barrada em 401/429/503.
"""

from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient

from app.core import security
from app.core.config import settings
from app.main import app

TEST_USERNAME = "admin"
TEST_PASSWORD = "senha-de-teste-123"

# Gerado uma única vez no import: bcrypt é lento de propósito e refazer o hash
# a cada teste dominaria o tempo da suíte.
TEST_PASSWORD_HASH = security.pwd_context.hash(TEST_PASSWORD)


@pytest.fixture
async def client() -> AsyncIterator[AsyncClient]:
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as async_client:
        yield async_client


@pytest.fixture(autouse=True)
def reset_rate_limit() -> None:
    """Zera a janela de tentativas para um teste não contaminar o seguinte."""
    security._attempts.clear()
    security._global_attempts.clear()


@pytest.fixture
def admin_env(monkeypatch: pytest.MonkeyPatch) -> None:
    """Configura credenciais administrativas válidas."""
    monkeypatch.setattr(settings, "ADMIN_USERNAME", TEST_USERNAME)
    monkeypatch.setattr(settings, "ADMIN_PASSWORD_HASH", TEST_PASSWORD_HASH)


@pytest.fixture
async def auth_headers(client: AsyncClient, admin_env: None) -> dict[str, str]:
    response = await client.post(
        "/api/admin/login",
        json={"username": TEST_USERNAME, "password": TEST_PASSWORD},
    )
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}
