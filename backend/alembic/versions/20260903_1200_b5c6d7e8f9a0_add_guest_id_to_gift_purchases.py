"""add guest_id to gift_purchases

Revision ID: b5c6d7e8f9a0
Revises: a4b5c6d7e8f9
Create Date: 2026-09-03 12:00:00.000000+00:00

Vínculo opcional entre uma compra de presente e um convidado da lista, no mesmo
espírito de guest.rsvp_id — mas na direção oposta (a FK fica do lado de
`gift_purchases`, não de `guest`), porque um convidado pode dar mais de um
presente. Sem papel/role: aqui não existe o conceito de titular/acompanhante
que justifica `rsvp_role` do outro lado.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "b5c6d7e8f9a0"
down_revision: Union[str, None] = "a4b5c6d7e8f9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("gift_purchases", sa.Column("guest_id", sa.UUID(), nullable=True))
    op.create_foreign_key(
        "fk_gift_purchases_guest_id_guest",
        "gift_purchases",
        "guest",
        ["guest_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        op.f("ix_gift_purchases_guest_id"), "gift_purchases", ["guest_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_gift_purchases_guest_id"), table_name="gift_purchases")
    op.drop_constraint(
        "fk_gift_purchases_guest_id_guest", "gift_purchases", type_="foreignkey"
    )
    op.drop_column("gift_purchases", "guest_id")
