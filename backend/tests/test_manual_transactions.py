"""
Testes dos lançamentos manuais — dinheiro que entrou fora do Mercado Pago.

Precisam de um PostgreSQL real, como os demais testes de banco:

    RUN_DB_TESTS=1 pytest tests/test_manual_transactions.py

Cada teste roda dentro da transação revertida pela fixture `db` do conftest.
"""

import os
import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.gift import Gift, GiftPurchase
from app.models.guest import Guest
from app.models.payment import Payment
from app.schemas.admin import AdminManualTransactionIn
from app.services import admin_report_service, manual_transaction_service

requires_db = pytest.mark.skipif(
    os.getenv("RUN_DB_TESTS") != "1",
    reason="Precisa de um PostgreSQL acessível. Rode com RUN_DB_TESTS=1.",
)


def _payload(**overrides: object) -> AdminManualTransactionIn:
    base: dict[str, object] = {
        "buyer_name": "Tia Marta",
        "amount": 500.0,
        "method": "bank_transfer",
        "created_at": datetime.now(UTC),
    }
    base.update(overrides)
    return AdminManualTransactionIn(**base)  # type: ignore[arg-type]


# ── Validação (sem banco) ─────────────────────────────────────────────────────

@pytest.mark.parametrize("amount", [0, -1, -0.01])
async def test_valor_precisa_ser_positivo(amount: float) -> None:
    with pytest.raises(ValidationError):
        _payload(amount=amount)


async def test_nome_em_branco_e_recusado() -> None:
    with pytest.raises(ValidationError):
        _payload(buyer_name="   ")


async def test_metodo_do_mercado_pago_nao_e_lancamento_manual() -> None:
    """`pix` só nasce do gateway — aceitar aqui misturaria as duas origens."""
    with pytest.raises(ValidationError):
        _payload(method="pix")


# ── Criação (com banco) ───────────────────────────────────────────────────────

@requires_db
async def test_lancamento_sem_presente_vira_uma_linha_aprovada(db: AsyncSession) -> None:
    purchase = await manual_transaction_service.create_manual_transaction(
        db, _payload(amount=500.0)
    )
    row = await admin_report_service.get_gift_ledger_row(db, purchase.id)

    assert row.is_manual is True
    assert row.status == "approved"
    assert row.amount == 500.0
    assert row.method == "bank_transfer"
    assert row.gift_id is None
    assert row.gift_title is None
    assert row.mp_payment_id is None
    assert row.purchase_id is not None
    assert row.payment_id is not None


@requires_db
async def test_lancamento_com_presente_e_convidado(db: AsyncSession) -> None:
    gift = Gift(title="Liquidificador", price=Decimal("180.00"), category="Casa")
    guest = Guest(
        full_name="Marta Souza", sort_order=1, group_index=1, is_group_head=True,
        invite_type="digital", side="bride", age_group="adult", invite_sent_status="pending",
    )
    db.add_all([gift, guest])
    await db.flush()

    purchase = await manual_transaction_service.create_manual_transaction(
        db, _payload(method="camicado", amount=180.0, gift_id=gift.id, guest_id=guest.id)
    )
    row = await admin_report_service.get_gift_ledger_row(db, purchase.id)

    assert row.gift_id == gift.id
    assert row.gift_title == "Liquidificador"
    assert row.guest_id == guest.id
    assert row.guest_full_name == "Marta Souza"
    assert row.method == "camicado"


@requires_db
async def test_presente_inexistente_e_recusado(db: AsyncSession) -> None:
    with pytest.raises(HTTPException) as exc:
        await manual_transaction_service.create_manual_transaction(
            db, _payload(gift_id=uuid.uuid4())
        )
    assert exc.value.status_code == 404


@requires_db
async def test_data_informada_manda_na_ordenacao(db: AsyncSession) -> None:
    """Uma transferência de semana passada precisa cair no lugar dela, não no topo."""
    antiga = datetime.now(UTC) - timedelta(days=7)
    await manual_transaction_service.create_manual_transaction(
        db, _payload(buyer_name="Lançamento antigo", created_at=antiga)
    )
    await manual_transaction_service.create_manual_transaction(
        db, _payload(buyer_name="Lançamento de hoje")
    )

    report = await admin_report_service.get_gift_ledger_report(db)
    nomes = [row.buyer_name for row in report.items]

    assert nomes.index("Lançamento de hoje") < nomes.index("Lançamento antigo")


