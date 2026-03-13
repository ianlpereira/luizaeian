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


# Mapeamento de status_detail do MP para mensagens amigáveis em português
_STATUS_DETAIL_MESSAGES: dict[str, str] = {
    "accredited": "Pagamento aprovado com sucesso! 🎉",
    "pending_contingency": "Seu pagamento está em processamento. Você receberá a confirmação em breve.",
    "pending_review_manual": "Seu pagamento está sendo revisado. Você receberá a confirmação em até 2 dias úteis.",
    "cc_rejected_bad_filled_card_number": "Número do cartão inválido. Verifique os dados e tente novamente.",
    "cc_rejected_bad_filled_date": "Data de validade inválida. Verifique os dados e tente novamente.",
    "cc_rejected_bad_filled_other": "Dados do cartão inválidos. Verifique as informações e tente novamente.",
    "cc_rejected_bad_filled_security_code": "Código de segurança (CVV) inválido. Verifique e tente novamente.",
    "cc_rejected_blacklist": "Não foi possível processar o pagamento com este cartão.",
    "cc_rejected_call_for_authorize": "Pagamento não autorizado. Entre em contato com seu banco.",
    "cc_rejected_card_disabled": "Cartão desativado. Entre em contato com seu banco.",
    "cc_rejected_card_error": "Erro ao processar o cartão. Tente novamente ou use outro cartão.",
    "cc_rejected_duplicated_payment": "Pagamento duplicado detectado. Verifique se já realizou este pagamento.",
    "cc_rejected_high_risk": "Pagamento recusado por motivos de segurança. Tente outro cartão.",
    "cc_rejected_insufficient_amount": "Saldo insuficiente. Verifique o limite do cartão ou use outro.",
    "cc_rejected_invalid_installments": "Número de parcelas inválido para este cartão.",
    "cc_rejected_max_attempts": "Número máximo de tentativas atingido. Tente novamente em 24h.",
    "cc_rejected_other_reason": "Pagamento recusado. Tente outro cartão ou entre em contato com seu banco.",
}


def _status_detail_to_message(detail: str | None, status: str) -> str | None:
    """Converte o status_detail do MP em mensagem amigável para o usuário."""
    if detail and detail in _STATUS_DETAIL_MESSAGES:
        return _STATUS_DETAIL_MESSAGES[detail]
    if status == "approved":
        return "Pagamento aprovado com sucesso! 🎉"
    if status in ("rejected", "cancelled"):
        return "Pagamento recusado. Tente outro cartão ou entre em contato com seu banco."
    return None


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

    # 4. Modo mock (dev sem credenciais TEST- do MP)
    if settings.MP_MOCK:
        if payload.method == "pix":
            return await _mock_pix_payment(
                gift=gift, buyer_name=safe_name, message=safe_message, db=db,
            )
        # mock cartão: aprovação imediata
        return await _mock_card_payment(
            gift=gift, buyer_name=safe_name, message=safe_message, db=db,
        )

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


async def _mock_pix_payment(
    gift: Gift,
    buyer_name: str,
    message: str | None,
    db: AsyncSession,
) -> PaymentCreateOut:
    """Simula um pagamento Pix sem chamar a API do Mercado Pago (dev/CI)."""
    import random
    fake_mp_id = random.randint(10_000_000, 99_999_999)
    expires_dt = datetime.now(timezone.utc) + timedelta(minutes=settings.MP_PIX_EXPIRATION_MINUTES)
    # QR code SVG fake em base64
    fake_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

    payment = Payment(
        gift_id=gift.id,
        mp_payment_id=fake_mp_id,
        method="pix",
        status=PaymentStatus.PENDING,
        amount=Decimal(str(gift.price)),
        buyer_name=buyer_name,
        message=message,
    )
    db.add(payment)
    await db.flush()
    await db.refresh(payment)

    logger.info("MOCK Pix criado: payment_id=%s mp_id=%s", payment.id, fake_mp_id)

    return PaymentCreateOut(
        payment_id=str(payment.id),
        mp_payment_id=fake_mp_id,
        status=PaymentStatus.PENDING,
        method="pix",
        qr_code="00020126580014br.gov.bcb.pix0136MOCK-KEY-FAKE-PIX-COPIA-COLA5204000053039865802BR5925Luiza e Ian Casamento6009Sao Paulo62070503***6304ABCD",
        qr_code_base64=fake_b64,
        expires_at=expires_dt,
    )


