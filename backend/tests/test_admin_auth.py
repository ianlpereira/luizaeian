"""Testes de login e proteção das rotas administrativas. Não usam banco."""

from datetime import datetime, timedelta, timezone

import pytest
from httpx import AsyncClient
from jose import jwt

from app.core import security
from app.core.config import settings
from tests.conftest import TEST_PASSWORD, TEST_PASSWORD_HASH, TEST_USERNAME


async def test_login_com_credenciais_corretas(client: AsyncClient, admin_env: None) -> None:
    response = await client.post(
        "/api/admin/login",
        json={"username": TEST_USERNAME, "password": TEST_PASSWORD},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["token_type"] == "bearer"
    assert data["access_token"]
    assert data["expires_in"] == settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60


async def test_usuario_e_senha_errados_dao_a_mesma_resposta(
    client: AsyncClient, admin_env: None
) -> None:
    """A mensagem não pode revelar qual dos dois campos estava errado."""
    senha_errada = await client.post(
        "/api/admin/login",
        json={"username": TEST_USERNAME, "password": "outra-senha-qualquer"},
    )
    usuario_errado = await client.post(
        "/api/admin/login",
        json={"username": "ninguem", "password": TEST_PASSWORD},
    )

    assert senha_errada.status_code == 401
    assert usuario_errado.status_code == 401
    assert senha_errada.json()["detail"] == usuario_errado.json()["detail"]


async def test_sem_configuracao_login_e_relatorios_ficam_fechados(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "ADMIN_USERNAME", "")
    monkeypatch.setattr(settings, "ADMIN_PASSWORD_HASH", "")

    login = await client.post(
        "/api/admin/login", json={"username": "admin", "password": "seja-o-que-for"}
    )
    relatorio = await client.get("/api/admin/rsvps")

    assert login.status_code == 503
    assert relatorio.status_code == 401


@pytest.mark.parametrize("path", ["/api/admin/me", "/api/admin/rsvps", "/api/admin/gifts", "/api/admin/payments"])
async def test_sem_header_retorna_401_e_nao_422(
    client: AsyncClient, admin_env: None, path: str
) -> None:
    """Regressão: o esquema antigo (Header(...)) devolvia 422/403 sem o header."""
    response = await client.get(path)

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


async def test_token_invalido_ou_assinado_com_outra_chave(
    client: AsyncClient, admin_env: None
) -> None:
    lixo = await client.get(
        "/api/admin/me", headers={"Authorization": "Bearer nao-e-um-jwt"}
    )

    outra_chave = jwt.encode(
        {
            "sub": TEST_USERNAME,
            "role": "admin",
            "pwv": security._password_fingerprint(),
            "exp": datetime.now(timezone.utc) + timedelta(minutes=30),
        },
        "chave-completamente-diferente",
        algorithm=settings.ALGORITHM,
    )
    forjado = await client.get(
        "/api/admin/me", headers={"Authorization": f"Bearer {outra_chave}"}
    )

    assert lixo.status_code == 401
    assert forjado.status_code == 401


async def test_token_expirado(
    client: AsyncClient, admin_env: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "ACCESS_TOKEN_EXPIRE_MINUTES", -1)
    token, _ = security.create_admin_token()

    response = await client.get(
        "/api/admin/me", headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 401


async def test_trocar_a_senha_invalida_tokens_emitidos(
    client: AsyncClient, auth_headers: dict[str, str], monkeypatch: pytest.MonkeyPatch
) -> None:
    """A claim `pwv` é a única forma de revogação num esquema sem estado."""
    antes = await client.get("/api/admin/me", headers=auth_headers)
    assert antes.status_code == 200

    monkeypatch.setattr(
        settings, "ADMIN_PASSWORD_HASH", security.pwd_context.hash("outra-senha-nova-123")
    )
    depois = await client.get("/api/admin/me", headers=auth_headers)

    assert depois.status_code == 401


async def test_excesso_de_tentativas_retorna_429(client: AsyncClient, admin_env: None) -> None:
    payload = {"username": TEST_USERNAME, "password": "senha-errada"}

    for _ in range(settings.ADMIN_LOGIN_MAX_ATTEMPTS):
        assert (await client.post("/api/admin/login", json=payload)).status_code == 401

    bloqueado = await client.post("/api/admin/login", json=payload)

    assert bloqueado.status_code == 429
    assert bloqueado.headers["retry-after"] == str(settings.ADMIN_LOGIN_WINDOW_MINUTES * 60)


async def test_login_bem_sucedido_limpa_a_janela(client: AsyncClient, admin_env: None) -> None:
    for _ in range(settings.ADMIN_LOGIN_MAX_ATTEMPTS - 1):
        await client.post(
            "/api/admin/login", json={"username": TEST_USERNAME, "password": "errada"}
        )

    ok = await client.post(
        "/api/admin/login", json={"username": TEST_USERNAME, "password": TEST_PASSWORD}
    )
    de_novo = await client.post(
        "/api/admin/login", json={"username": TEST_USERNAME, "password": "errada"}
    )

    assert ok.status_code == 200
    # Se a janela não tivesse sido limpa, esta seria a tentativa de número MAX.
    assert de_novo.status_code == 401


async def test_hash_malformado_nao_derruba_o_login(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "ADMIN_USERNAME", TEST_USERNAME)
    monkeypatch.setattr(settings, "ADMIN_PASSWORD_HASH", "isto-nao-e-um-hash-bcrypt")

    response = await client.post(
        "/api/admin/login", json={"username": TEST_USERNAME, "password": TEST_PASSWORD}
    )

    assert response.status_code == 401


async def test_me_devolve_o_usuario(client: AsyncClient, auth_headers: dict[str, str]) -> None:
    response = await client.get("/api/admin/me", headers=auth_headers)

    assert response.status_code == 200
    assert response.json() == {"username": TEST_USERNAME}


def test_hash_de_teste_e_bcrypt() -> None:
    assert TEST_PASSWORD_HASH.startswith("$2b$")
