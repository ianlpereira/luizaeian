"""
Testes das ações de pagamento do Mercado Pago no relatório unificado:
sincronizar com o MP e apagar pendente.

    RUN_DB_TESTS=1 pytest tests/test_gift_ledger_payments.py
"""

import os
from decimal import Decimal

import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.gift import Gift
from app.models.payment import Payment
from app.services import gift_ledger_service

requires_db = pytest.mark.skipif(
    os.getenv("RUN_DB_TESTS") != "1",
    reason="Precisa de um PostgreSQL acessível. Rode com RUN_DB_TESTS=1.",
)


async def _pix_payment(db: AsyncSession, *, status: str, mp_payment_id: int | None = 777001) -> Payment:
    gift = Gift(title="Jogo de panelas", price=Decimal("300.00"), category="Casa")
    db.add(gift)
    await db.flush()

    payment = Payment(
        gift_id=gift.id, mp_payment_id=mp_payment_id, method="pix", status=status,
        amount=Decimal("300.00"), buyer_name="Convidado",
    )
    db.add(payment)
    await db.flush()
    return payment


# ── Sincronizar (guardas, sem chamar o Mercado Pago de verdade) ───────────────

@requires_db
async def test_reconciliar_pagamento_manual_e_recusado(db: AsyncSession) -> None:
    """Lançamento manual não tem `mp_payment_id` — nada para sincronizar."""
    gift = Gift(title="Camicado", price=Decimal("100.00"), category="Casa")
    db.add(gift)
    await db.flush()
    payment = Payment(
        gift_id=gift.id, mp_payment_id=None, method="camicado", status="approved",
        amount=Decimal("100.00"), buyer_name="Tia Marta",
    )
    db.add(payment)
    await db.flush()

    with pytest.raises(HTTPException) as exc:
        await gift_ledger_service.reconcile_payment(db, payment.id)
    assert exc.value.status_code == 422


@requires_db
async def test_reconciliar_pagamento_inexistente_e_404(db: AsyncSession) -> None:
    import uuid

    with pytest.raises(HTTPException) as exc:
        await gift_ledger_service.reconcile_payment(db, uuid.uuid4())
    assert exc.value.status_code == 404


# ── Apagar pendente ────────────────────────────────────────────────────────────

@requires_db
async def test_apaga_pagamento_pix_pendente_orfao(db: AsyncSession) -> None:
    payment = await _pix_payment(db, status="pending")

    await gift_ledger_service.delete_orphan_payment(db, payment.id)

    assert await db.get(Payment, payment.id) is None


@requires_db
async def test_nao_apaga_pagamento_aprovado(db: AsyncSession) -> None:
    """Aprovado é fato consumado no Mercado Pago — apagar aqui não desfaz nada lá."""
    payment = await _pix_payment(db, status="approved")

    with pytest.raises(HTTPException) as exc:
        await gift_ledger_service.delete_orphan_payment(db, payment.id)
    assert exc.value.status_code == 422
    assert await db.get(Payment, payment.id) is not None


@requires_db
async def test_nao_apaga_pagamento_inexistente(db: AsyncSession) -> None:
    import uuid

    with pytest.raises(HTTPException) as exc:
        await gift_ledger_service.delete_orphan_payment(db, uuid.uuid4())
    assert exc.value.status_code == 404
