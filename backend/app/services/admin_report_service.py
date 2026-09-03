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

import uuid
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.gift import Gift, GiftPurchase
from app.models.guest import Guest
from app.models.payment import Payment
from app.models.rsvp import Rsvp
from app.schemas.admin import (
    AdminGiftPurchaseRow,
    AdminGiftPurchasesOut,
    AdminGiftRow,
    AdminGiftsOut,
    AdminGuestRow,
    AdminGuestsOut,
    AdminPaymentRow,
    AdminPaymentsOut,
    AdminRsvpRow,
    AdminRsvpsOut,
    GiftPurchaseSummary,
    GiftSummary,
    GuestSummary,
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


# ── Convidados ────────────────────────────────────────────────────────────────

# Campos de AdminGuestRow que são cópia direta da coluna. O resto (rótulo e
# tamanho do grupo, dados do RSVP) é derivado ou vem por join.
_GUEST_COLUMN_FIELDS = (
    "id",
    "sort_order",
    "full_name",
    "group_index",
    "is_group_head",
    "invite_type",
    "side",
    "age_group",
    "attendance",
    "save_the_date_status",
    "invite_sent_status",
    "rsvp_id",
    "rsvp_role",
    "edited_at",
)


def _guest_row(
    guest: Guest,
    group_label: str,
    group_size: int,
    rsvp_full_name: str | None,
    rsvp_email: str | None,
    rsvp_status: str | None,
) -> AdminGuestRow:
    return AdminGuestRow(
        **{field: getattr(guest, field) for field in _GUEST_COLUMN_FIELDS},
        group_label=group_label,
        group_size=group_size,
        rsvp_full_name=rsvp_full_name,
        rsvp_email=rsvp_email,
        rsvp_status=rsvp_status,
    )


async def get_guest_row(db: AsyncSession, guest_id: uuid.UUID) -> AdminGuestRow:
    """
    Um convidado só, no mesmo formato da listagem.

    É o que as rotas de escrita devolvem: o painel recebe a linha já com o grupo
    e o RSVP resolvidos, sem precisar recarregar a lista inteira para exibir o
    resultado do salvamento.
    """
    row = (
        await db.execute(
            select(Guest, Rsvp.full_name, Rsvp.email, Rsvp.status)
            .join(Rsvp, Guest.rsvp_id == Rsvp.id, isouter=True)
            .where(Guest.id == guest_id)
        )
    ).first()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Convidado não encontrado."
        )

    guest, rsvp_full_name, rsvp_email, rsvp_status = row

    group_size = await db.scalar(
        select(func.count(Guest.id)).where(Guest.group_index == guest.group_index)
    )
    head_name = await db.scalar(
        select(Guest.full_name).where(
            Guest.group_index == guest.group_index, Guest.is_group_head.is_(True)
        )
    )

    return _guest_row(
        guest,
        head_name or guest.full_name,
        group_size or 1,
        rsvp_full_name,
        rsvp_email,
        rsvp_status,
    )


