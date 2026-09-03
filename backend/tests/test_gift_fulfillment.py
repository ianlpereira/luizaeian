"""
Testes da FK `gift_purchases.payment_id`.

É ela que permite a tela única de "Compras e pagamentos": sem esse vínculo o
mesmo evento aparecia duas vezes no painel e a única forma de casar os dois
lados era a trinca (gift_id, buyer_name, message), que colide quando duas
pessoas com o mesmo nome dão o mesmo presente com a mesma mensagem.

Precisa de um PostgreSQL real, igual aos testes de relatório:

    RUN_DB_TESTS=1 pytest tests/test_gift_fulfillment.py
"""

import os
from decimal import Decimal

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.gift import Gift, GiftPurchase
from app.models.payment import Payment
from app.services import payment_service

requires_db = pytest.mark.skipif(
    os.getenv("RUN_DB_TESTS") != "1",
    reason="Precisa de um PostgreSQL acessível. Rode com RUN_DB_TESTS=1.",
)


@requires_db
async def test_reconciliacao_vincula_a_compra_ao_pagamento(db: AsyncSession) -> None:
    """
    Pagamento aprovado sem compra: `get_payment_status` cria a compra e guarda o
    `payment_id`. O status já é approved, então não há consulta ao Mercado Pago.
    """
    gift = Gift(title="Chaleira", price=Decimal("120.00"), category="Itens de Casa")
    db.add(gift)
    await db.flush()

    payment = Payment(
        gift_id=gift.id,
        method="pix",
        status="approved",
        amount=Decimal("120.00"),
        buyer_name="Ana",
        message="Felicidades!",
    )
    db.add(payment)
    await db.flush()

    await payment_service.get_payment_status(payment.id, db)

    purchase = await db.scalar(
        select(GiftPurchase).where(GiftPurchase.payment_id == payment.id)
    )
    assert purchase is not None
    assert purchase.gift_id == gift.id
    assert purchase.buyer_name == "Ana"


@requires_db
async def test_reconciliacao_nao_duplica_compra_ja_vinculada(db: AsyncSession) -> None:
    """Rodar de novo não pode gerar uma segunda compra para o mesmo pagamento."""
    gift = Gift(title="Toalhas", price=Decimal("90.00"), category="Itens de Casa")
    db.add(gift)
    await db.flush()

    payment = Payment(
        gift_id=gift.id, method="pix", status="approved",
        amount=Decimal("90.00"), buyer_name="Bruno", message=None,
    )
    db.add(payment)
    await db.flush()

    await payment_service.get_payment_status(payment.id, db)
    await payment_service.get_payment_status(payment.id, db)

    purchases = (
        await db.execute(select(GiftPurchase).where(GiftPurchase.payment_id == payment.id))
    ).scalars().all()
    assert len(purchases) == 1


@requires_db
async def test_compradores_homonimos_geram_compras_separadas(db: AsyncSession) -> None:
    """
    A regressão que motivou a FK: com a trinca antiga, o segundo pagamento
    encontrava a compra do primeiro e não gerava a sua.
    """
    gift = Gift(title="Jantar", price=Decimal("200.00"), category="Experiências")
    db.add(gift)
    await db.flush()

    primeiro = Payment(
        gift_id=gift.id, method="pix", status="approved",
        amount=Decimal("200.00"), buyer_name="Ana Silva", message="Parabéns!",
    )
    segundo = Payment(
        gift_id=gift.id, method="pix", status="approved",
        amount=Decimal("200.00"), buyer_name="Ana Silva", message="Parabéns!",
    )
    db.add_all([primeiro, segundo])
    await db.flush()

    await payment_service.get_payment_status(primeiro.id, db)
    await payment_service.get_payment_status(segundo.id, db)

    vinculos = (
        await db.execute(
            select(GiftPurchase.payment_id).where(
                GiftPurchase.payment_id.in_([primeiro.id, segundo.id])
            )
        )
    ).scalars().all()
    assert set(vinculos) == {primeiro.id, segundo.id}
