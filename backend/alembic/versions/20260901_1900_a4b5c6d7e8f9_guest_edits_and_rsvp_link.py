"""guest edits and rsvp link

Revision ID: a4b5c6d7e8f9
Revises: f3a4b5c6d7e8
Create Date: 2026-09-01 19:00:00.000000+00:00

Abre a tabela `guest` para edição pelo painel:

- vínculo com a confirmação recebida pelo site (`rsvp_id`, `rsvp_role`)
- `edited_at`, que a trava de scripts/import_guests.py consulta antes de apagar
- `attendance` passa a aceitar 'confirmed'
- `group_label` e `group_size` deixam de ser colunas e passam a ser derivados na
  leitura, para que renomear ou remover um convidado não exija atualizar os
  irmãos do grupo

Roda sobre uma tabela com ~300 linhas em produção. As colunas novas são todas
nullable, então não precisam de server_default.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "a4b5c6d7e8f9"
down_revision: Union[str, None] = "f3a4b5c6d7e8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("guest", sa.Column("rsvp_id", sa.UUID(), nullable=True))
    op.add_column("guest", sa.Column("rsvp_role", sa.String(length=10), nullable=True))
    op.add_column(
        "guest", sa.Column("edited_at", sa.DateTime(timezone=True), nullable=True)
    )

    op.create_foreign_key(
        "fk_guest_rsvp_id_rsvp",
        "guest",
        "rsvp",
        ["rsvp_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(op.f("ix_guest_rsvp_id"), "guest", ["rsvp_id"], unique=False)

    op.create_check_constraint(
        "ck_guest_rsvp_role",
        "guest",
        "rsvp_role IS NULL OR rsvp_role IN ('primary', 'companion')",
    )

    # 'confirmed' não existia: a planilha só registrava incerteza e recusa.
    op.drop_constraint("ck_guest_attendance", "guest", type_="check")
    op.create_check_constraint(
        "ck_guest_attendance",
        "guest",
        "attendance IS NULL OR attendance IN ('confirmed', 'uncertain', 'declined')",
    )

    op.drop_column("guest", "group_label")
    op.drop_column("guest", "group_size")


def downgrade() -> None:
    # Recria as colunas como nullable e reconstrói o conteúdo a partir da
    # própria tabela, para o downgrade continuar executável com dados.
    op.add_column("guest", sa.Column("group_size", sa.Integer(), nullable=True))
    op.add_column("guest", sa.Column("group_label", sa.String(length=200), nullable=True))

    op.execute(
        """
        UPDATE guest g SET group_size = s.n
          FROM (SELECT group_index, count(*) AS n FROM guest GROUP BY group_index) s
         WHERE s.group_index = g.group_index
        """
    )
    op.execute(
        """
        UPDATE guest g SET group_label = h.full_name
          FROM guest h
         WHERE h.group_index = g.group_index AND h.is_group_head
        """
    )
    # Grupo sem titular não deveria existir, mas um NULL aqui impediria o
    # ALTER abaixo — cai para o próprio nome.
    op.execute("UPDATE guest SET group_label = full_name WHERE group_label IS NULL")

    op.alter_column("guest", "group_size", nullable=False)
    op.alter_column("guest", "group_label", nullable=False)

    # O schema antigo não sabia expressar 'confirmed'; sem zerar antes, a
    # constraint recriada seria rejeitada pelas linhas já confirmadas.
    op.execute("UPDATE guest SET attendance = NULL WHERE attendance = 'confirmed'")
    op.drop_constraint("ck_guest_attendance", "guest", type_="check")
    op.create_check_constraint(
        "ck_guest_attendance",
        "guest",
        "attendance IS NULL OR attendance IN ('uncertain', 'declined')",
    )

    op.drop_constraint("ck_guest_rsvp_role", "guest", type_="check")
    op.drop_index(op.f("ix_guest_rsvp_id"), table_name="guest")
    op.drop_constraint("fk_guest_rsvp_id_rsvp", "guest", type_="foreignkey")
    op.drop_column("guest", "edited_at")
    op.drop_column("guest", "rsvp_role")
    op.drop_column("guest", "rsvp_id")
