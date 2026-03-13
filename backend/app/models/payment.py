"""
Model SQLAlchemy para a tabela `payments`.

Registra cada tentativa de pagamento vinculada a um presente (gift_id).
A compra efetiva do presente (`gift_purchases`) só ocorre após o webhook
do Mercado Pago confirmar `status = 'approved'`.
"""

import uuid
from decimal import Decimal

from sqlalchemy import String, Numeric, Text, ForeignKey, BigInteger, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import UUIDMixin, TimestampMixin
from app.core.database import Base


class Payment(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "payments"

    # Presente associado
    gift_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("gifts.id", ondelete="CASCADE"),
        nullable=False,
    )

    # ID do pagamento no Mercado Pago (BigInteger — MP usa int64)
    mp_payment_id: Mapped[int | None] = mapped_column(
        BigInteger,
        unique=True,
        nullable=True,
        index=True,
    )

    # Método: 'pix' | 'credit_card'
    method: Mapped[str] = mapped_column(String(20), nullable=False)

    # Status interno (mapeado do MP via PaymentStatus.from_mp)
    # pending | approved | rejected | cancelled | expired | in_process
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pending",
        server_default="pending",
    )

    # Valor cobrado
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    # Dados do comprador
    buyer_name: Mapped[str] = mapped_column(String(100), nullable=False)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relacionamento com Gift (não carregado por padrão — lazy)
    gift = relationship("Gift", lazy="select")

    __table_args__ = (
        # Índice composto para evitar pagamentos duplicados por presente
        Index("ix_payments_gift_id_status", "gift_id", "status"),
    )
