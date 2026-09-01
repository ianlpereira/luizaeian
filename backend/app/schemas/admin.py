"""
Schemas Pydantic da área administrativa (login + relatórios).

Valores monetários trafegam como float: o frontend já tipa `price: number`
(frontend/src/types/gift.ts) e as tabelas do Ant Design ordenam por número.
As somas são feitas em NUMERIC no banco; a conversão acontece só aqui na borda.
"""

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

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
# noivos, importada por scripts/import_guests.py. Os rótulos em pt-BR ficam no
# frontend; aqui os valores são os mesmos gravados no banco.

InviteType = Literal["physical", "digital"]
GuestSide = Literal["bride", "groom"]
AgeGroup = Literal["adult", "child"]
Attendance = Literal["uncertain", "declined"]
SentStatus = Literal["sent", "pending"]


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


class AdminGuestRow(BaseModel):
    id: uuid.UUID
    sort_order: int
    full_name: str
    group_index: int
    group_label: str
    group_size: int
    is_group_head: bool
    invite_type: InviteType
    side: GuestSide
    age_group: AgeGroup
    attendance: Attendance | None
    save_the_date_status: SentStatus | None
    invite_sent_status: SentStatus


class AdminGuestsOut(BaseModel):
    summary: GuestSummary
    items: list[AdminGuestRow]
