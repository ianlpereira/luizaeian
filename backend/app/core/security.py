"""
Autenticação da área administrativa.

Usuário único, com credenciais vindas de variáveis de ambiente:
    ADMIN_USERNAME       — nome de usuário em texto puro
    ADMIN_PASSWORD_HASH  — hash bcrypt gerado por `python -m scripts.hash_admin_password`

O login devolve um JWT curto (ACCESS_TOKEN_EXPIRE_MINUTES) assinado com SECRET_KEY.
Não há tabela de usuários nem sessão no servidor — o token carrega tudo que é
necessário para validar as requisições seguintes.
"""

import hashlib
import logging
import secrets
import time
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

logger = logging.getLogger("uvicorn.error")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hash descartável usado quando o usuário informado está errado. Verificar contra
# ele custa o mesmo que verificar contra o hash real, então o tempo de resposta
# não revela se o nome de usuário existe. Gerado no import (~250 ms, uma vez) a
# partir de um valor aleatório: nenhuma senha consegue casar com ele.
_DUMMY_HASH = pwd_context.hash(secrets.token_urlsafe(32))

_MISSING_CONFIG_DETAIL = "Área administrativa não configurada."
_INVALID_CREDENTIALS_DETAIL = "Usuário ou senha inválidos."
_INVALID_TOKEN_DETAIL = "Sessão expirada ou inválida."

# `auto_error=False`: sem o header, devolvemos nosso próprio 401 em vez do 403
# padrão do FastAPI. O frontend usa exatamente o 401 para voltar ao login.
_bearer_scheme = HTTPBearer(auto_error=False)


def admin_auth_configured() -> bool:
    """Indica se o login administrativo está habilitado (fail-closed sem env)."""
    return bool(settings.ADMIN_USERNAME and settings.ADMIN_PASSWORD_HASH)


def _password_fingerprint() -> str:
    """
    Impressão digital do hash da senha atual, embutida no token como claim `pwv`.

    Trocar ADMIN_PASSWORD_HASH muda a impressão e invalida todos os tokens já
    emitidos — a única forma de revogação necessária num esquema sem estado.
    """
    return hashlib.sha256(settings.ADMIN_PASSWORD_HASH.encode("utf-8")).hexdigest()[:16]


def verify_admin_credentials(username: str, password: str) -> bool:
    """Valida usuário e senha em tempo constante. Retorna False se não configurado."""
    if not admin_auth_configured():
        return False

    username_ok = secrets.compare_digest(username, settings.ADMIN_USERNAME)

    # A verificação bcrypt roda sempre, mesmo com usuário errado, para não vazar
    # a existência do usuário pelo tempo de resposta.
    stored_hash = settings.ADMIN_PASSWORD_HASH if username_ok else _DUMMY_HASH
    try:
        password_ok = pwd_context.verify(password, stored_hash)
    except ValueError:
        # Hash malformado no ambiente — trata como credencial inválida.
        logger.error("ADMIN_PASSWORD_HASH inválido: não é um hash bcrypt.")
        return False

    return username_ok and password_ok


def create_admin_token() -> tuple[str, int]:
    """Cria o JWT do administrador. Devolve (token, validade_em_segundos)."""
    if settings.ENVIRONMENT == "production" and settings.SECRET_KEY == "change-me-in-production":
        # Sem SECRET_KEY própria qualquer um consegue forjar um token válido.
        logger.error("SECRET_KEY não configurada em produção — login bloqueado.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=_MISSING_CONFIG_DETAIL,
        )

    expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    now = datetime.now(timezone.utc)

    payload = {
        "sub": settings.ADMIN_USERNAME,
        "role": "admin",
        "pwv": _password_fingerprint(),
        "iat": now,
        "exp": now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    }

    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token, expires_in


