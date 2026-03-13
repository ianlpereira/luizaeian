"""add hidden column to gifts

Revision ID: d1e2f3a4b5c6
Revises: b2c3d4e5f6a7
Create Date: 2026-03-13 20:00:00.000000+00:00

Adiciona coluna `hidden` (boolean, default False) na tabela `gifts`.
Presentes com hidden=True são excluídos da listagem pública — útil para
ocultar registros de teste em produção/desenvolvimento sem precisar deletá-los.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "d1e2f3a4b5c6"
down_revision: Union[str, None] = "c0910fe1c995"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "gifts",
        sa.Column(
            "hidden",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )


def downgrade() -> None:
    op.drop_column("gifts", "hidden")