@requires_db
async def test_valor_manual_entra_no_total_aprovado(db: AsyncSession) -> None:
    antes = (await admin_report_service.get_gift_ledger_report(db)).summary.approved_amount

    await manual_transaction_service.create_manual_transaction(db, _payload(amount=500.0))

    depois = (await admin_report_service.get_gift_ledger_report(db)).summary.approved_amount
    assert depois == antes + 500.0


# ── Edição e remoção ──────────────────────────────────────────────────────────

@requires_db
async def test_edicao_troca_o_valor(db: AsyncSession) -> None:
    purchase = await manual_transaction_service.create_manual_transaction(
        db, _payload(amount=500.0)
    )

    await manual_transaction_service.update_manual_transaction(
        db, purchase.id, _payload(amount=650.0, method="cash")
    )
    row = await admin_report_service.get_gift_ledger_row(db, purchase.id)

    assert row.amount == 650.0
    assert row.method == "cash"


@requires_db
async def test_remocao_apaga_compra_e_pagamento(db: AsyncSession) -> None:
    purchase = await manual_transaction_service.create_manual_transaction(db, _payload())
    purchase_id, payment_id = purchase.id, purchase.payment_id

    await manual_transaction_service.delete_manual_transaction(db, purchase_id)

    assert await db.get(GiftPurchase, purchase_id) is None
    assert await db.get(Payment, payment_id) is None


@requires_db
async def test_linha_do_mercado_pago_nao_pode_ser_editada(db: AsyncSession) -> None:
    """A trava que protege o espelho do sistema externo."""
    gift = Gift(title="Jantar", price=Decimal("200.00"), category="Experiências")
    db.add(gift)
    await db.flush()

    payment = Payment(
        gift_id=gift.id, mp_payment_id=777001, method="pix", status="approved",
        amount=Decimal("200.00"), buyer_name="Convidado",
    )
    db.add(payment)
    await db.flush()
    purchase = GiftPurchase(
        gift_id=gift.id, buyer_name="Convidado", message=None, payment_id=payment.id
    )
    db.add(purchase)
    await db.flush()

    with pytest.raises(HTTPException) as exc:
        await manual_transaction_service.update_manual_transaction(db, purchase.id, _payload())
    assert exc.value.status_code == 422

    with pytest.raises(HTTPException) as exc:
        await manual_transaction_service.delete_manual_transaction(db, purchase.id)
    assert exc.value.status_code == 422

    assert await db.get(GiftPurchase, purchase.id) is not None
    assert await db.get(Payment, payment.id) is not None


@requires_db
async def test_compra_do_endpoint_publico_tambem_nao_e_editavel(db: AsyncSession) -> None:
    """Sem pagamento atrás não há valor a corrigir — o vínculo tem a conciliação."""
    gift = Gift(title="Toalhas", price=Decimal("90.00"), category="Casa")
    db.add(gift)
    await db.flush()
    purchase = GiftPurchase(gift_id=gift.id, buyer_name="Anônimo", message=None)
    db.add(purchase)
    await db.flush()

    with pytest.raises(HTTPException) as exc:
        await manual_transaction_service.delete_manual_transaction(db, purchase.id)
    assert exc.value.status_code == 422


# ── SET NULL no lugar de CASCADE ──────────────────────────────────────────────

@requires_db
async def test_apagar_presente_preserva_o_dinheiro(db: AsyncSession) -> None:
    """Antes o CASCADE apagava o pagamento junto, sumindo com o valor recebido."""
    gift = Gift(title="Passeio", price=Decimal("800.00"), category="Viagem")
    db.add(gift)
    await db.flush()

    purchase = await manual_transaction_service.create_manual_transaction(
        db, _payload(amount=800.0, gift_id=gift.id)
    )
    purchase_id, payment_id = purchase.id, purchase.payment_id

    await db.delete(gift)
    await db.flush()
    db.expire_all()

    sobrevivente = await db.get(Payment, payment_id)
    assert sobrevivente is not None
    assert sobrevivente.gift_id is None
    assert sobrevivente.amount == Decimal("800.00")

    orfa = await db.scalar(select(GiftPurchase).where(GiftPurchase.id == purchase_id))
    assert orfa is not None
    assert orfa.gift_id is None
