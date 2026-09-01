"""
Testes da escrita de convidados e do casamento com as confirmações.

Como em test_admin_guests.py: autorização e funções puras rodam sem banco; o
resto exige um PostgreSQL real e fica atrás do gate.

    RUN_DB_TESTS=1 pytest tests/test_admin_guest_writes.py
"""

import os
import uuid
from collections.abc import AsyncIterator

import pytest
from httpx import AsyncClient
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.core.database import _async_db_url
from app.core.text import normalize_name
from app.models.guest import Guest
from app.models.rsvp import Rsvp
from app.schemas.admin import AdminGuestCreateIn, AdminGuestUpdateIn
from app.services import admin_report_service, guest_service

requires_db = pytest.mark.skipif(
    os.getenv("RUN_DB_TESTS") != "1",
    reason="Precisa de um PostgreSQL acessível. Rode com RUN_DB_TESTS=1.",
)


# ── Normalização de nomes (sem banco) ─────────────────────────────────────────

def test_normalize_name_remove_acento_e_caixa() -> None:
    assert normalize_name("Antônio Gonçalves") == normalize_name("antonio goncalves")


def test_normalize_name_desescapa_entidade_html() -> None:
    """
    O caso que faz o casamento existir.

    routers/rsvp.py grava o nome com html.escape, enquanto o guest veio cru da
    planilha. Sem unescape, nenhum nome com apóstrofo casaria.
    """
    assert normalize_name("D&#x27;Ávila") == normalize_name("D'Ávila")
    assert normalize_name("Ana &amp; Bia") == normalize_name("Ana & Bia")


def test_normalize_name_colapsa_espacos() -> None:
    assert normalize_name("  Ana   Maria  ") == "ana maria"


# ── Autorização (sem banco) ───────────────────────────────────────────────────

async def test_escrita_de_convidado_exige_autenticacao(
    client: AsyncClient, admin_env: None
) -> None:
    guest_id = uuid.uuid4()

    assert (await client.post("/api/admin/guests", json={})).status_code == 401
    assert (await client.patch(f"/api/admin/guests/{guest_id}", json={})).status_code == 401
    assert (await client.delete(f"/api/admin/guests/{guest_id}")).status_code == 401
    assert (await client.get("/api/admin/guests/rsvp-matches")).status_code == 401


async def test_rsvp_matches_nao_e_lido_como_uuid(
    client: AsyncClient, admin_env: None
) -> None:
    """
    Se a rota fosse declarada depois de /guests/{guest_id}, o FastAPI tentaria
    converter "rsvp-matches" em UUID e devolveria 422 em vez de 401.
    """
    response = await client.get("/api/admin/guests/rsvp-matches")

    assert response.status_code == 401


# ── Com banco ─────────────────────────────────────────────────────────────────

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


def make_guest(name: str, sort_order: int, group_index: int, head: bool) -> Guest:
    return Guest(
        sort_order=sort_order,
        full_name=name,
        group_index=group_index,
        is_group_head=head,
        invite_type="physical" if head else "digital",
        side="bride",
        age_group="adult",
        attendance=None,
        save_the_date_status="sent",
        invite_sent_status="pending",
    )


@pytest.fixture
async def seed(db: AsyncSession) -> dict[str, Guest]:
    """
    Um grupo de três e um de um.

    Esvazia as tabelas antes porque os relatórios leem tudo — a lição de
    test_admin_guests.py. O DELETE vive na transação revertida.
    """
    await db.execute(delete(Guest))
    await db.execute(delete(Rsvp))

    ana = make_guest("Ana Souza", 1, 1, True)
    esposa = make_guest("Esposa", 2, 1, False)
    filho = make_guest("Bruno Souza", 3, 1, False)
    sozinho = make_guest("Carla Dias", 4, 2, True)
    db.add_all([ana, esposa, filho, sozinho])
    await db.flush()

    return {"ana": ana, "esposa": esposa, "filho": filho, "sozinho": sozinho}


@requires_db
async def test_grupo_e_derivado_e_nao_coluna(
    db: AsyncSession, seed: dict[str, Guest]
) -> None:
    report = await admin_report_service.get_guests_report(db)
    by_name = {row.full_name: row for row in report.items}

    assert by_name["Esposa"].group_label == "Ana Souza"
    assert by_name["Esposa"].group_size == 3
    assert by_name["Carla Dias"].group_size == 1


