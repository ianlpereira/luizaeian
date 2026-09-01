from sqlalchemy import Boolean, CheckConstraint, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class Guest(UUIDMixin, TimestampMixin, Base):
    """
    Lista de convidados importada da planilha dos noivos.

    Tabela somente leitura para o painel: quem escreve nela é
    `scripts/import_guests.py`, que substitui o conteúdo inteiro a cada
    importação. Nenhuma rota da API grava aqui.

    Os campos de grupo são desnormalizados de propósito. A planilha agrupa a
    família pela ordem das linhas (uma linha marcada abre o grupo, as linhas em
    branco abaixo pertencem a ele), e guardar o resultado já resolvido deixa o
    relatório em uma única consulta, sem tabela de grupos.
    """

    __tablename__ = "guest"

    __table_args__ = (
        CheckConstraint(
            "invite_type IN ('physical', 'digital')", name="ck_guest_invite_type"
        ),
        CheckConstraint("side IN ('bride', 'groom')", name="ck_guest_side"),
        CheckConstraint("age_group IN ('adult', 'child')", name="ck_guest_age_group"),
        CheckConstraint(
            "attendance IS NULL OR attendance IN ('uncertain', 'declined')",
            name="ck_guest_attendance",
        ),
        CheckConstraint(
            "save_the_date_status IS NULL OR save_the_date_status IN ('sent', 'pending')",
            name="ck_guest_save_the_date_status",
        ),
        CheckConstraint(
            "invite_sent_status IN ('sent', 'pending')", name="ck_guest_invite_sent_status"
        ),
    )

    # Posição da linha na planilha. Ordenar por ele mantém cada grupo junto.
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)

    # ── Grupo (família/casal que recebeu o mesmo convite) ──
    group_index: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    # Nome do titular do convite, usado como rótulo do grupo na interface.
    group_label: Mapped[str] = mapped_column(String(200), nullable=False)
    group_size: Mapped[int] = mapped_column(Integer, nullable=False)
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