async def get_guests_report(db: AsyncSession) -> AdminGuestsOut:
    """
    Lista de convidados, cada família junta e na ordem original.

    `group_label` e `group_size` não são colunas: são derivados aqui numa
    primeira passada. Guardá-los no banco obrigaria a atualizar todos os irmãos
    a cada renomeação ou remoção — ver o docstring de models/guest.py.

    O RSVP vinculado vem por outer join explícito, e não por relacionamento:
    acessar um `lazy="select"` dentro de uma request async levanta
    MissingGreenlet, como já documentado no topo deste módulo.

    Os totais são contados no mesmo laço em vez de por agregação no banco: são
    ~300 linhas que já foram trazidas para montar `items`, e uma segunda ida ao
    banco só para somá-las não se paga.
    """
    result = await db.execute(
        select(Guest, Rsvp.full_name, Rsvp.email, Rsvp.status)
        .join(Rsvp, Guest.rsvp_id == Rsvp.id, isouter=True)
        .order_by(
            Guest.group_index.asc(),
            Guest.is_group_head.desc(),
            Guest.sort_order.asc(),
        )
    )
    rows = result.all()

    # group_index -> (nome do titular, tamanho do grupo)
    group_labels: dict[int, str] = {}
    group_sizes: dict[int, int] = {}
    for guest, *_ in rows:
        group_sizes[guest.group_index] = group_sizes.get(guest.group_index, 0) + 1
        if guest.is_group_head:
            group_labels[guest.group_index] = guest.full_name

    items: list[AdminGuestRow] = []
    summary = GuestSummary(
        total=len(rows),
        total_groups=len(group_sizes),
        physical_invites=0,
        digital_invites=0,
        bride_side=0,
        groom_side=0,
        invites_sent=0,
        invites_pending=0,
        declined=0,
        uncertain=0,
        confirmed=0,
        linked_to_rsvp=0,
        rsvps_without_guest=0,
    )
    claimed_rsvps: set[uuid.UUID] = set()

    for guest, rsvp_full_name, rsvp_email, rsvp_status in rows:
        if guest.invite_type == "physical":
            summary.physical_invites += 1
        else:
            summary.digital_invites += 1
        if guest.side == "bride":
            summary.bride_side += 1
        else:
            summary.groom_side += 1
        if guest.invite_sent_status == "sent":
            summary.invites_sent += 1
        else:
            summary.invites_pending += 1
        if guest.attendance == "declined":
            summary.declined += 1
        elif guest.attendance == "uncertain":
            summary.uncertain += 1
        elif guest.attendance == "confirmed":
            summary.confirmed += 1
        if guest.rsvp_id is not None:
            summary.linked_to_rsvp += 1
            claimed_rsvps.add(guest.rsvp_id)

        items.append(
            _guest_row(
                guest,
                # Grupo sem titular não deveria acontecer; se acontecer, o
                # próprio nome é um rótulo melhor que uma string vazia.
                group_labels.get(guest.group_index, guest.full_name),
                group_sizes[guest.group_index],
                rsvp_full_name,
                rsvp_email,
                rsvp_status,
            )
        )

    total_rsvps = await db.scalar(select(func.count(Rsvp.id))) or 0
    summary.rsvps_without_guest = total_rsvps - len(claimed_rsvps)

    return AdminGuestsOut(summary=summary, items=items)


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


# ── Compras de presentes ───────────────────────────────────────────────────────

def _gift_purchase_row(
    purchase: GiftPurchase, gift_title: str | None, guest_full_name: str | None
) -> AdminGiftPurchaseRow:
    return AdminGiftPurchaseRow(
        id=purchase.id,
        gift_id=purchase.gift_id,
        gift_title=gift_title,
        buyer_name=purchase.buyer_name,
        message=purchase.message,
        guest_id=purchase.guest_id,
        guest_full_name=guest_full_name,
        created_at=purchase.created_at,
    )


async def get_gift_purchases_report(db: AsyncSession) -> AdminGiftPurchasesOut:
    """Todas as compras, mais recentes primeiro, com o presente e o convidado vinculado."""
    result = await db.execute(
        select(GiftPurchase, Gift.title, Guest.full_name)
        .join(Gift, GiftPurchase.gift_id == Gift.id)
        .outerjoin(Guest, GiftPurchase.guest_id == Guest.id)
        .order_by(GiftPurchase.created_at.desc())
    )
    rows = result.all()

    items = [
        _gift_purchase_row(purchase, gift_title, guest_full_name)
        for purchase, gift_title, guest_full_name in rows
    ]
    linked = sum(1 for purchase, *_ in rows if purchase.guest_id is not None)

    summary = GiftPurchaseSummary(
        total=len(items),
        linked=linked,
        unlinked=len(items) - linked,
    )
    return AdminGiftPurchasesOut(summary=summary, items=items)


async def get_gift_purchase_row(db: AsyncSession, purchase_id: uuid.UUID) -> AdminGiftPurchaseRow:
    """Uma compra só, no mesmo formato da listagem — devolvida pelo PATCH de vínculo."""
    row = (
        await db.execute(
            select(GiftPurchase, Gift.title, Guest.full_name)
            .join(Gift, GiftPurchase.gift_id == Gift.id)
            .outerjoin(Guest, GiftPurchase.guest_id == Guest.id)
            .where(GiftPurchase.id == purchase_id)
        )
    ).first()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Compra não encontrada."
        )

    purchase, gift_title, guest_full_name = row
    return _gift_purchase_row(purchase, gift_title, guest_full_name)
