"""
Service de pagamentos — lógica de negócio isolada do router.

Responsabilidades:
- Criar pagamentos Pix e Cartão via SDK do Mercado Pago
- Processar webhook: consultar status no MP e atualizar banco
- Atualizar gift quando pagamento for aprovado
"""

import html
import logging
import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.payment import get_mp_sdk, PaymentStatus
from app.models.gift import Gift, GiftPurchase
from app.models.payment import Payment
from app.schemas.payment import PaymentCreateIn, PaymentCreateOut, PaymentStatusOut

logger = logging.getLogger("uvicorn.error")


# ── Helpers ───────────────────────────────────────────────────────────────────

def _format_expiration(minutes: int) -> str:
    """Retorna a data de expiração no formato ISO 8601 com timezone exigido pelo MP."""
    expires = datetime.now(timezone.utc) + timedelta(minutes=minutes)
    return expires.strftime("%Y-%m-%dT%H:%M:%S.000-03:00")


def _sanitize(value: str | None) -> str | None:
    """Remove tags HTML de strings de usuário."""
    if value is None:
        return None
    return html.escape(value.strip())


# ── Criar pagamento ───────────────────────────────────────────────────────────

async def create_payment(
    payload: PaymentCreateIn,
    db: AsyncSession,
) -> PaymentCreateOut:
    """
    Cria um pagamento no Mercado Pago e persiste o registro em `payments`.
    NÃO marca o presente como comprado — isso só ocorre no webhook.
    """
    # 1. Valida que o presente existe e tem estoque
    gift = await db.get(Gift, payload.gift_id)
    if gift is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Presente não encontrado.")
    if gift.purchased or gift.stock_limit <= 0:
        from fastapi import HTTPException
        raise HTTPException(status_code=409, detail="Presente já esgotado.")

    # 2. Verifica se já existe pagamento pendente/aprovado para este presente
    existing = await db.scalar(
        select(Payment).where(
            Payment.gift_id == payload.gift_id,
            Payment.status.in_(["pending", "approved", "in_process"]),
        )
    )
    if existing is not None:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=409,
            detail="Já existe um pagamento em andamento para este presente.",
        )

    # 3. Sanitiza inputs
    safe_name = _sanitize(payload.buyer_name) or ""
    safe_message = _sanitize(payload.message)

    sdk = get_mp_sdk()

    if payload.method == "pix":
        return await _create_pix_payment(
            gift=gift,
            buyer_name=safe_name,
            message=safe_message,
            sdk=sdk,
            db=db,
        )
    else:
        return await _create_card_payment(
            gift=gift,
            buyer_name=safe_name,
            message=safe_message,
            payload=payload,
            sdk=sdk,
            db=db,
        )


async def _create_pix_payment(
    gift: Gift,
    buyer_name: str,
    message: str | None,
    sdk,
    db: AsyncSession,
) -> PaymentCreateOut:
    """Cria um pagamento Pix dinâmico no Mercado Pago."""
    expires_at_str = _format_expiration(settings.MP_PIX_EXPIRATION_MINUTES)

    mp_request = {
        "transaction_amount": float(gift.price),
        "description": f"Presente: {gift.title}",
        "payment_method_id": "pix",
        "date_of_expiration": expires_at_str,
        "payer": {
            "email": "convidado@luizaeian.com",  # e-mail genérico para Pix
            "first_name": buyer_name,
        },
        "metadata": {
            "gift_id": str(gift.id),
            "buyer_name": buyer_name,
        },
    }

    response = sdk.payment().create(mp_request)
    response_body = response.get("response", {})
    status_code = response.get("status", 500)

    if status_code not in (200, 201):
        error_msg = response_body.get("message", "Erro ao criar pagamento Pix.")
        logger.error("MP Pix create error [%s]: %s", status_code, response_body)
        from fastapi import HTTPException
        raise HTTPException(status_code=502, detail=error_msg)

    mp_id = response_body.get("id")
    mp_status = response_body.get("status", "pending")
    internal_status = PaymentStatus.from_mp(mp_status)

    # QR code
    pix_info = response_body.get("point_of_interaction", {}).get("transaction_data", {})
    qr_code = pix_info.get("qr_code")
    qr_code_base64 = pix_info.get("qr_code_base64")
    expires_at_raw = response_body.get("date_of_expiration")
    expires_dt = None
    if expires_at_raw:
        try:
            expires_dt = datetime.fromisoformat(expires_at_raw.replace("Z", "+00:00"))
        except ValueError:
            expires_dt = None

    # Persiste no banco
    payment = Payment(
        gift_id=gift.id,
        mp_payment_id=mp_id,
        method="pix",
        status=internal_status,
        amount=Decimal(str(gift.price)),
        buyer_name=buyer_name,
        message=safe_message if (safe_message := message) else None,
    )
    db.add(payment)
    await db.flush()
    await db.refresh(payment)

    return PaymentCreateOut(
        payment_id=str(payment.id),
        mp_payment_id=mp_id,
        status=internal_status,
        method="pix",
        qr_code=qr_code,
        qr_code_base64=qr_code_base64,
        expires_at=expires_dt,
    )


