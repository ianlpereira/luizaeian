"""
Fixtures compartilhadas dos testes.

Os testes de autenticação não precisam de banco: `get_db` abre a sessão com
`async with AsyncSessionLocal()`, que só conecta na primeira query — e nenhuma
query acontece quando a requisição é barrada em 401/429/503.

A fixture `db` existe para os que precisam. Ela é lazy: só conecta se o teste
pedir, então continua barato rodar a suíte sem PostgreSQL.
"""

from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool

from app.core import security
from app.core.config import settings
from app.core.database import _async_db_url
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


@pytest.fixture
async def db() -> AsyncIterator[AsyncSession]:
    """
    Sessão presa a uma transação externa, revertida ao fim do teste.

    Engine própria com NullPool: o pytest-asyncio cria um event loop por teste e
    o engine global de app.core.database guardaria conexões de um loop já
    fechado, quebrando o segundo teste em diante com "Event loop is closed".
    """
    test_engine = create_async_engine(_async_db_url(settings.DATABASE_URL), poolclass=NullPool)
    try:
        async with test_engine.connect() as connection:
            transaction = await connection.begin()
            session = AsyncSession(bind=connection, expire_on_commit=False)
            try:
                yield session
            finally:
                await session.close()
                await transaction.rollback()
    finally:
        await test_engine.dispose()
