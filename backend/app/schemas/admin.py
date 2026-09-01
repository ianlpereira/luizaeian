"""
Schemas Pydantic da área administrativa (login + relatórios).

Valores monetários trafegam como float: o frontend já tipa `price: number`
(frontend/src/types/gift.ts) e as tabelas do Ant Design ordenam por número.
As somas são feitas em NUMERIC no banco; a conversão acontece só aqui na borda.
"""

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.schemas.payment import PaymentMethod, PaymentStatusLiteral
from app.schemas.rsvp import Companion


# ── Autenticação ──────────────────────────────────────────────────────────────

class AdminLoginIn(BaseModel):
    username: str = Field(..., min_length=1, max_length=100)
    # 72 bytes é o limite do bcrypt — acima disso o restante seria ignorado.
    password: str = Field(..., min_length=1, max_length=72)


class AdminTokenOut(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int  # segundos


class AdminMeOut(BaseModel):
    username: str


# ── Relatório de RSVP ─────────────────────────────────────────────────────────

class RsvpSummary(BaseModel):
    total_responses: int
    confirmed: int
    declined: int
    # Soma de convidados apenas das respostas confirmadas (titular + acompanhantes)
    total_guests: int
    companions_count: int


class AdminRsvpRow(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    status: str
    companions: list[Companion]
    companions_count: int
    headcount: int
    created_at: datetime


class AdminRsvpsOut(BaseModel):
    summary: RsvpSummary
    items: list[AdminRsvpRow]


# ── Relatório de presentes ────────────────────────────────────────────────────

class GiftSummary(BaseModel):
    total_gifts: int
    visible_gifts: int
    hidden_gifts: int
    gifts_with_purchases: int
    purchase_records: int


class AdminGiftRow(BaseModel):
    id: uuid.UUID
    title: str
    price: float
    category: str
    image_url: str | None
    hidden: bool
    # Linhas em gift_purchases. Podem vir do endpoint público OU da aprovação de
    # um pagamento — nunca somar com approved_payments.
    purchase_records: int
    approved_payments: int
    approved_amount: float
    created_at: datetime


class AdminGiftsOut(BaseModel):
    summary: GiftSummary
    items: list[AdminGiftRow]


# ── Relatório de pagamentos ───────────────────────────────────────────────────

class PaymentSummary(BaseModel):
    # Única fonte de verdade financeira: soma de payments com status 'approved'.
    approved_amount: float
    approved_count: int
    pending_count: int
    rejected_count: int
    other_count: int
    total_count: int


class AdminPaymentRow(BaseModel):
    id: uuid.UUID
    gift_id: uuid.UUID
    gift_title: str | None
    mp_payment_id: int | None
    method: PaymentMethod
    status: PaymentStatusLiteral
    amount: float
    buyer_name: str
    message: str | None
    created_at: datetime


class AdminPaymentsOut(BaseModel):
    summary: PaymentSummary
    items: list[AdminPaymentRow]


# ── Lista de convidados ───────────────────────────────────────────────────────
#
# Origem diferente dos relatórios acima: não vem do site, e sim da planilha dos
# noivos, importada por scripts/import_guests.py e depois editada pelo painel.
# Os rótulos em pt-BR ficam no frontend; aqui os valores são os mesmos gravados
# no banco.

InviteType = Literal["physical", "digital"]
GuestSide = Literal["bride", "groom"]
AgeGroup = Literal["adult", "child"]
Attendance = Literal["confirmed", "uncertain", "declined"]
SentStatus = Literal["sent", "pending"]
RsvpRole = Literal["primary", "companion"]


class GuestSummary(BaseModel):
    total: int
    # Famílias/casais: cada grupo recebeu um convite.
    total_groups: int
    physical_invites: int
    digital_invites: int
    bride_side: int
    groom_side: int
    invites_sent: int
    invites_pending: int
    # Anotações dos noivos — quem ainda não respondeu não entra em nenhum dos dois.
    declined: int
    uncertain: int
    confirmed: int
    # Convidados já ligados a uma confirmação recebida pelo site.
    linked_to_rsvp: int
    # Confirmações que nenhum convidado reivindica — gente fora da lista.
    rsvps_without_guest: int


class AdminGuestRow(BaseModel):
    id: uuid.UUID
    sort_order: int
    full_name: str
    group_index: int
    # Derivados na leitura a partir do grupo — não são colunas da tabela.
    group_label: str
    group_size: int
    is_group_head: bool
    invite_type: InviteType
    side: GuestSide
    age_group: AgeGroup
    attendance: Attendance | None
    save_the_date_status: SentStatus | None
    invite_sent_status: SentStatus
    # ── Vínculo com o RSVP ──
    rsvp_id: uuid.UUID | None
    rsvp_role: RsvpRole | None
    # Vêm por join, para a tabela mostrar a coluna sem uma segunda requisição.
    rsvp_full_name: str | None
    rsvp_email: str | None
    rsvp_status: str | None
    edited_at: datetime | None


class AdminGuestsOut(BaseModel):
    summary: GuestSummary
    items: list[AdminGuestRow]


# ── Escrita de convidados ─────────────────────────────────────────────────────

class AdminGuestCreateIn(BaseModel):
    # max_length casa com a coluna String(200). O RsvpIn público não tem esse
    # limite e por isso um nome longo lá vira erro de banco, não 422.
    full_name: str = Field(..., min_length=2, max_length=200)
    side: GuestSide
    invite_type: InviteType
    age_group: AgeGroup = "adult"
    # Grupo existente, ou None para abrir um grupo novo com esta pessoa.
    group_index: int | None = None
    attendance: Attendance | None = None
    save_the_date_status: SentStatus | None = None
    invite_sent_status: SentStatus = "pending"

    @field_validator("full_name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        name = value.strip()
        if len(name) < 2:
            raise ValueError("Nome precisa ter ao menos 2 caracteres.")
        return name


class AdminGuestUpdateIn(BaseModel):
    """
    Atualização parcial: só os campos enviados são alterados.

    O serviço usa `model_fields_set` em vez de checar `is None`, porque enviar
    `null` é uma operação legítima aqui — é assim que se desfaz um vínculo de
    RSVP ou se limpa o comparecimento.
    """

    full_name: str | None = Field(None, min_length=2, max_length=200)
    side: GuestSide | None = None
    invite_type: InviteType | None = None
    age_group: AgeGroup | None = None
    attendance: Attendance | None = None
    save_the_date_status: SentStatus | None = None
    invite_sent_status: SentStatus | None = None
    rsvp_id: uuid.UUID | None = None
    rsvp_role: RsvpRole | None = None

    @field_validator("full_name")
    @classmethod
    def strip_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        name = value.strip()
        if len(name) < 2:
            raise ValueError("Nome precisa ter ao menos 2 caracteres.")
        return name


# ── Casamento entre lista e confirmações ──────────────────────────────────────

MatchState = Literal["linked", "unique_match", "ambiguous", "no_match"]


class RsvpMatchCandidate(BaseModel):
    guest_id: uuid.UUID
    full_name: str
    group_label: str
    # Já aponta para OUTRO RSVP: confirmar aqui sobrescreveria o vínculo atual.
    linked_to_other_rsvp: bool


class AdminRsvpMatchEntry(BaseModel):
    """Uma pessoa dentro de um RSVP: o titular ou um dos acompanhantes."""

    rsvp_id: uuid.UUID
    rsvp_full_name: str
    rsvp_email: str
    rsvp_status: str
    # Nome desta pessoa: o do titular ou o do acompanhante no JSONB.
    entry_name: str
    entry_role: RsvpRole
    state: MatchState
    # Preenchido quando state == 'linked'.
    linked_guest_id: uuid.UUID | None
    candidates: list[RsvpMatchCandidate]


class RsvpMatchSummary(BaseModel):
    rsvps_total: int
    entries_total: int
    linked: int
    unique_match: int
    ambiguous: int
    no_match: int


class AdminRsvpMatchesOut(BaseModel):
    summary: RsvpMatchSummary
    items: list[AdminRsvpMatchEntry]
