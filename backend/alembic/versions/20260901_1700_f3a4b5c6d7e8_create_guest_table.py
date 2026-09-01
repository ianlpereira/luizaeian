"""create guest table

Revision ID: f3a4b5c6d7e8
Revises: e2f3a4b5c6d7
Create Date: 2026-09-01 17:00:00.000000+00:00

Cria apenas o schema. Os nomes dos convidados vêm de uma planilha que fica fora
do repositório, importada por `scripts/import_guests.py` — de propósito, para
que a lista de convidados não seja commitada.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "f3a4b5c6d7e8"
down_revision: Union[str, None] = "e2f3a4b5c6d7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "guest",
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("full_name", sa.String(length=200), nullable=False),
        sa.Column("group_index", sa.Integer(), nullable=False),
        sa.Column("group_label", sa.String(length=200), nullable=False),
        sa.Column("group_size", sa.Integer(), nullable=False),
        sa.Column("is_group_head", sa.Boolean(), nullable=False),
        sa.Column("invite_type", sa.String(length=10), nullable=False),
        sa.Column("side", sa.String(length=10), nullable=False),
        sa.Column("age_group", sa.String(length=10), nullable=False),
        sa.Column("attendance", sa.String(length=10), nullable=True),
        sa.Column("save_the_date_status", sa.String(length=10), nullable=True),
        sa.Column("invite_sent_status", sa.String(length=10), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "invite_type IN ('physical', 'digital')", name="ck_guest_invite_type"
        ),
        sa.CheckConstraint("side IN ('bride', 'groom')", name="ck_guest_side"),
        sa.CheckConstraint("age_group IN ('adult', 'child')", name="ck_guest_age_group"),
        sa.CheckConstraint(
            "attendance IS NULL OR attendance IN ('uncertain', 'declined')",
            name="ck_guest_attendance",
        ),
        sa.CheckConstraint(
            "save_the_date_status IS NULL OR save_the_date_status IN ('sent', 'pending')",
            name="ck_guest_save_the_date_status",
        ),
        sa.CheckConstraint(
            "invite_sent_status IN ('sent', 'pending')",
            name="ck_guest_invite_sent_status",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_guest_sort_order"), "guest", ["sort_order"], unique=False)
    op.create_index(op.f("ix_guest_group_index"), "guest", ["group_index"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_guest_group_index"), table_name="guest")
    op.drop_index(op.f("ix_guest_sort_order"), table_name="guest")
    op.drop_table("guest")
