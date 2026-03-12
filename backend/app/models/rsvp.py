from sqlalchemy import String, Text, CheckConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import UUIDMixin, TimestampMixin
from app.core.database import Base


class Rsvp(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "rsvp"

    __table_args__ = (
        CheckConstraint("status IN ('confirmed', 'declined')", name="ck_rsvp_status"),
    )

    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    # e-mail armazenado em lowercase para facilitar deduplicação
    email: Mapped[str] = mapped_column(String(254), nullable=False, unique=True, index=True)
    status: Mapped[str] = mapped_column(String(10), nullable=False)
    # Lista de acompanhantes: [{"name": "..."}]
    companions: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
