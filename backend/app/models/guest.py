import uuid
from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class Guest(UUIDMixin, TimestampMixin, Base):
    """
    Lista de convidados, o registro de quem foi convidado para o casamento.

    A tabela nasceu de uma planilha importada por `scripts/import_guests.py`,
    mas a partir da edição pelo painel o **banco é a fonte da verdade**: o
    script só reimporta com `--force` quando existe linha editada, para não
    apagar em silêncio o que foi alterado na interface.

    O grupo (família/casal que recebeu o mesmo convite) vem da ordem das linhas
    da planilha: uma linha marcada abre o grupo e as linhas em branco abaixo
    pertencem a ele. Só `group_index` e `is_group_head` são colunas — o rótulo e
    o tamanho do grupo são derivados na leitura, em `get_guests_report`. Guardá-
    los aqui obrigaria a atualizar todos os irmãos a cada renomeação ou remoção.
    """

    __tablename__ = "guest"

    __table_args__ = (
        CheckConstraint(
            "invite_type IN ('physical', 'digital')", name="ck_guest_invite_type"
        ),
        CheckConstraint("side IN ('bride', 'groom')", name="ck_guest_side"),
        CheckConstraint("age_group IN ('adult', 'child')", name="ck_guest_age_group"),
        CheckConstraint(
            "attendance IS NULL OR attendance IN ('confirmed', 'uncertain', 'declined')",
            name="ck_guest_attendance",
        ),
        CheckConstraint(
            "save_the_date_status IS NULL OR save_the_date_status IN ('sent', 'pending')",
            name="ck_guest_save_the_date_status",
        ),
        CheckConstraint(
            "invite_sent_status IN ('sent', 'pending')", name="ck_guest_invite_sent_status"
        ),
        CheckConstraint(
            "rsvp_role IS NULL OR rsvp_role IN ('primary', 'companion')",
            name="ck_guest_rsvp_role",
        ),
    )

    # Ordem de exibição dentro do grupo. Veio da posição na planilha; convidados
    # criados pelo painel recebem max + 1 e continuam no lugar certo porque a
    # ordenação começa por group_index.
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)

    # ── Grupo (família/casal que recebeu o mesmo convite) ──
    group_index: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    # O titular do convite. Dá o rótulo do grupo na interface.
    is_group_head: Mapped[bool] = mapped_column(Boolean, nullable=False)

    # Formato do convite daquela pessoa: 'physical' (X na planilha) ou 'digital'.
    invite_type: Mapped[str] = mapped_column(String(10), nullable=False)
    # Lado que convidou: 'bride' (Noiva) ou 'groom' (Noivo).
    side: Mapped[str] = mapped_column(String(10), nullable=False)
    age_group: Mapped[str] = mapped_column(String(10), nullable=False)
    # Anotação dos noivos sobre comparecimento. Nulo = ainda sem resposta.
    attendance: Mapped[str | None] = mapped_column(String(10), nullable=True)
    save_the_date_status: Mapped[str | None] = mapped_column(String(10), nullable=True)
    invite_sent_status: Mapped[str] = mapped_column(String(10), nullable=False)

    # ── Vínculo com a confirmação recebida pelo site ──
    #
    # Muitos-para-um: um RSVP cobre o titular e seus acompanhantes, então várias
    # linhas de guest apontam para o mesmo rsvp. SET NULL porque apagar um RSVP
    # não pode apagar o convidado.
    rsvp_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("rsvp.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    # Qual parte do RSVP essa pessoa é: 'primary' (quem preencheu) ou 'companion'.
    rsvp_role: Mapped[str | None] = mapped_column(String(10), nullable=True)

    # Preenchido por toda escrita vinda do painel. É o que a trava de
    # `scripts/import_guests.py` consulta antes de apagar a tabela.
    edited_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
