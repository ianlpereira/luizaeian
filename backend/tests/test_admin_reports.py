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
from decimal import Decimal

import pytest
from httpx import AsyncClient
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.gift import Gift, GiftPurchase
from app.models.payment import Payment
from app.models.rsvp import Rsvp
from app.services import admin_report_service

requires_db = pytest.mark.skipif(
    os.getenv("RUN_DB_TESTS") != "1",
    reason="Precisa de um PostgreSQL acessível. Rode com RUN_DB_TESTS=1.",
)


# ── Autorização (sem banco) ───────────────────────────────────────────────────

@pytest.mark.parametrize(
    "path",
    [
        "/api/admin/rsvps",
        "/api/admin/gifts",
        "/api/admin/gift-ledger",
        "/api/admin/gift-purchases/matches",
    ],
)
async def test_relatorios_exigem_autenticacao(
    client: AsyncClient, admin_env: None, path: str
) -> None:
    assert (await client.get(path)).status_code == 401


# ── Agregação (com banco) ─────────────────────────────────────────────────────
#
# A fixture `db` vive no conftest.py: o teste de fulfillment também precisa dela.

@pytest.fixture
async def seed(db: AsyncSession) -> dict[str, uuid.UUID]:
    """
    Cenário mínimo que cobre as armadilhas do modelo: presente oculto, presente
    com compra manual (sem pagamento) e compra vinda de pagamento aprovado, mais
    pagamentos pendente/recusado que não podem entrar no total nem virar compra.

    Esvazia `rsvp` antes: o relatório soma a tabela inteira, então qualquer
    confirmação já existente no banco de desenvolvimento entraria na conta e
    quebraria `total_guests`. O DELETE vive na transação revertida pela fixture
    `db`, então nada é perdido de verdade.
    """
    await db.execute(delete(Rsvp))

    visivel = Gift(title="Jogo de panelas", price=Decimal("300.00"), category="Itens de Casa")
    oculto = Gift(title="Rascunho", price=Decimal("10.00"), category="Itens de Casa", hidden=True)
    viagem = Gift(title="Passeio em Kyoto", price=Decimal("800.00"), category="Viagem")
    db.add_all([visivel, oculto, viagem])
    await db.flush()

    pix_aprovado = Payment(
        gift_id=visivel.id, method="pix", status="approved",
        amount=Decimal("300.00"), buyer_name="Vinda do pagamento",
    )
    cartao_aprovado = Payment(
        gift_id=viagem.id, method="credit_card", status="approved",
        amount=Decimal("800.00"), buyer_name="Cartão aprovado",
    )
    db.add_all(
        [
            pix_aprovado,
            cartao_aprovado,
            Payment(
                gift_id=visivel.id, method="pix", status="pending",
                amount=Decimal("300.00"), buyer_name="Ainda não pagou",
            ),
            Payment(
                gift_id=viagem.id, method="credit_card", status="rejected",
                amount=Decimal("800.00"), buyer_name="Cartão recusado",
            ),
        ]
    )
    # Flush antes das compras: payment_id só existe depois que o id é gerado.
    await db.flush()

    # `visivel` tem os dois tipos de registro ao mesmo tempo — é aqui que a
    # contagem dobraria se os campos fossem somados.
    db.add_all(
        [
            GiftPurchase(gift_id=visivel.id, buyer_name="Compra manual", message=None),
            GiftPurchase(
                gift_id=visivel.id, buyer_name="Vinda do pagamento", message=None,
                payment_id=pix_aprovado.id,
            ),
            GiftPurchase(
                gift_id=viagem.id, buyer_name="Cartão aprovado", message=None,
                payment_id=cartao_aprovado.id,
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
    report = await admin_report_service.get_gift_ledger_report(db)

    assert report.summary.approved_amount == 1100.00  # 300 + 800
    assert report.summary.approved_count == 2
    assert report.summary.pending_count == 1
    assert report.summary.rejected_count == 1
    assert report.summary.total_payments == 4
    # A compra manual não tem dinheiro por trás e não pode entrar em nada acima.
    assert report.summary.purchases_total == 3


@requires_db
async def test_ledger_traz_o_titulo_do_presente(
    db: AsyncSession, seed: dict[str, uuid.UUID]
) -> None:
    """O título vem de join explícito — acessar Payment.gift levantaria MissingGreenlet."""
    report = await admin_report_service.get_gift_ledger_report(db)
    titulos = {row.gift_title for row in report.items}

    assert "Jogo de panelas" in titulos
    assert "Passeio em Kyoto" in titulos


@requires_db
async def test_pagamento_aprovado_aparece_uma_vez_so(
    db: AsyncSession, seed: dict[str, uuid.UUID]
) -> None:
    """
    O motivo de existir a tela unificada: antes o mesmo evento saía na aba de
    pagamentos e na de compras.
    """
    report = await admin_report_service.get_gift_ledger_report(db)
    linhas = [row for row in report.items if row.buyer_name == "Vinda do pagamento"]

    assert len(linhas) == 1
    linha = linhas[0]
    assert linha.purchase_id is not None
    assert linha.payment_id is not None
    assert linha.status == "approved"
    assert linha.amount == 300.00
    assert linha.method == "pix"
    assert linha.key.startswith("c:")


@requires_db
async def test_compra_sem_pagamento_nao_tem_valor(
    db: AsyncSession, seed: dict[str, uuid.UUID]
) -> None:
    """Linha do endpoint público: existe na lista, mas sem dinheiro atrás."""
    report = await admin_report_service.get_gift_ledger_report(db)
    linha = next(row for row in report.items if row.buyer_name == "Compra manual")

    assert linha.status == "no_payment"
    assert linha.amount is None
    assert linha.method is None
    assert linha.payment_id is None
    assert linha.purchase_id is not None


@requires_db
async def test_pagamento_sem_compra_continua_na_lista(
    db: AsyncSession, seed: dict[str, uuid.UUID]
) -> None:
    """Pendente e recusado nunca viram compra, mas o painel precisa vê-los."""
    report = await admin_report_service.get_gift_ledger_report(db)

    pendente = next(row for row in report.items if row.buyer_name == "Ainda não pagou")
    assert pendente.status == "pending"
    assert pendente.purchase_id is None
    # Sem compra não há o que vincular a um convidado.
    assert pendente.guest_id is None
    assert pendente.key.startswith("p:")

    recusado = next(row for row in report.items if row.buyer_name == "Cartão recusado")
    assert recusado.status == "rejected"
    assert recusado.purchase_id is None


@requires_db
async def test_ledger_ordena_do_mais_recente_para_o_mais_antigo(
    db: AsyncSession, seed: dict[str, uuid.UUID]
) -> None:
    """As linhas vêm de duas consultas separadas: a ordem é feita depois, em Python."""
    report = await admin_report_service.get_gift_ledger_report(db)
    datas = [row.created_at for row in report.items]

    assert datas == sorted(datas, reverse=True)


@requires_db
async def test_chaves_das_linhas_sao_unicas(
    db: AsyncSession, seed: dict[str, uuid.UUID]
) -> None:
    """`key` é o rowKey da tabela: chave repetida quebraria a renderização."""
    report = await admin_report_service.get_gift_ledger_report(db)
    chaves = [row.key for row in report.items]

    assert len(chaves) == len(set(chaves))
