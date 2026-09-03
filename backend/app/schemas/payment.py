"""
Schemas Pydantic para os endpoints de pagamento.
"""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Literal, get_args

from pydantic import BaseModel, Field, model_validator


# ── Tipos ─────────────────────────────────────────────────────────────────────

# Métodos do checkout público. Não incluir os manuais aqui: PaymentCreateIn usa
# este alias, e um valor a mais viraria na hora um corpo válido de requisição
# anônima em POST /api/payments.
PaymentMethod = Literal["pix", "credit_card"]

# Métodos que só o painel administrativo registra, para dinheiro que entrou fora
# do Mercado Pago.
ManualMethod = Literal["bank_transfer", "camicado", "cash", "other"]

# Tudo que pode aparecer na coluna Método do relatório unificado.
LedgerMethod = PaymentMethod | ManualMethod

# Pix e cartão são os únicos métodos que o Mercado Pago produz, então o que não
# é deles foi lançado à mão pelo painel — e só isso é editável.
MANUAL_METHODS: frozenset[str] = frozenset(get_args(ManualMethod))

PaymentStatusLiteral = Literal[
    "pending", "approved", "rejected", "cancelled", "expired", "in_process"
]


# ── Request: criar pagamento ──────────────────────────────────────────────────

class PaymentCreateIn(BaseModel):
    gift_id: uuid.UUID
    buyer_name: str = Field(..., min_length=2, max_length=100)
    message: str | None = Field(default=None, max_length=300)
    method: PaymentMethod

    # Apenas para cartão de crédito — obrigatórios se method == 'credit_card'
    card_token: str | None = None
    installments: int | None = Field(default=None, ge=1, le=12)
    payment_method_id: str | None = None   # ex: "visa", "master", "elo"
    issuer_id: str | None = None           # ID do banco emissor

    # Dados opcionais do pagador — melhoram aprovação e reduzem fraudes
    payer_email: str | None = Field(default=None, max_length=254)  # ex: "nome@email.com"
    payer_last_name: str | None = Field(default=None, max_length=100)
    payer_cpf: str | None = Field(default=None, max_length=14)  # ex: "123.456.789-09"

    @model_validator(mode="after")
    def validate_card_fields(self) -> "PaymentCreateIn":
        if self.method == "credit_card":
            if not self.card_token:
                raise ValueError("card_token é obrigatório para pagamento com cartão")
            if not self.installments:
                raise ValueError("installments é obrigatório para pagamento com cartão")
        return self


# ── Response: criar pagamento ─────────────────────────────────────────────────

class PaymentCreateOut(BaseModel):
    payment_id: str              # ID interno (UUID da nossa tabela)
    mp_payment_id: int | None    # ID retornado pelo MP (None até ser criado)
    status: PaymentStatusLiteral
    method: PaymentMethod

    # Apenas Pix
    qr_code: str | None = None           # Payload copia-e-cola (EMV)
    qr_code_base64: str | None = None    # Imagem do QR code em Base64
    expires_at: datetime | None = None   # Expiração do QR code

    # Apenas cartão / erros
    detail: str | None = None            # Mensagem do MP em caso de recusa
    user_message: str | None = None      # Mensagem amigável para exibir ao usuário


# ── Response: status do pagamento ─────────────────────────────────────────────

class PaymentStatusOut(BaseModel):
    payment_id: str
    status: PaymentStatusLiteral
    paid: bool                           # True somente se status == 'approved'


# ── Response: chave pública ───────────────────────────────────────────────────

class PublicKeyOut(BaseModel):
    public_key: str


# ── Webhook: payload do Mercado Pago ─────────────────────────────────────────

class WebhookPayload(BaseModel):
    """Payload mínimo esperado nas notificações de webhook do Mercado Pago."""
    id: int | None = None
    live_mode: bool | None = None
    type: str | None = None         # ex: "payment"
    action: str | None = None       # ex: "payment.updated"
    data: dict | None = None        # { "id": "<mp_payment_id>" }
