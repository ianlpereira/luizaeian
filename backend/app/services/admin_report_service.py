"""
Consultas agregadas dos relatórios administrativos.

Três armadilhas do modelo de dados estão tratadas aqui:

1. `payments` é a única fonte de verdade financeira. `gift_purchases` não tem
   valor, e POST /api/gifts/purchase é público — pode gerar registro sem dinheiro
   por trás. Nunca calcular total como `gift.price * quantidade de compras`.

2. Uma linha de `gift_purchases` nasce do endpoint público OU de `_fulfill_gift`
   quando um pagamento é aprovado. Quem diz qual é qual é a FK
   `gift_purchases.payment_id`: NULL = veio do endpoint público. O relatório
   unificado usa essa FK para não listar o mesmo evento duas vezes.

3. `Gift.purchases` e `Payment.gift` são `lazy="select"`: acessá-los dentro de uma
   request async levanta MissingGreenlet em tempo de execução. Por isso todo dado
   relacionado vem de join ou subquery explícita.
"""

import uuid
from decimal import Decimal
from typing import cast

from fastapi import HTTPException, status
from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.gift import Gift, GiftPurchase
from app.models.guest import Guest
from app.models.payment import Payment
from app.models.rsvp import Rsvp
from app.schemas.admin import (
    AdminGiftLedgerOut,
    AdminGiftLedgerRow,
    AdminGiftPurchaseRow,
    AdminGiftRow,
    AdminGiftsOut,
    AdminGuestRow,
    AdminGuestsOut,
    AdminRsvpRow,
    AdminRsvpsOut,
    GiftLedgerSummary,
    GiftSummary,
    GuestSummary,
    LedgerStatusLiteral,
    RsvpSummary,
)
from app.schemas.payment import MANUAL_METHODS, LedgerMethod

APPROVED = "approved"

# Forma da consulta que alimenta as linhas de compra do relatório unificado.
LedgerPurchaseStmt = Select[tuple[GiftPurchase, str | None, str | None, Payment | None]]


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


# ── Compras e pagamentos (relatório unificado) ────────────────────────────────

def _ledger_purchases_stmt() -> LedgerPurchaseStmt:
    stmt = (
        select(GiftPurchase, Gift.title, Guest.full_name, Payment)
        # isouter também no Gift: uma compra de presente apagado ainda é
        # histórico financeiro e não pode sumir do relatório.
        .join(Gift, GiftPurchase.gift_id == Gift.id, isouter=True)
        .outerjoin(Guest, GiftPurchase.guest_id == Guest.id)
        .outerjoin(Payment, GiftPurchase.payment_id == Payment.id)
    )
    # O tipo do select não acompanha os outer joins: para o SQLAlchemy as três
    # colunas continuam não-nulas. Em tempo de execução elas vêm nulas sempre
    # que o join não casa, e é essa a forma que o resto da função trata.
    return cast(LedgerPurchaseStmt, stmt)


def _ledger_purchase_row(
    purchase: GiftPurchase,
    gift_title: str | None,
    guest_full_name: str | None,
    payment: Payment | None,
) -> AdminGiftLedgerRow:
    return AdminGiftLedgerRow(
        key=f"c:{purchase.id}",
        purchase_id=purchase.id,
        payment_id=payment.id if payment else None,
        gift_id=purchase.gift_id,
        gift_title=gift_title,
        buyer_name=purchase.buyer_name,
        message=purchase.message,
        # As colunas são String simples no banco; quem garante os valores é o
        # código que escreve. Mesma situação de payment_service.
        status=cast(LedgerStatusLiteral, payment.status) if payment else "no_payment",
        method=cast(LedgerMethod, payment.method) if payment else None,
        amount=_to_float(payment.amount) if payment else None,
        mp_payment_id=payment.mp_payment_id if payment else None,
        guest_id=purchase.guest_id,
        guest_full_name=guest_full_name,
        created_at=purchase.created_at,
        is_manual=payment is not None and payment.method in MANUAL_METHODS,
    )


async def get_gift_ledger_row(db: AsyncSession, purchase_id: uuid.UUID) -> AdminGiftLedgerRow:
    """Uma linha só, no formato da listagem — devolvida pelos writes de lançamento."""
    row = (
        await db.execute(_ledger_purchases_stmt().where(GiftPurchase.id == purchase_id))
    ).first()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lançamento não encontrado."
        )

    purchase, gift_title, guest_full_name, payment = row
    return _ledger_purchase_row(purchase, gift_title, guest_full_name, payment)


