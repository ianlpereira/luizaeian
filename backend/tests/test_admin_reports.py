"""
Testes dos relatórios administrativos.

Os testes de autorização não tocam no banco. Os de agregação exigem um
PostgreSQL real — os modelos usam `postgresql.UUID` e `JSONB`, então SQLite não
serve. Rode com:

    RUN_DB_TESTS=1 pytest tests/test_admin_reports.py

Cada teste de banco roda dentro de uma transação que é revertida no final, então
nada é gravado de verdade.
"""

import os
import uuid
from collections.abc import AsyncIterator
from decimal import Decimal

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.core.database import _async_db_url
from app.models.gift import Gift, GiftPurchase
from app.models.payment import Payment
from app.models.rsvp import Rsvp
from app.services import admin_report_service

requires_db = pytest.mark.skipif(
    os.getenv("RUN_DB_TESTS") != "1",
    reason="Precisa de um PostgreSQL acessível. Rode com RUN_DB_TESTS=1.",
)


# ── Autorização (sem banco) ───────────────────────────────────────────────────

@pytest.mark.parametrize("path", ["/api/admin/rsvps", "/api/admin/gifts", "/api/admin/payments"])
async def test_relatorios_exigem_autenticacao(
    client: AsyncClient, admin_env: None, path: str
) -> None:
    assert (await client.get(path)).status_code == 401


# ── Agregação (com banco) ─────────────────────────────────────────────────────

@pytest.fixture
async def db() -> AsyncIterator[AsyncSession]:
    """
    Sessão presa a uma transação externa, revertida ao fim do teste.

    Engine própria com NullPool: o pytest-asyncio cria um event loop por teste e
    o engine global de app.core.database guardaria conexões de um loop já
    fechado, quebrando o segundo teste em diante com "Event loop is closed".
    """
    test_engine = create_async_engine(_async_db_url(settings.DATABASE_URL), poolclass=NullPool)
    try:
        async with test_engine.connect() as connection:
            transaction = await connection.begin()
            session = AsyncSession(bind=connection, expire_on_commit=False)
            try:
                yield session
            finally:
                await session.close()
                await transaction.rollback()
    finally:
        await test_engine.dispose()


@pytest.fixture
async def seed(db: AsyncSession) -> dict[str, uuid.UUID]:
    """
    Cenário mínimo que cobre as três armadilhas do modelo:
    presente oculto, presente com compra manual + pagamento aprovado, e
    pagamentos pendente/recusado que não podem entrar no total.
    """
    visivel = Gift(title="Jogo de panelas", price=Decimal("300.00"), category="Itens de Casa")
    oculto = Gift(title="Rascunho", price=Decimal("10.00"), category="Itens de Casa", hidden=True)
    viagem = Gift(title="Passeio em Kyoto", price=Decimal("800.00"), category="Viagem")
    db.add_all([visivel, oculto, viagem])
    await db.flush()

    # `visivel` tem os dois tipos de registro ao mesmo tempo — é aqui que a
    # contagem dobraria se os campos fossem somados.
    db.add_all(
        [
            GiftPurchase(gift_id=visivel.id, buyer_name="Compra manual", message=None),
            GiftPurchase(gift_id=visivel.id, buyer_name="Vinda do pagamento", message=None),
            Payment(
                gift_id=visivel.id, method="pix", status="approved",
                amount=Decimal("300.00"), buyer_name="Vinda do pagamento",
            ),
            Payment(
                gift_id=visivel.id, method="pix", status="pending",
                amount=Decimal("300.00"), buyer_name="Ainda não pagou",
            ),
            Payment(
                gift_id=viagem.id, method="credit_card", status="rejected",
                amount=Decimal("800.00"), buyer_name="Cartão recusado",
            ),
            Payment(
                gift_id=viagem.id, method="credit_card", status="approved",
                amount=Decimal("800.00"), buyer_name="Cartão aprovado",
            ),
        ]
    )

    db.add_all(
        [
            Rsvp(
                full_name="Ana", email=f"ana-{uuid.uuid4()}@teste.com", status="confirmed",
                companions=[{"name": "Bruno"}, {"name": "Carla"}],
            ),
            Rsvp(
                full_name="Diego", email=f"diego-{uuid.uuid4()}@teste.com",
                status="confirmed", companions=[],
            ),
            Rsvp(
                full_name="Elisa", email=f"elisa-{uuid.uuid4()}@teste.com",
                status="declined", companions=[],
            ),
        ]
    )
    await db.flush()

    return {"visivel": visivel.id, "oculto": oculto.id, "viagem": viagem.id}


@requires_db
async def test_rsvp_conta_apenas_convidados_confirmados(
    db: AsyncSession, seed: dict[str, uuid.UUID]
) -> None:
    report = await admin_report_service.get_rsvp_report(db)

    # Ana + 2 acompanhantes + Diego = 4. Elisa recusou e não entra.
    assert report.summary.total_guests == 4
    assert report.summary.confirmed == 2
    assert report.summary.declined == 1
    assert report.summary.companions_count == 2

    ana = next(row for row in report.items if row.full_name == "Ana")
    assert ana.headcount == 3
    assert ana.companions_count == 2


@requires_db
async def test_relatorio_de_presentes_inclui_ocultos(
    db: AsyncSession, seed: dict[str, uuid.UUID]
) -> None:
    """A rota pública filtra `hidden`; o relatório administrativo não pode filtrar."""
    report = await admin_report_service.get_gifts_report(db)
    ids = {row.id for row in report.items}

    assert seed["oculto"] in ids
    assert report.summary.hidden_gifts >= 1

    oculto = next(row for row in report.items if row.id == seed["oculto"])
    assert oculto.hidden is True


@requires_db
async def test_compras_e_pagamentos_ficam_em_colunas_separadas(
    db: AsyncSession, seed: dict[str, uuid.UUID]
) -> None:
    report = await admin_report_service.get_gifts_report(db)
    visivel = next(row for row in report.items if row.id == seed["visivel"])

    assert visivel.purchase_records == 2
    assert visivel.approved_payments == 1
    # O valor vem só do pagamento aprovado — o pendente e as compras manuais não
    # acrescentam nada.
    assert visivel.approved_amount == 300.00


@requires_db
async def test_total_aprovado_ignora_pendentes_e_recusados(
    db: AsyncSession, seed: dict[str, uuid.UUID]
) -> None:
    report = await admin_report_service.get_payments_report(db)

    assert report.summary.approved_amount == 1100.00  # 300 + 800
    assert report.summary.approved_count == 2
    assert report.summary.pending_count == 1
    assert report.summary.rejected_count == 1
    assert report.summary.total_count == 4


@requires_db
async def test_pagamento_traz_o_titulo_do_presente(
    db: AsyncSession, seed: dict[str, uuid.UUID]
) -> None:
    """O título vem de join explícito — acessar Payment.gift levantaria MissingGreenlet."""
    report = await admin_report_service.get_payments_report(db)
    titulos = {row.gift_title for row in report.items}

    assert "Jogo de panelas" in titulos
    assert "Passeio em Kyoto" in titulos
