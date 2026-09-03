"""
Escrita da lista de convidados e casamento com as confirmações do site.

Fica separado de `admin_report_service`, que é só leitura agregada.

Duas decisões deste módulo que merecem registro:

1. **Os nomes são gravados crus, sem `html.escape`** — ao contrário de `rsvp`,
   `messages` e `gift_purchases`. As 307 linhas importadas da planilha estão
   cruas; escapar só as editadas criaria duas representações dentro da mesma
   tabela e quebraria tanto a busca por nome quanto o casamento com o RSVP. A
   defesa contra XSS aqui é o React, que escapa todo texto em JSX — o projeto
   não usa `dangerouslySetInnerHTML` em lugar nenhum.

2. **Nada é vinculado automaticamente.** `get_rsvp_matches` devolve sugestões;
   quem grava é o PATCH que o painel dispara quando alguém confirma. Nome
   repetido é real na lista ("Esposa" aparece 4 vezes, "Namorado" 3), então
   adivinhar produziria vínculo errado sem ninguém perceber.
"""

import html
import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.text import normalize_name
from app.models.guest import Guest
from app.models.rsvp import Rsvp
from app.schemas.admin import (
    AdminGuestCreateIn,
    AdminGuestUpdateIn,
    AdminRsvpMatchEntry,
    AdminRsvpMatchesOut,
    MatchState,
    RsvpMatchCandidate,
    RsvpMatchSummary,
    RsvpRole,
)

# Campos que o PATCH pode alterar diretamente, sem regra extra.
_PLAIN_UPDATE_FIELDS = (
    "full_name",
    "side",
    "invite_type",
    "age_group",
    "attendance",
    "save_the_date_status",
    "invite_sent_status",
)


def _now() -> datetime:
    return datetime.now(UTC)


async def _get_or_404(db: AsyncSession, guest_id: uuid.UUID) -> Guest:
    guest = await db.get(Guest, guest_id)
    if guest is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Convidado não encontrado."
        )
    return guest


async def _validate_rsvp_link(
    db: AsyncSession, rsvp_id: uuid.UUID | None, rsvp_role: str | None
) -> None:
    """Vínculo é sempre par: sem RSVP não há papel, com RSVP o papel é obrigatório."""
    if rsvp_id is None:
        if rsvp_role is not None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Papel no RSVP só faz sentido junto de um RSVP.",
            )
        return

    if rsvp_role is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Informe se a pessoa é o titular ou acompanhante do RSVP.",
        )

    if await db.get(Rsvp, rsvp_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Confirmação não encontrada."
        )


# ── Escrita ───────────────────────────────────────────────────────────────────

async def create_guest(db: AsyncSession, payload: AdminGuestCreateIn) -> Guest:
    """
    Cria um convidado num grupo existente ou abre um grupo novo.

    `sort_order` recebe max + 1 sem resequenciar nada: a listagem ordena por
    `group_index` primeiro, então a pessoa aparece dentro do grupo dela mesmo
    tendo o maior `sort_order` da tabela.
    """
    next_sort_order = (await db.scalar(select(func.max(Guest.sort_order))) or 0) + 1

    if payload.group_index is None:
        group_index = (await db.scalar(select(func.max(Guest.group_index))) or 0) + 1
        is_group_head = True
    else:
        group_index = payload.group_index
        existing = await db.scalar(
            select(func.count(Guest.id)).where(Guest.group_index == group_index)
        )
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Grupo não encontrado."
            )
        is_group_head = False

    guest = Guest(
        sort_order=next_sort_order,
        full_name=payload.full_name,
        group_index=group_index,
        is_group_head=is_group_head,
        invite_type=payload.invite_type,
        side=payload.side,
        age_group=payload.age_group,
        attendance=payload.attendance,
        save_the_date_status=payload.save_the_date_status,
        invite_sent_status=payload.invite_sent_status,
        edited_at=_now(),
    )
    db.add(guest)
    await db.flush()
    return guest


async def update_guest(
    db: AsyncSession, guest_id: uuid.UUID, payload: AdminGuestUpdateIn
) -> Guest:
    """
    Atualização parcial.

    Usa `model_fields_set` em vez de descartar `None`: enviar `rsvp_id: null` é
    como o painel desfaz um vínculo, e `attendance: null` é como volta o
    convidado para "sem resposta".
    """
    guest = await _get_or_404(db, guest_id)
    sent = payload.model_fields_set

    if "rsvp_id" in sent or "rsvp_role" in sent:
        # Quem não veio no corpo mantém o valor atual — assim dá para trocar só
        # o papel sem reenviar o rsvp_id.
        rsvp_id = payload.rsvp_id if "rsvp_id" in sent else guest.rsvp_id
        rsvp_role = payload.rsvp_role if "rsvp_role" in sent else guest.rsvp_role
        await _validate_rsvp_link(db, rsvp_id, rsvp_role)
        guest.rsvp_id = rsvp_id
        guest.rsvp_role = rsvp_role

    for field in _PLAIN_UPDATE_FIELDS:
        if field in sent:
            setattr(guest, field, getattr(payload, field))

    guest.edited_at = _now()
    db.add(guest)
    await db.flush()
    return guest


