"""
Vínculo entre compras de presente e a lista de convidados.

Mesma postura de `guest_service.get_rsvp_matches`: sugere por nome normalizado,
nunca grava sozinho. `buyer_name` é só um nome digitado no formulário — duplicar
esse risco de nome repetido aqui seria o mesmo erro que aquele módulo já evita.
"""

import html
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.text import normalize_name
from app.models.gift import Gift, GiftPurchase
from app.models.guest import Guest
from app.schemas.admin import (
    AdminGiftPurchaseMatchEntry,
    AdminGiftPurchaseMatchesOut,
    AdminGiftPurchaseUpdateIn,
    GiftPurchaseMatchCandidate,
    GiftPurchaseMatchSummary,
)


async def update_gift_purchase(
    db: AsyncSession, purchase_id: uuid.UUID, payload: AdminGiftPurchaseUpdateIn
) -> GiftPurchase:
    purchase = await db.get(GiftPurchase, purchase_id)
    if purchase is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Compra não encontrada."
        )

    if payload.guest_id is not None and await db.get(Guest, payload.guest_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Convidado não encontrado."
        )

    purchase.guest_id = payload.guest_id
    db.add(purchase)
    await db.flush()
    return purchase


async def get_gift_purchase_matches(db: AsyncSession) -> AdminGiftPurchaseMatchesOut:
    """
    Sugere, para cada compra, quais convidados correspondem ao nome do comprador.

    Resolve em memória como `get_rsvp_matches`: poucas centenas de convidados e
    poucas dezenas de compras não pedem `unaccent` no Postgres.
    """
    guests = list(
        (await db.execute(select(Guest).order_by(Guest.sort_order.asc()))).scalars().all()
    )
    purchase_rows = (
        await db.execute(
            select(GiftPurchase, Gift.title)
            .join(Gift, GiftPurchase.gift_id == Gift.id)
            .order_by(GiftPurchase.created_at.asc())
        )
    ).all()

    by_name: dict[str, list[Guest]] = {}
    for guest in guests:
        by_name.setdefault(normalize_name(guest.full_name), []).append(guest)

    group_labels = {g.group_index: g.full_name for g in guests if g.is_group_head}

    items: list[AdminGiftPurchaseMatchEntry] = []
    summary = GiftPurchaseMatchSummary(
        purchases_total=len(purchase_rows),
        linked=0,
        unique_match=0,
        ambiguous=0,
        no_match=0,
    )

    for purchase, gift_title in purchase_rows:
        matches = by_name.get(normalize_name(purchase.buyer_name), [])

        if purchase.guest_id is not None:
            state = "linked"
            summary.linked += 1
        elif len(matches) == 1:
            state = "unique_match"
            summary.unique_match += 1
        elif len(matches) > 1:
            state = "ambiguous"
            summary.ambiguous += 1
        else:
            state = "no_match"
            summary.no_match += 1

        items.append(
            AdminGiftPurchaseMatchEntry(
                purchase_id=purchase.id,
                gift_id=purchase.gift_id,
                gift_title=gift_title,
                buyer_name=html.unescape(purchase.buyer_name),
                message=html.unescape(purchase.message) if purchase.message else None,
                created_at=purchase.created_at,
                state=state,
                linked_guest_id=purchase.guest_id,
                candidates=[
                    GiftPurchaseMatchCandidate(
                        guest_id=g.id,
                        full_name=g.full_name,
                        group_label=group_labels.get(g.group_index, g.full_name),
                    )
                    for g in matches
                ],
            )
        )

    return AdminGiftPurchaseMatchesOut(summary=summary, items=items)
