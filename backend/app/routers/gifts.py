import uuid
import html

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.gift import Gift, GiftPurchase
from app.schemas.gift import GiftOut, GiftPurchaseIn, GiftPurchaseOut, SortOrder

router = APIRouter()


# ── GET /api/gifts ─────────────────────────────────────────────────────────────

@router.get("", response_model=list[GiftOut])
async def list_gifts(
    sort: SortOrder = Query("asc", description="Ordenação por preço: asc | desc"),
    category: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
) -> list[Gift]:
    """Lista todos os presentes, opcionalmente filtrados por categoria e ordenados por preço."""
    stmt = select(Gift)

    if category:
        stmt = stmt.where(Gift.category == category)

    if sort == "asc":
        stmt = stmt.order_by(Gift.price.asc())
    else:
        stmt = stmt.order_by(Gift.price.desc())

    result = await db.execute(stmt)
    return list(result.scalars().all())


# ── POST /api/gifts/purchase ───────────────────────────────────────────────────

@router.post("/purchase", response_model=GiftPurchaseOut, status_code=201)
async def purchase_gift(
    payload: GiftPurchaseIn,
    db: AsyncSession = Depends(get_db),
) -> GiftPurchase:
    """
    Registra a compra de um presente:
    1. Valida que o presente existe e ainda tem estoque
    2. Cria o registro em gift_purchases
    3. Decrementa stock_limit de forma atômica; marca purchased=True quando stock chega a 0
    """
    # 1. Busca e valida o presente
    gift = await db.get(Gift, payload.gift_id)
    if not gift:
        raise HTTPException(status_code=404, detail="Presente não encontrado")
    if gift.purchased or gift.stock_limit <= 0:
        raise HTTPException(status_code=409, detail="Presente já esgotado")

    # 2. Sanitiza inputs (sec-01: strip de tags HTML)
    safe_name = html.escape(payload.buyer_name.strip())
    safe_message = html.escape(payload.message.strip()) if payload.message else None

    # 3. Cria o registro de compra
    purchase = GiftPurchase(
        gift_id=payload.gift_id,
        buyer_name=safe_name,
        message=safe_message,
    )
    db.add(purchase)

    # 4. Decrementa stock atomicamente
    new_stock = max(gift.stock_limit - 1, 0)
    await db.execute(
        update(Gift)
        .where(Gift.id == payload.gift_id)
        .values(
            stock_limit=new_stock,
            purchased=(new_stock == 0),
        )
    )

    await db.flush()
    await db.refresh(purchase)
    return purchase
