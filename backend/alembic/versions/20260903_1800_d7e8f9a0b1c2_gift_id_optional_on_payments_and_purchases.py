"""gift_id optional on payments and gift_purchases

Revision ID: d7e8f9a0b1c2
Revises: c6d7e8f9a0b1
Create Date: 2026-09-03 18:00:00.000000+00:00

Lançamentos manuais (transferência bancária, Camicado, dinheiro) registram
dinheiro que entrou sem passar pelo Mercado Pago e, quase sempre, sem apontar
para nenhum presente do catálogo. Para isso `gift_id` precisa aceitar NULL nas
duas tabelas.

Junto vai a troca de CASCADE por SET NULL nas duas FKs. Com a coluna anulável,
apagar um presente deixaria de fazer sentido como motivo para apagar o
pagamento: seria perder dinheiro já recebido do relatório. É o mesmo raciocínio
que já vale para `guest_id` e `payment_id` em gift_purchases.

O downgrade falha de propósito enquanto existir linha com gift_id NULL — não há
presente para onde voltar, e inventar um seria pior do que parar.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "d7e8f9a0b1c2"
down_revision: Union[str, None] = "c6d7e8f9a0b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Nomes gerados pelo Postgres quando a FK nasceu sem nome dentro do create_table.
OLD_FKS = {
    "payments": "payments_gift_id_fkey",
    "gift_purchases": "gift_purchases_gift_id_fkey",
}
NEW_FKS = {
    "payments": "fk_payments_gift_id_gifts",
    "gift_purchases": "fk_gift_purchases_gift_id_gifts",
}


def upgrade() -> None:
    for table, old_name in OLD_FKS.items():
        op.drop_constraint(old_name, table, type_="foreignkey")
        op.alter_column(table, "gift_id", existing_type=sa.UUID(), nullable=True)
        op.create_foreign_key(
            NEW_FKS[table], table, "gifts", ["gift_id"], ["id"], ondelete="SET NULL"
        )


def downgrade() -> None:
    for table, old_name in OLD_FKS.items():
        orphans = op.get_bind().scalar(
            sa.text(f"SELECT count(*) FROM {table} WHERE gift_id IS NULL")  # noqa: S608
        )
        if orphans:
            raise RuntimeError(
                f"{table} tem {orphans} linha(s) com gift_id NULL. "
                "Aponte-as para um presente ou apague-as antes de reverter."
            )

        op.drop_constraint(NEW_FKS[table], table, type_="foreignkey")
        op.alter_column(table, "gift_id", existing_type=sa.UUID(), nullable=False)
        op.create_foreign_key(
            old_name, table, "gifts", ["gift_id"], ["id"], ondelete="CASCADE"
        )