def _ledger_orphan_row(payment: Payment, gift_title: str | None) -> AdminGiftLedgerRow:
    return AdminGiftLedgerRow(
        key=f"p:{payment.id}",
        purchase_id=None,
        payment_id=payment.id,
        gift_id=payment.gift_id,
        gift_title=gift_title,
        buyer_name=payment.buyer_name,
        message=payment.message,
        status=cast(LedgerStatusLiteral, payment.status),
        method=cast(LedgerMethod, payment.method),
        amount=_to_float(payment.amount),
        mp_payment_id=payment.mp_payment_id,
        guest_id=None,
        guest_full_name=None,
        created_at=payment.created_at,
        is_manual=payment.method in MANUAL_METHODS,
    )


async def get_gift_ledger_row_for_payment(
    db: AsyncSession, payment_id: uuid.UUID
) -> AdminGiftLedgerRow:
    """
    Uma linha pelo `payment_id` — usada depois de reconciliar com o Mercado
    Pago, quando a chave pode ter virado "c:<purchase_id>" no meio do caminho
    (reconciliação criou a compra) ou pode ter continuado órfã.
    """
    purchase = await db.scalar(
        select(GiftPurchase).where(GiftPurchase.payment_id == payment_id)
    )
    if purchase is not None:
        return await get_gift_ledger_row(db, purchase.id)

    row = (
        await db.execute(
            select(Payment, Gift.title)
            .join(Gift, Payment.gift_id == Gift.id, isouter=True)
            .where(Payment.id == payment_id)
        )
    ).first()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Pagamento não encontrado."
        )
    payment, gift_title = row
    return _ledger_orphan_row(payment, gift_title)


async def get_gift_ledger_report(db: AsyncSession) -> AdminGiftLedgerOut:
    """
    Uma linha por transação, mais recentes primeiro.

    Três formatos de linha, todos no mesmo schema:

    - compra com pagamento (`payment_id` preenchido) — o caso normal de um
      pagamento aprovado: dinheiro e vínculo com convidado na mesma linha;
    - compra sem pagamento — veio do endpoint público, status `no_payment`,
      campos financeiros nulos;
    - pagamento que nunca virou compra — pendente, recusado, expirado: sem
      `purchase_id`, e por isso sem vínculo possível com um convidado.

    Antes essas linhas viviam em duas telas ("Pagamentos" e "Compras") e um
    pagamento aprovado aparecia nas duas, sem nada dizendo que era o mesmo
    evento.
    """
    purchase_rows = (await db.execute(_ledger_purchases_stmt())).all()

    orphan_rows = (
        await db.execute(
            select(Payment, Gift.title)
            .join(Gift, Payment.gift_id == Gift.id, isouter=True)
            .where(
                ~select(GiftPurchase.id)
                .where(GiftPurchase.payment_id == Payment.id)
                .exists()
            )
        )
    ).all()

    items = [
        _ledger_purchase_row(purchase, gift_title, guest_full_name, payment)
        for purchase, gift_title, guest_full_name, payment in purchase_rows
    ] + [_ledger_orphan_row(payment, gift_title) for payment, gift_title in orphan_rows]
    items.sort(key=lambda row: row.created_at, reverse=True)

    # Financeiro direto de `payments`, sem passar pelas linhas acima: assim uma
    # compra "no_payment" nunca entra na conta.
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

    total_payments = sum(counts.values())
    approved_count = counts.get(APPROVED, 0)
    pending_count = counts.get("pending", 0)
    rejected_count = counts.get("rejected", 0)

    linked = sum(1 for purchase, *_ in purchase_rows if purchase.guest_id is not None)

    summary = GiftLedgerSummary(
        approved_amount=approved_amount,
        approved_count=approved_count,
        pending_count=pending_count,
        rejected_count=rejected_count,
        other_count=total_payments - approved_count - pending_count - rejected_count,
        total_payments=total_payments,
        purchases_total=len(purchase_rows),
        linked=linked,
        unlinked=len(purchase_rows) - linked,
    )
    return AdminGiftLedgerOut(summary=summary, items=items)


# ── Compra de presente isolada (devolvida pelo PATCH de vínculo) ──────────────

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


async def get_gift_purchase_row(db: AsyncSession, purchase_id: uuid.UUID) -> AdminGiftPurchaseRow:
    """Uma compra só — devolvida pelo PATCH de vínculo, para atualizar a linha na tela."""
    row = (
        await db.execute(
            select(GiftPurchase, Gift.title, Guest.full_name)
            .join(Gift, GiftPurchase.gift_id == Gift.id, isouter=True)
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
