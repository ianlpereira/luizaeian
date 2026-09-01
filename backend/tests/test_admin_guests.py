"""
Testes do módulo de convidados.

A leitura da planilha é testada por funções puras, sem banco. Os testes de
agregação exigem um PostgreSQL real (o model usa `postgresql.UUID`) e ficam
atrás do mesmo gate de test_admin_reports.py:

    RUN_DB_TESTS=1 pytest tests/test_admin_guests.py
"""

import os
from collections.abc import AsyncIterator

import pytest
from httpx import AsyncClient
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.core.database import _async_db_url
from app.models.guest import Guest
from app.services import admin_report_service
from scripts.import_guests import GuestCsvError, assign_groups, parse_row

requires_db = pytest.mark.skipif(
    os.getenv("RUN_DB_TESTS") != "1",
    reason="Precisa de um PostgreSQL acessível. Rode com RUN_DB_TESTS=1.",
)


def csv_row(nome: str, convite: str = "", **overrides: str) -> dict[str, str]:
    """Linha da planilha com os valores mais comuns já preenchidos."""
    return {
        "Nome do convidado": nome,
        "Convite?": convite,
        "Origem": "Noiva",
        "Idade": "Adulto",
        "Comparecimento": "",
        "SVD - Status": "Enviado",
        "Convite Digital": "Pendente",
        **overrides,
    }


# ── Leitura da planilha (sem banco) ───────────────────────────────────────────

@pytest.mark.parametrize(
    ("marca", "esperado"),
    [("X", "physical"), ("D", "digital"), ("", "digital")],
)
def test_marca_do_convite_define_o_formato(marca: str, esperado: str) -> None:
    assert parse_row(csv_row("Ana", marca), 1)["invite_type"] == esperado


def test_valor_com_espaco_a_direita_e_aceito() -> None:
    """A planilha real tem células "Não " — sem strip elas virariam valor inválido."""
    row = parse_row(csv_row("Ana", "X", Comparecimento="Não "), 1)

    assert row["attendance"] == "declined"


def test_valor_desconhecido_aponta_a_linha_e_a_coluna() -> None:
    with pytest.raises(GuestCsvError) as erro:
        parse_row(csv_row("Ana", "X", Origem="Padrinho"), 7)

    assert "Linha 8" in str(erro.value)
    assert "Origem" in str(erro.value)


def test_linhas_em_branco_entram_no_grupo_do_titular() -> None:
    rows = assign_groups(
        [
            parse_row(csv_row("Sergio", "X"), 1),
            parse_row(csv_row("Esposa"), 2),
            parse_row(csv_row("Filho"), 3),
            parse_row(csv_row("Lorena", "D"), 4),
            parse_row(csv_row("Namorado"), 5),
        ]
    )

    assert [row["group_index"] for row in rows] == [1, 1, 1, 2, 2]
    assert [row["is_group_head"] for row in rows] == [True, False, False, True, False]
    # O rótulo e o tamanho do grupo não são gravados: saem derivados na leitura,
    # em get_guests_report. Ver test_admin_guest_writes.py.
    assert "group_label" not in rows[0]
    assert "group_size" not in rows[0]


def test_primeira_linha_sem_marca_e_erro() -> None:
    """Não há grupo anterior a que associá-la — melhor falhar do que inventar um."""
    with pytest.raises(GuestCsvError):
        assign_groups([parse_row(csv_row("Esposa"), 1)])


# ── Autorização (sem banco) ───────────────────────────────────────────────────

async def test_lista_de_convidados_exige_autenticacao(
    client: AsyncClient, admin_env: None
) -> None:
    assert (await client.get("/api/admin/guests")).status_code == 401


async def test_token_invalido_nao_abre_a_lista(client: AsyncClient, admin_env: None) -> None:
    response = await client.get(
        "/api/admin/guests", headers={"Authorization": "Bearer token-falso"}
    )

    assert response.status_code == 401


# ── Agregação (com banco) ─────────────────────────────────────────────────────

@pytest.fixture
async def db() -> AsyncIterator[AsyncSession]:
    """Sessão presa a uma transação revertida no fim — ver test_admin_reports.py."""
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
async def seed_guests(db: AsyncSession) -> None:
    """
    Um grupo de três e um de um, cobrindo os dois lados e os dois formatos.

    Esvazia a tabela antes: o relatório devolve a lista inteira, então convidados
    já importados no banco de desenvolvimento entrariam nos totais e quebrariam
    as contas. O DELETE vive dentro da transação revertida pela fixture `db`,
    então nada é perdido de verdade.
    """
    await db.execute(delete(Guest))

    rows = assign_groups(
        [
            parse_row(csv_row("Sergio", "X", Comparecimento="Não"), 1),
            parse_row(csv_row("Esposa", Comparecimento="Incerteza"), 2),
            parse_row(csv_row("Filho", **{"Convite Digital": "Enviado"}), 3),
            parse_row(csv_row("Gabriel", "D", Origem="Noivo"), 4),
        ]
    )
    db.add_all(Guest(**row) for row in rows)
    await db.flush()


@requires_db
async def test_totais_da_lista_de_convidados(db: AsyncSession, seed_guests: None) -> None:
    summary = (await admin_report_service.get_guests_report(db)).summary

    assert summary.total == 4
    assert summary.total_groups == 2
    assert summary.physical_invites == 1  # só o Sergio tem X
    assert summary.digital_invites == 3
    assert summary.bride_side == 3
    assert summary.groom_side == 1
    assert summary.invites_sent == 1
    assert summary.invites_pending == 3
    assert summary.declined == 1
    assert summary.uncertain == 1


@requires_db
async def test_lista_vem_na_ordem_da_planilha_com_o_grupo_resolvido(
    db: AsyncSession, seed_guests: None
) -> None:
    items = (await admin_report_service.get_guests_report(db)).items

    assert [row.full_name for row in items] == ["Sergio", "Esposa", "Filho", "Gabriel"]
    assert [row.group_label for row in items] == ["Sergio"] * 3 + ["Gabriel"]
    assert items[1].group_size == 3
    assert items[3].is_group_head is True