@requires_db
async def test_renomear_titular_muda_o_rotulo_do_grupo_inteiro(
    db: AsyncSession, seed: dict[str, Guest]
) -> None:
    """A prova de que o rótulo é derivado: nenhum irmão precisou ser atualizado."""
    await guest_service.update_guest(
        db, seed["ana"].id, AdminGuestUpdateIn(full_name="Ana Souza Neta")
    )

    report = await admin_report_service.get_guests_report(db)
    labels = {row.full_name: row.group_label for row in report.items}

    assert labels["Esposa"] == "Ana Souza Neta"
    assert labels["Bruno Souza"] == "Ana Souza Neta"


@requires_db
async def test_update_marca_edited_at(db: AsyncSession, seed: dict[str, Guest]) -> None:
    """É esse carimbo que a trava de import_guests.py consulta."""
    assert seed["ana"].edited_at is None

    guest = await guest_service.update_guest(
        db, seed["ana"].id, AdminGuestUpdateIn(invite_sent_status="sent")
    )

    assert guest.edited_at is not None


@requires_db
async def test_criar_em_grupo_existente_aumenta_o_tamanho(
    db: AsyncSession, seed: dict[str, Guest]
) -> None:
    await guest_service.create_guest(
        db,
        AdminGuestCreateIn(
            full_name="Filha", side="bride", invite_type="digital", group_index=1
        ),
    )

    report = await admin_report_service.get_guests_report(db)
    by_name = {row.full_name: row for row in report.items}

    assert by_name["Filha"].group_size == 4
    assert by_name["Filha"].group_label == "Ana Souza"
    assert by_name["Filha"].is_group_head is False
    # Os irmãos enxergam o novo tamanho sem terem sido tocados.
    assert by_name["Esposa"].group_size == 4


@requires_db
async def test_criar_sem_grupo_abre_grupo_novo(
    db: AsyncSession, seed: dict[str, Guest]
) -> None:
    guest = await guest_service.create_guest(
        db,
        AdminGuestCreateIn(
            full_name="Convidada Nova", side="groom", invite_type="physical", group_index=None
        ),
    )

    row = await admin_report_service.get_guest_row(db, guest.id)

    assert row.is_group_head is True
    assert row.group_size == 1
    assert row.group_label == "Convidada Nova"
    assert row.group_index == 3


@requires_db
async def test_criar_em_grupo_inexistente_da_404(
    db: AsyncSession, seed: dict[str, Guest]
) -> None:
    from fastapi import HTTPException

    with pytest.raises(HTTPException) as erro:
        await guest_service.create_guest(
            db,
            AdminGuestCreateIn(
                full_name="Ninguém", side="bride", invite_type="digital", group_index=999
            ),
        )

    assert erro.value.status_code == 404


@requires_db
async def test_remover_titular_promove_o_irmao_de_menor_sort_order(
    db: AsyncSession, seed: dict[str, Guest]
) -> None:
    await guest_service.delete_guest(db, seed["ana"].id)

    report = await admin_report_service.get_guests_report(db)
    by_name = {row.full_name: row for row in report.items}

    assert by_name["Esposa"].is_group_head is True
    assert by_name["Esposa"].group_label == "Esposa"
    assert by_name["Bruno Souza"].group_label == "Esposa"
    assert by_name["Esposa"].group_size == 2


@requires_db
async def test_remover_o_ultimo_do_grupo_nao_quebra_o_relatorio(
    db: AsyncSession, seed: dict[str, Guest]
) -> None:
    await guest_service.delete_guest(db, seed["sozinho"].id)

    report = await admin_report_service.get_guests_report(db)

    assert report.summary.total == 3
    assert report.summary.total_groups == 1


