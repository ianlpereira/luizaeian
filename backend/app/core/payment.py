"""
Módulo de integração com o Mercado Pago.

Fornece:
- Singleton do SDK (`get_mp_sdk`)
- Validação de assinatura HMAC do webhook
- Constantes de status
"""

import hmac
import hashlib
import logging

import mercadopago

from app.core.config import settings

logger = logging.getLogger("uvicorn.error")

# ── Singleton do SDK ──────────────────────────────────────────────────────────

_sdk: mercadopago.SDK | None = None


def get_mp_sdk() -> mercadopago.SDK:
    """Retorna o singleton do cliente Mercado Pago (inicializado com MP_ACCESS_TOKEN)."""
    global _sdk
    if _sdk is None:
        if not settings.MP_ACCESS_TOKEN:
            raise RuntimeError(
                "MP_ACCESS_TOKEN não configurado. "
                "Adicione a variável de ambiente antes de usar os endpoints de pagamento."
            )
        _sdk = mercadopago.SDK(settings.MP_ACCESS_TOKEN)
        mode = "SANDBOX" if settings.MP_SANDBOX else "PRODUÇÃO"
        logger.info("Mercado Pago SDK inicializado — modo: %s", mode)
    return _sdk


# ── Status de pagamento ───────────────────────────────────────────────────────

class PaymentStatus:
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    IN_PROCESS = "in_process"

    # Mapeamento dos status do MP para nossos status internos
    _MP_MAP: dict[str, str] = {
        "pending": PENDING,
        "approved": APPROVED,
        "authorized": APPROVED,
        "in_process": IN_PROCESS,
        "in_mediation": IN_PROCESS,
        "rejected": REJECTED,
        "cancelled": CANCELLED,
        "refunded": CANCELLED,
        "charged_back": CANCELLED,
    }

    @classmethod
    def from_mp(cls, mp_status: str) -> str:
        """Converte status do Mercado Pago para status interno."""
        return cls._MP_MAP.get(mp_status, cls.PENDING)


# ── Validação HMAC do webhook ─────────────────────────────────────────────────

def validate_mp_webhook_signature(
    x_signature: str,
    x_request_id: str,
    data_id: str,
    secret: str,
) -> bool:
    """
    Valida a assinatura HMAC-SHA256 enviada pelo Mercado Pago no header
    'x-signature' conforme documentação oficial:
    https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks

    Retorna True se válida, False caso contrário.
    Se MP_WEBHOOK_SECRET estiver vazio (dev/sandbox sem segredo), sempre retorna True.
    """
    if not secret:
        logger.warning(
            "MP_WEBHOOK_SECRET não configurado — assinatura de webhook não está sendo validada. "
            "Configure em produção!"
        )
        return True

    ts = ""
    v1 = ""
    for part in x_signature.split(","):
        k, _, v = part.strip().partition("=")
        if k == "ts":
            ts = v
        elif k == "v1":
            v1 = v

    if not ts or not v1:
        return False

    # Manifesto: "id:<data_id>;request-id:<x_request_id>;ts:<ts>;"
    manifest = f"id:{data_id};request-id:{x_request_id};ts:{ts};"
    expected = hmac.new(
        secret.encode("utf-8"),
        manifest.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(expected, v1)
