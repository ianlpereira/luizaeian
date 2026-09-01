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


async def test_bloqueio_de_um_ip_nao_afeta_outro(client: AsyncClient, admin_env: None) -> None:
    """
    Regressão do incidente em produção: `request.client.host` atrás do Render é
    sempre o IP do proxy, então todos os visitantes caíam no mesmo balde e um
    único insistente trancava o login do casal.
    """
    payload = {"username": TEST_USERNAME, "password": "senha-errada"}
    atacante = {"CF-Connecting-IP": "203.0.113.10"}
    casal = {"CF-Connecting-IP": "198.51.100.20"}

    for _ in range(settings.ADMIN_LOGIN_MAX_ATTEMPTS):
        await client.post("/api/admin/login", json=payload, headers=atacante)

    bloqueado = await client.post("/api/admin/login", json=payload, headers=atacante)
    assert bloqueado.status_code == 429

    # O outro IP continua livre — e consegue de fato entrar.
    livre = await client.post(
        "/api/admin/login",
        json={"username": TEST_USERNAME, "password": TEST_PASSWORD},
        headers=casal,
    )
    assert livre.status_code == 200


@pytest.mark.parametrize(
    "header",
    ["CF-Connecting-IP", "True-Client-IP", "X-Forwarded-For"],
)
async def test_headers_de_proxy_separam_os_baldes(
    client: AsyncClient, admin_env: None, header: str
) -> None:
    payload = {"username": TEST_USERNAME, "password": "senha-errada"}

    for _ in range(settings.ADMIN_LOGIN_MAX_ATTEMPTS):
        await client.post("/api/admin/login", json=payload, headers={header: "203.0.113.30"})

    mesmo_ip = await client.post(
        "/api/admin/login", json=payload, headers={header: "203.0.113.30"}
    )
    outro_ip = await client.post(
        "/api/admin/login", json=payload, headers={header: "203.0.113.31"}
    )

    assert mesmo_ip.status_code == 429
    assert outro_ip.status_code == 401


async def test_cf_connecting_ip_tem_prioridade_sobre_forwarded_for(
    client: AsyncClient, admin_env: None
) -> None:
    """
    O X-Forwarded-For pode ser forjado por quem chama; o CF-Connecting-IP é
    escrito pelo Cloudflare. Bloquear pelo primeiro permitiria trocar de balde
    a cada tentativa.
    """
    payload = {"username": TEST_USERNAME, "password": "senha-errada"}

    for i in range(settings.ADMIN_LOGIN_MAX_ATTEMPTS):
        await client.post(
            "/api/admin/login",
            json=payload,
            headers={"CF-Connecting-IP": "203.0.113.40", "X-Forwarded-For": f"10.0.0.{i}"},
        )

    # XFF diferente de todos os anteriores, mas o CF-Connecting-IP é o mesmo.
    resposta = await client.post(
        "/api/admin/login",
        json=payload,
        headers={"CF-Connecting-IP": "203.0.113.40", "X-Forwarded-For": "10.0.0.99"},
    )

    assert resposta.status_code == 429


async def test_teto_global_fica_acima_do_limite_por_ip() -> None:
    """Se o teto global ficar perto do limite por IP, ele vira o gargalo real."""
    assert settings.ADMIN_LOGIN_GLOBAL_MAX_ATTEMPTS > settings.ADMIN_LOGIN_MAX_ATTEMPTS * 5


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


@pytest.mark.parametrize(
    "sujeira",
    ["{}\n", "{}\r\n", " {} ", "\n{}", "{}\t"],
    ids=["nova-linha", "crlf", "espacos", "quebra-antes", "tab"],
)
async def test_hash_com_espacos_ao_redor_ainda_autentica(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch, sujeira: str
) -> None:
    """
    Incidente real: o campo de valor no painel do Render é um textarea, e o hash
    ficou guardado com uma quebra de linha no fim. O passlib recusava o hash e
    todo login virava 401, com a tela mostrando um hash aparentemente perfeito.
    """
    monkeypatch.setattr(settings, "ADMIN_USERNAME", TEST_USERNAME)
    monkeypatch.setattr(
        settings, "ADMIN_PASSWORD_HASH", sujeira.format(TEST_PASSWORD_HASH).strip()
    )

    response = await client.post(
        "/api/admin/login",
        json={"username": TEST_USERNAME, "password": TEST_PASSWORD},
    )

    assert response.status_code == 200


def test_settings_limpa_espacos_das_credenciais() -> None:
    """A limpeza acontece no Settings, então vale para qualquer origem do valor."""
    from app.core.config import Settings

    configurado = Settings(
        ADMIN_USERNAME=f"  {TEST_USERNAME}\n",
        ADMIN_PASSWORD_HASH=f"{TEST_PASSWORD_HASH}\n",
    )

    assert configurado.ADMIN_USERNAME == TEST_USERNAME
    assert configurado.ADMIN_PASSWORD_HASH == TEST_PASSWORD_HASH


async def test_usuario_com_espacos_ao_redor_ainda_autentica(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "ADMIN_USERNAME", f" {TEST_USERNAME} ".strip())
    monkeypatch.setattr(settings, "ADMIN_PASSWORD_HASH", TEST_PASSWORD_HASH)

    response = await client.post(
        "/api/admin/login",
        json={"username": TEST_USERNAME, "password": TEST_PASSWORD},
    )

    assert response.status_code == 200


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
