"""
Router de pagamentos — endpoints públicos do Mercado Pago.

Endpoints:
  GET  /api/payments/public-key           → Retorna MP_PUBLIC_KEY para o frontend
  POST /api/payments/create               → Cria pagamento (Pix ou Cartão)
  GET  /api/payments/{payment_id}/status  → Polling de status (frontend)
  POST /api/payments/webhook              → Recebe notificações do Mercado Pago
"""

import logging
import uuid

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.payment import validate_mp_webhook_signature
from app.schemas.payment import (
    PaymentCreateIn,
    PaymentCreateOut,
    PaymentStatusOut,
    PublicKeyOut,
    WebhookPayload,
)
from app.services import payment_service

logger = logging.getLogger("uvicorn.error")
router = APIRouter()


# ── GET /api/payments/public-key ──────────────────────────────────────────────

@router.get("/public-key", response_model=PublicKeyOut)
async def get_public_key() -> PublicKeyOut:
    """
    Retorna a chave pública do Mercado Pago para uso no frontend (MP Brick).
    A chave pública é segura para ser exposta — não é um segredo.
    """
    if not settings.MP_PUBLIC_KEY:
        raise HTTPException(
            status_code=503,
            detail="Gateway de pagamento não configurado.",
        )
    return PublicKeyOut(public_key=settings.MP_PUBLIC_KEY)


# ── POST /api/payments/create ─────────────────────────────────────────────────

@router.post("/create", response_model=PaymentCreateOut, status_code=201)
async def create_payment(
    payload: PaymentCreateIn,
    db: AsyncSession = Depends(get_db),
) -> PaymentCreateOut:
    """
    Cria um pagamento no Mercado Pago.

    - method='pix': gera QR code dinâmico com 30 min de expiração.
    - method='credit_card': tokenização feita pelo MP Brick no frontend;
      apenas o card_token chega ao servidor (dados do cartão nunca trafegam).

    O presente só é marcado como comprado após confirmação via webhook.
    """
    if not settings.MP_ACCESS_TOKEN:
        raise HTTPException(
            status_code=503,
            detail="Gateway de pagamento não configurado.",
        )
    return await payment_service.create_payment(payload, db)


# ── GET /api/payments/{payment_id}/status ─────────────────────────────────────

@router.get("/{payment_id}/status", response_model=PaymentStatusOut)
async def get_payment_status(
    payment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> PaymentStatusOut:
    """
    Retorna o status atual de um pagamento para polling do frontend.
    Resposta mínima: { payment_id, status, paid } — sem dados sensíveis.
    """
    return await payment_service.get_payment_status(payment_id, db)


# ── POST /api/payments/webhook ────────────────────────────────────────────────

@router.post("/webhook", status_code=200)
async def mp_webhook(
    request: Request,
    payload: WebhookPayload,
    db: AsyncSession = Depends(get_db),
    x_signature: str = Header(default="", alias="x-signature"),
    x_request_id: str = Header(default="", alias="x-request-id"),
) -> dict:
    """
    Recebe notificações de pagamento do Mercado Pago.

    Segurança:
    1. Valida assinatura HMAC-SHA256 (header x-signature)
    2. Não confia no status do payload — consulta diretamente a API do MP
    3. Apenas eventos do tipo 'payment' são processados

    Retorna 200 imediatamente (o MP rejeita webhooks lentos > 22 s).
    """
    # 1. Valida assinatura
    data_id = str(payload.data.get("id", "")) if payload.data else ""
    if not validate_mp_webhook_signature(
        x_signature=x_signature,
        x_request_id=x_request_id,
        data_id=data_id,
        secret=settings.MP_WEBHOOK_SECRET,
    ):
        logger.warning("Webhook: assinatura HMAC inválida — request_id=%s", x_request_id)
        raise HTTPException(status_code=401, detail="Assinatura inválida.")

    # 2. Processa apenas eventos de pagamento
    if payload.action not in ("payment.created", "payment.updated"):
        return {"received": True}

    mp_payment_id = payload.data.get("id") if payload.data else None
    if not mp_payment_id:
        return {"received": True}

    try:
        await payment_service.process_webhook(int(mp_payment_id), db)
    except Exception as exc:
        # Loga mas retorna 200 para o MP não retentar indefinidamente
        logger.exception("Webhook: erro ao processar mp_payment_id=%s: %s", mp_payment_id, exc)

    return {"received": True}