async def get_current_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> str:
    """Dependência das rotas administrativas. Devolve o nome do admin autenticado."""
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=_INVALID_TOKEN_DETAIL,
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not admin_auth_configured() or credentials is None:
        raise unauthorized

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
    except JWTError:
        raise unauthorized

    username = payload.get("sub")
    if (
        payload.get("role") != "admin"
        or not isinstance(username, str)
        or not secrets.compare_digest(username, settings.ADMIN_USERNAME)
        or payload.get("pwv") != _password_fingerprint()
    ):
        raise unauthorized

    return username


# ── Proteção contra força bruta no login ──────────────────────────────────────
# Janela deslizante em memória. É suficiente aqui: o Render Free roda uma única
# instância e um verify bcrypt já custa ~250 ms, limitando o ritmo a ~4 tentativas
# por segundo mesmo sem o contador. Reiniciar o processo zera a janela.

_attempts: dict[str, list[float]] = {}
_global_attempts: list[float] = []


def _client_ip(request: Request) -> tuple[str, str]:
    """
    Resolve o IP real do visitante e diz de onde ele veio.

    A ordem importa. O site está atrás do Cloudflare, que por sua vez fala com o
    Render: `request.client.host` é sempre o IP do proxy, igual para todo mundo.
    Usá-lo como chave transforma o limite por IP num limite global — foi o que
    aconteceu em produção, com um visitante qualquer conseguindo trancar o login
    do casal por 15 minutos.

    `CF-Connecting-IP` é preenchido pelo Cloudflare com o IP do cliente e não
    pode ser forjado por quem passa por ele. Só caímos no X-Forwarded-For e no
    peer da conexão quando esse header não existe.
    """
    cf_ip = request.headers.get("cf-connecting-ip")
    if cf_ip:
        return cf_ip.strip(), "cf-connecting-ip"

    true_client = request.headers.get("true-client-ip")
    if true_client:
        return true_client.strip(), "true-client-ip"

    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip(), "x-forwarded-for"

    # Sem nenhum header de proxy, isto é o IP do próprio proxy: chave compartilhada.
    # Marcamos a origem para que o log denuncie a situação em vez de escondê-la.
    return (request.client.host if request.client else "unknown"), "peer"


def _prune(timestamps: list[float], cutoff: float) -> list[float]:
    return [t for t in timestamps if t > cutoff]


def check_login_rate_limit(request: Request) -> None:
    """Bloqueia com 429 quando o IP (ou o servidor todo) excede a janela."""
    now = time.monotonic()
    cutoff = now - settings.ADMIN_LOGIN_WINDOW_MINUTES * 60
    ip, _source = _client_ip(request)

    global _global_attempts
    _global_attempts = _prune(_global_attempts, cutoff)

    # A poda de todas as chaves mantém o dicionário limitado ao tráfego da janela.
    for key in list(_attempts):
        remaining = _prune(_attempts[key], cutoff)
        if remaining:
            _attempts[key] = remaining
        else:
            del _attempts[key]

    ip_blocked = len(_attempts.get(ip, [])) >= settings.ADMIN_LOGIN_MAX_ATTEMPTS
    global_blocked = len(_global_attempts) >= settings.ADMIN_LOGIN_GLOBAL_MAX_ATTEMPTS

    if ip_blocked or global_blocked:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Muitas tentativas. Tente novamente em alguns minutos.",
            headers={"Retry-After": str(settings.ADMIN_LOGIN_WINDOW_MINUTES * 60)},
        )


def register_failed_login(request: Request) -> None:
    """Contabiliza uma tentativa malsucedida e registra apenas o IP no log."""
    now = time.monotonic()
    ip, source = _client_ip(request)

    _attempts.setdefault(ip, []).append(now)
    _global_attempts.append(now)

    # `source=peer` no log significa que nenhum header de proxy chegou e que
    # todos os visitantes estão dividindo o mesmo balde — sinal de configuração
    # errada, não de ataque.
    logger.warning(
        "Login administrativo falhou (ip=%s, source=%s, tentativas=%d)",
        ip,
        source,
        len(_attempts[ip]),
    )


def clear_login_attempts(request: Request) -> None:
    """Zera a janela do IP após um login bem-sucedido."""
    ip, _source = _client_ip(request)
    _attempts.pop(ip, None)