@requires_db
async def test_vinculo_de_rsvp_exige_o_par_completo(
    db: AsyncSession, seed: dict[str, Guest]
) -> None:
    from fastapi import HTTPException

    rsvp = Rsvp(
        full_name="Ana Souza",
        email=f"ana-{uuid.uuid4()}@teste.com",
        status="confirmed",
        companions=[{"name": "Esposa"}],
    )
    db.add(rsvp)
    await db.flush()

    # RSVP sem papel → 422
    with pytest.raises(HTTPException) as sem_papel:
        await guest_service.update_guest(
            db, seed["ana"].id, AdminGuestUpdateIn(rsvp_id=rsvp.id)
        )
    assert sem_papel.value.status_code == 422

    # RSVP inexistente → 404
    with pytest.raises(HTTPException) as inexistente:
        await guest_service.update_guest(
            db,
            seed["ana"].id,
            AdminGuestUpdateIn(rsvp_id=uuid.uuid4(), rsvp_role="primary"),
        )
    assert inexistente.value.status_code == 404

    # Par completo → grava
    guest = await guest_service.update_guest(
        db, seed["ana"].id, AdminGuestUpdateIn(rsvp_id=rsvp.id, rsvp_role="primary")
    )
    assert guest.rsvp_id == rsvp.id

    # E dá para desfazer enviando null explícito.
    guest = await guest_service.update_guest(
        db, seed["ana"].id, AdminGuestUpdateIn(rsvp_id=None, rsvp_role=None)
    )
    assert guest.rsvp_id is None


@requires_db
async def test_casamento_classifica_titular_acompanhante_e_ambiguo(
    db: AsyncSession, seed: dict[str, Guest]
) -> None:
    # Segunda "Esposa", em outro grupo: torna esse nome ambíguo.
    db.add(make_guest("Esposa", 5, 2, False))
    db.add(
        Rsvp(
            full_name="Ana Souza",
            email=f"ana-{uuid.uuid4()}@teste.com",
            status="confirmed",
            companions=[{"name": "Esposa"}, {"name": "Pessoa Fora Da Lista"}],
        )
    )
    await db.flush()

    matches = await guest_service.get_rsvp_matches(db)
    by_name = {entry.entry_name: entry for entry in matches.items}

    assert by_name["Ana Souza"].entry_role == "primary"
    assert by_name["Ana Souza"].state == "unique_match"

    assert by_name["Esposa"].entry_role == "companion"
    assert by_name["Esposa"].state == "ambiguous"
    assert len(by_name["Esposa"].candidates) == 2

    assert by_name["Pessoa Fora Da Lista"].state == "no_match"
    assert by_name["Pessoa Fora Da Lista"].candidates == []

    assert matches.summary.entries_total == 3


@requires_db
async def test_casamento_marca_vinculo_ja_existente(
    db: AsyncSession, seed: dict[str, Guest]
) -> None:
    rsvp = Rsvp(
        full_name="Ana Souza",
        email=f"ana-{uuid.uuid4()}@teste.com",
        status="confirmed",
        companions=[],
    )
    db.add(rsvp)
    await db.flush()

    await guest_service.update_guest(
        db, seed["ana"].id, AdminGuestUpdateIn(rsvp_id=rsvp.id, rsvp_role="primary")
    )

    matches = await guest_service.get_rsvp_matches(db)
    entry = next(e for e in matches.items if e.entry_name == "Ana Souza")

    assert entry.state == "linked"
    assert entry.linked_guest_id == seed["ana"].id
    assert matches.summary.linked == 1


@requires_db
async def test_relatorio_conta_vinculos_e_rsvps_orfaos(
    db: AsyncSession, seed: dict[str, Guest]
) -> None:
    vinculado = Rsvp(
        full_name="Ana Souza",
        email=f"a-{uuid.uuid4()}@teste.com",
        status="confirmed",
        companions=[],
    )
    orfao = Rsvp(
        full_name="Alguem De Fora",
        email=f"b-{uuid.uuid4()}@teste.com",
        status="confirmed",
        companions=[],
    )
    db.add_all([vinculado, orfao])
    await db.flush()

    await guest_service.update_guest(
        db, seed["ana"].id, AdminGuestUpdateIn(rsvp_id=vinculado.id, rsvp_role="primary")
    )

    summary = (await admin_report_service.get_guests_report(db)).summary

    assert summary.linked_to_rsvp == 1
    assert summary.rsvps_without_guest == 1