async def delete_guest(db: AsyncSession, guest_id: uuid.UUID) -> None:
    """
    Remove um convidado e mantém o grupo íntegro.

    Se quem sai é o titular, promove o membro restante de menor `sort_order`:
    sem titular o grupo perderia o rótulo na listagem. Se era o último do
    grupo, o grupo simplesmente deixa de existir.
    """
    guest = await _get_or_404(db, guest_id)
    group_index = guest.group_index
    was_head = guest.is_group_head

    await db.delete(guest)
    await db.flush()

    if not was_head:
        return

    successor = await db.scalar(
        select(Guest)
        .where(Guest.group_index == group_index)
        .order_by(Guest.sort_order.asc())
        .limit(1)
    )
    if successor is not None:
        successor.is_group_head = True
        db.add(successor)
        await db.flush()


# ── Casamento com as confirmações ─────────────────────────────────────────────

def _companion_names(rsvp: Rsvp) -> list[str]:
    """Nomes dos acompanhantes no JSONB, ignorando entradas malformadas."""
    return [
        str(item["name"])
        for item in (rsvp.companions or [])
        if isinstance(item, dict) and item.get("name")
    ]


async def get_rsvp_matches(db: AsyncSession) -> AdminRsvpMatchesOut:
    """
    Sugere, para cada pessoa citada num RSVP, quais convidados correspondem.

    Um RSVP gera uma entrada para o titular e uma por acompanhante. O casamento
    é por nome normalizado (sem acento, sem entidade HTML, minúsculo) e resolve
    em memória: são ~300 convidados e poucas dezenas de RSVPs, o que dispensa a
    extensão `unaccent` no Postgres.

    Nunca decide sozinho. Nome que casa com mais de um convidado volta como
    'ambiguous' e exige escolha na tela.
    """
    guests = list(
        (await db.execute(select(Guest).order_by(Guest.sort_order.asc())))
        .scalars()
        .all()
    )
    rsvps = list(
        (await db.execute(select(Rsvp).order_by(Rsvp.created_at.asc()))).scalars().all()
    )

    by_name: dict[str, list[Guest]] = {}
    for guest in guests:
        by_name.setdefault(normalize_name(guest.full_name), []).append(guest)

    # (rsvp_id, role) -> convidado já vinculado, independente do nome bater.
    # Precisa existir à parte de `by_name`: o painel também vincula pela busca
    # manual ou cria um convidado novo (RsvpMatchDrawer), e nesses casos o nome
    # gravado no convidado costuma ser bem diferente do que a pessoa digitou no
    # RSVP — sem este mapa, o vínculo fica correto no banco mas a tela nunca
    # tira a entrada de "Fora da lista".
    linked_by_role: dict[tuple[uuid.UUID, str], Guest] = {
        (g.rsvp_id, g.rsvp_role): g
        for g in guests
        if g.rsvp_id is not None and g.rsvp_role is not None
    }

    # Rótulo do grupo, para o candidato aparecer como "Esposa (grupo Sergio Tavares)".
    group_labels = {g.group_index: g.full_name for g in guests if g.is_group_head}

    items: list[AdminRsvpMatchEntry] = []
    summary = RsvpMatchSummary(
        rsvps_total=len(rsvps),
        entries_total=0,
        linked=0,
        unique_match=0,
        ambiguous=0,
        no_match=0,
    )

    for rsvp in rsvps:
        entries: list[tuple[RsvpRole, str]] = [("primary", rsvp.full_name)]
        entries += [("companion", name) for name in _companion_names(rsvp)]

        for role, raw_name in entries:
            summary.entries_total += 1
            matches = by_name.get(normalize_name(raw_name), [])
            already = linked_by_role.get((rsvp.id, role))

            # O vínculo pode ter sido feito por nome diferente do digitado no
            # RSVP (busca manual, ou convidado criado na hora) — garante que a
            # tela sempre veja quem está vinculado, mesmo fora da lista de
            # candidatos por nome.
            candidates = list(matches)
            if already is not None and already not in candidates:
                candidates.append(already)

            state: MatchState
            if already is not None:
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
                AdminRsvpMatchEntry(
                    rsvp_id=rsvp.id,
                    # Os nomes de RSVP foram gravados com html.escape; a tela
                    # mostra como a pessoa digitou.
                    rsvp_full_name=html.unescape(rsvp.full_name),
                    rsvp_email=rsvp.email,
                    rsvp_status=rsvp.status,
                    entry_name=html.unescape(raw_name),
                    entry_role=role,
                    state=state,
                    linked_guest_id=already.id if already else None,
                    candidates=[
                        RsvpMatchCandidate(
                            guest_id=g.id,
                            full_name=g.full_name,
                            group_label=group_labels.get(g.group_index, g.full_name),
                            linked_to_other_rsvp=(
                                g.rsvp_id is not None and g.rsvp_id != rsvp.id
                            ),
                        )
                        for g in candidates
                    ],
                )
            )

    return AdminRsvpMatchesOut(summary=summary, items=items)