async def _mock_card_payment(
    gift: Gift,
    buyer_name: str,
    message: str | None,
    db: AsyncSession,
) -> PaymentCreateOut:
    """Simula um pagamento com cartão aprovado (dev/CI)."""
    import random
    fake_mp_id = random.randint(10_000_000, 99_999_999)

    payment = Payment(
        gift_id=gift.id,
        mp_payment_id=fake_mp_id,
        method="credit_card",
        status=PaymentStatus.APPROVED,
        amount=Decimal(str(gift.price)),
        buyer_name=buyer_name,
        message=message,
    )
    db.add(payment)
    await db.flush()
    # Marca presente como comprado imediatamente (mock aprova na hora)
    await _fulfill_gift(gift, buyer_name, message, db)
    await db.refresh(payment)

    logger.info("MOCK Cartão aprovado: payment_id=%s mp_id=%s", payment.id, fake_mp_id)

    return PaymentCreateOut(
        payment_id=str(payment.id),
        mp_payment_id=fake_mp_id,
        status=PaymentStatus.APPROVED,
        method="credit_card",
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

    # Divide o nome do comprador em primeiro e sobrenome
    name_parts = buyer_name.strip().split(" ", 1)
    payer_first = name_parts[0]
    payer_last = name_parts[1] if len(name_parts) > 1 else payer_first

    mp_request = {
        # Campos obrigatórios do checklist de qualidade MP
        "transaction_amount": float(gift.price),
        "description": f"Presente: {gift.title}",
        "statement_descriptor": settings.MP_STATEMENT_DESCRIPTOR,
        "payment_method_id": "pix",
        "date_of_expiration": expires_at_str,
        "notification_url": f"{settings.MP_BACK_URL}/api/payments/webhook",
        "external_reference": str(gift.id),
        "payer": {
            "email": settings.MP_TEST_PAYER_EMAIL,
            "first_name": payer_first,
            "last_name": payer_last,
        },
        # Campos do item — melhoram score antifraude e exibição no painel MP
        "additional_info": {
            "items": [
                {
                    "id": str(gift.id),
                    "title": gift.title,
                    "description": gift.title,
                    "category_id": "gift",
                    "quantity": 1,
                    "unit_price": float(gift.price),
                }
            ],
            "payer": {
                "first_name": payer_first,
                "last_name": payer_last,
            },
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
    # Divide o nome do comprador em primeiro e sobrenome
    name_parts = buyer_name.strip().split(" ", 1)
    payer_first = name_parts[0]
    payer_last = payload.payer_last_name or (name_parts[1] if len(name_parts) > 1 else payer_first)

    payer: dict = {
        "email": settings.MP_TEST_PAYER_EMAIL,
        "first_name": payer_first,
        "last_name": payer_last,
    }
    # CPF do pagador — melhora aprovação e reduz rejeições por antifraude
    if payload.payer_cpf:
        cpf_digits = payload.payer_cpf.replace(".", "").replace("-", "").strip()
        payer["identification"] = {"type": "CPF", "number": cpf_digits}

    mp_request = {
        # Campos obrigatórios do checklist de qualidade MP
        "transaction_amount": float(gift.price),
        "token": payload.card_token,
        "description": f"Presente: {gift.title}",
        "statement_descriptor": settings.MP_STATEMENT_DESCRIPTOR,
        "installments": payload.installments or 1,
        "payment_method_id": payload.payment_method_id,
        "capture": True,
        # binary_mode: aprovação instantânea (boa prática MP para presentes de casamento)
        "binary_mode": True,
        "notification_url": f"{settings.MP_BACK_URL}/api/payments/webhook",
        "external_reference": str(gift.id),
        "payer": payer,
        # Campos do item — melhoram score antifraude e exibição no painel MP
        "additional_info": {
            "items": [
                {
                    "id": str(gift.id),
                    "title": gift.title,
                    "description": gift.title,
                    "category_id": "gift",
                    "quantity": 1,
                    "unit_price": float(gift.price),
                }
            ],
            "payer": {
                "first_name": payer_first,
                "last_name": payer_last,
            },
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
    user_msg = _status_detail_to_message(detail_msg, internal_status)

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

    # Se o cartão foi aprovado instantaneamente (binary_mode=True → aprovação imediata)
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
        user_message=user_msg,
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
    """
    Retorna o status interno do pagamento sem expor dados sensíveis.

    Reconciliação automática: se o pagamento está aprovado mas o presente
    ainda não foi fulfillado (gift_purchases ausente), executa _fulfill_gift.
    Isso cobre casos em que o webhook falhou, atrasou, ou o status foi
    alterado diretamente no banco (ex: ambiente de testes/mock).
    """
    payment = await db.get(Payment, payment_id)
    if payment is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Pagamento não encontrado.")

    # Reconciliação: approved sem gift_purchase → fulfilla agora
    if payment.status == PaymentStatus.APPROVED:
        existing_purchase = await db.scalar(
            select(GiftPurchase).where(GiftPurchase.gift_id == payment.gift_id)
        )
        if existing_purchase is None:
            gift = await db.get(Gift, payment.gift_id)
            if gift and not gift.purchased and gift.stock_limit > 0:
                await _fulfill_gift(gift, payment.buyer_name, payment.message, db)
                logger.info(
                    "Reconciliação: presente %s fulfillado via polling (payment %s)",
                    payment.gift_id,
                    payment_id,
                )

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
