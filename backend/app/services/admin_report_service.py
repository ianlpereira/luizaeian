"""
Consultas agregadas dos relatórios administrativos.

Três armadilhas do modelo de dados estão tratadas aqui:

1. `payments` é a única fonte de verdade financeira. `gift_purchases` não tem
   valor, e POST /api/gifts/purchase é público — pode gerar registro sem dinheiro
   por trás. Nunca calcular total como `gift.price * quantidade de compras`.

2. Uma linha de `gift_purchases` nasce do endpoint público OU de `_fulfill_gift`
   quando um pagamento é aprovado. As duas contagens se sobrepõem e por isso são
   devolvidas em campos separados — somá-las inflaria o número.

3. `Gift.purchases` e `Payment.gift` são `lazy="select"`: acessá-los dentro de uma
   request async levanta MissingGreenlet em tempo de execução. Por isso todo dado
   relacionado vem de join ou subquery explícita.
"""

from decimal import Decimal

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.gift import Gift, GiftPurchase
from app.models.payment import Payment
from app.models.rsvp import Rsvp
from app.schemas.admin import (
    AdminGiftRow,
    AdminGiftsOut,
    AdminPaymentRow,
    AdminPaymentsOut,
    AdminRsvpRow,
    AdminRsvpsOut,
    GiftSummary,
    PaymentSummary,
    RsvpSummary,
)

APPROVED = "approved"


def _to_float(value: Decimal | float | None) -> float:
    return float(value) if value is not None else 0.0


# ── RSVP ──────────────────────────────────────────────────────────────────────

async def get_rsvp_report(db: AsyncSession) -> AdminRsvpsOut:
    """
    Lista todas as confirmações, mais recentes primeiro.

    `total_guests` conta apenas as respostas confirmadas (titular + acompanhantes).
    Quem recusou não entra na contagem de convidados.
    """
    result = await db.execute(select(Rsvp).order_by(Rsvp.created_at.desc()))
    rsvps = list(result.scalars().all())

    items: list[AdminRsvpRow] = []
    confirmed = 0
    total_guests = 0
    companions_count = 0

    for rsvp in rsvps:
        companions = rsvp.companions or []
        headcount = 1 + len(companions)
        companions_count += len(companions)

        if rsvp.status == "confirmed":
            confirmed += 1
            total_guests += headcount

        items.append(
            AdminRsvpRow(
                id=rsvp.id,
                full_name=rsvp.full_name,
                email=rsvp.email,
                status=rsvp.status,
                companions=companions,
                companions_count=len(companions),
                headcount=headcount,
                created_at=rsvp.created_at,
            )
        )

    summary = RsvpSummary(
        total_responses=len(items),
        confirmed=confirmed,
        declined=len(items) - confirmed,
        total_guests=total_guests,
        companions_count=companions_count,
    )
    return AdminRsvpsOut(summary=summary, items=items)


# ── Presentes ─────────────────────────────────────────────────────────────────

def _gifts_statement() -> Select:
    """
    Presentes com as duas contagens correlacionadas, SEM filtrar `hidden`.

    A rota pública (routers/gifts.py) esconde `hidden == True`; o relatório
    administrativo precisa justamente enxergar esses itens.
    """
    purchases_count = (
        select(func.count(GiftPurchase.id))
        .where(GiftPurchase.gift_id == Gift.id)
        .correlate(Gift)
        .scalar_subquery()
    )
    approved_count = (
        select(func.count(Payment.id))
        .where(Payment.gift_id == Gift.id, Payment.status == APPROVED)
        .correlate(Gift)
        .scalar_subquery()
    )
    approved_amount = (
        select(func.coalesce(func.sum(Payment.amount), 0))
        .where(Payment.gift_id == Gift.id, Payment.status == APPROVED)
        .correlate(Gift)
        .scalar_subquery()
    )

    return select(
        Gift,
        purchases_count.label("purchase_records"),
        approved_count.label("approved_payments"),
        approved_amount.label("approved_amount"),
    ).order_by(Gift.title.asc())


async def get_gifts_report(db: AsyncSession) -> AdminGiftsOut:
    """Catálogo completo de presentes com compras e valores aprovados por item."""
    result = await db.execute(_gifts_statement())

    items: list[AdminGiftRow] = []
    hidden_gifts = 0
    gifts_with_purchases = 0
    purchase_records_total = 0

    for gift, purchase_records, approved_payments, approved_amount in result.all():
        if gift.hidden:
            hidden_gifts += 1
        if purchase_records or approved_payments:
            gifts_with_purchases += 1
        purchase_records_total += purchase_records

        items.append(
            AdminGiftRow(
                id=gift.id,
                title=gift.title,
                price=_to_float(gift.price),
                category=gift.category,
                image_url=gift.image_url,
                hidden=gift.hidden,
                purchase_records=purchase_records,
                approved_payments=approved_payments,
                approved_amount=_to_float(approved_amount),
                created_at=gift.created_at,
            )
        )

    summary = GiftSummary(
        total_gifts=len(items),
        visible_gifts=len(items) - hidden_gifts,
        hidden_gifts=hidden_gifts,
        gifts_with_purchases=gifts_with_purchases,
        purchase_records=purchase_records_total,
    )
    return AdminGiftsOut(summary=summary, items=items)


# ── Pagamentos ────────────────────────────────────────────────────────────────

async def get_payments_report(db: AsyncSession) -> AdminPaymentsOut:
    """Todas as tentativas de pagamento, mais recentes primeiro, com totais por status."""
    rows = await db.execute(
        select(Payment, Gift.title)
        .join(Gift, Payment.gift_id == Gift.id, isouter=True)
        .order_by(Payment.created_at.desc())
    )

    items = [
        AdminPaymentRow(
            id=payment.id,
            gift_id=payment.gift_id,
            gift_title=gift_title,
            mp_payment_id=payment.mp_payment_id,
            method=payment.method,
            status=payment.status,
            amount=_to_float(payment.amount),
            buyer_name=payment.buyer_name,
            message=payment.message,
            created_at=payment.created_at,
        )
        for payment, gift_title in rows.all()
    ]

    totals = await db.execute(
        select(
            Payment.status,
            func.count(Payment.id),
            func.coalesce(func.sum(Payment.amount), 0),
        ).group_by(Payment.status)
    )

    counts: dict[str, int] = {}
    approved_amount = 0.0
    for payment_status, count, amount in totals.all():
        counts[payment_status] = count
        if payment_status == APPROVED:
            approved_amount = _to_float(amount)

    total_count = sum(counts.values())
    approved_count = counts.get(APPROVED, 0)
    pending_count = counts.get("pending", 0)
    rejected_count = counts.get("rejected", 0)

    summary = PaymentSummary(
        approved_amount=approved_amount,
        approved_count=approved_count,
        pending_count=pending_count,
        rejected_count=rejected_count,
        other_count=total_count - approved_count - pending_count - rejected_count,
        total_count=total_count,
    )
    return AdminPaymentsOut(summary=summary, items=items)