async def _create_card_payment(
    gift: Gift,
    buyer_name: str,
    message: str | None,
    payload: PaymentCreateIn,
    sdk,
    db: AsyncSession,
) -> PaymentCreateOut:
    """Cria um pagamento com cartão de crédito via token do MP Brick."""
    mp_request = {
        "transaction_amount": float(gift.price),
        "token": payload.card_token,
        "description": f"Presente: {gift.title}",
        "installments": payload.installments or 1,
        "payment_method_id": payload.payment_method_id,
        "issuer_id": payload.issuer_id,
        "capture": True,
        "payer": {
            "email": "convidado@luizaeian.com",
            "first_name": buyer_name,
        },
        "metadata": {
            "gift_id": str(gift.id),
            "buyer_name": buyer_name,
        },
    }
    if payload.issuer_id:
        mp_request["issuer_id"] = payload.issuer_id

    response = sdk.payment().create(mp_request)
    response_body = response.get("response", {})
    status_code = response.get("status", 500)

    if status_code not in (200, 201):
        error_msg = response_body.get("message", "Erro ao processar pagamento.")
        logger.error("MP Card create error [%s]: %s", status_code, response_body)
        from fastapi import HTTPException
        raise HTTPException(status_code=502, detail=error_msg)

    mp_id = response_body.get("id")
    mp_status = response_body.get("status", "pending")
    internal_status = PaymentStatus.from_mp(mp_status)
    detail_msg = response_body.get("status_detail")

    # Persiste no banco
    payment = Payment(
        gift_id=gift.id,
        mp_payment_id=mp_id,
        method="credit_card",
        status=internal_status,
        amount=Decimal(str(gift.price)),
        buyer_name=buyer_name,
        message=message,
    )
    db.add(payment)

    # Se o cartão foi aprovado instantaneamente (raro, mas possível)
    if internal_status == PaymentStatus.APPROVED:
        await _fulfill_gift(gift, buyer_name, message, db)

    await db.flush()
    await db.refresh(payment)

    return PaymentCreateOut(
        payment_id=str(payment.id),
        mp_payment_id=mp_id,
        status=internal_status,
        method="credit_card",
        detail=detail_msg,
    )


# ── Processar webhook ─────────────────────────────────────────────────────────

async def process_webhook(mp_payment_id: int, db: AsyncSession) -> None:
    """
    Consulta o status do pagamento diretamente na API do MP (não confia no payload),
    atualiza a tabela `payments` e, se aprovado, registra a compra do presente.
    """
    sdk = get_mp_sdk()
    response = sdk.payment().get(mp_payment_id)
    response_body = response.get("response", {})
    status_code = response.get("status", 500)

    if status_code != 200:
        logger.warning("Webhook: não foi possível consultar MP payment %s", mp_payment_id)
        return

    mp_status = response_body.get("status", "pending")
    internal_status = PaymentStatus.from_mp(mp_status)

    # Busca o registro de pagamento no banco
    payment = await db.scalar(
        select(Payment).where(Payment.mp_payment_id == mp_payment_id)
    )

    if payment is None:
        logger.warning("Webhook: mp_payment_id %s não encontrado no banco", mp_payment_id)
        return

    old_status = payment.status
    payment.status = internal_status
    db.add(payment)

    # Só processa a compra do presente se ainda não foi processado
    if internal_status == PaymentStatus.APPROVED and old_status != PaymentStatus.APPROVED:
        gift = await db.get(Gift, payment.gift_id)
        if gift and not gift.purchased and gift.stock_limit > 0:
            await _fulfill_gift(gift, payment.buyer_name, payment.message, db)
            logger.info(
                "Webhook: presente %s marcado como comprado via pagamento %s",
                payment.gift_id,
                mp_payment_id,
            )

    await db.flush()


# ── Consultar status ──────────────────────────────────────────────────────────

async def get_payment_status(payment_id: uuid.UUID, db: AsyncSession) -> PaymentStatusOut:
    """Retorna o status interno do pagamento sem expor dados sensíveis."""
    payment = await db.get(Payment, payment_id)
    if payment is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Pagamento não encontrado.")

    return PaymentStatusOut(
        payment_id=str(payment.id),
        status=payment.status,
        paid=payment.status == PaymentStatus.APPROVED,
    )


# ── Registrar compra do presente ──────────────────────────────────────────────

async def _fulfill_gift(
    gift: Gift,
    buyer_name: str,
    message: str | None,
    db: AsyncSession,
) -> None:
    """
    Cria o registro em gift_purchases e decrementa o estoque do presente.
    Chamado tanto pelo webhook (Pix) quanto pela resposta direta (Cartão aprovado).
    """
    purchase = GiftPurchase(
        gift_id=gift.id,
        buyer_name=buyer_name,
        message=message,
    )
    db.add(purchase)

    new_stock = max(gift.stock_limit - 1, 0)
    await db.execute(
        update(Gift)
        .where(Gift.id == gift.id)
        .values(
            stock_limit=new_stock,
            purchased=(new_stock == 0),
        )
    )
