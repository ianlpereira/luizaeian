"""add payment_id to gift_purchases

Revision ID: c6d7e8f9a0b1
Revises: b5c6d7e8f9a0
Create Date: 2026-09-03 14:00:00.000000+00:00

Vínculo explícito entre uma compra e o pagamento que a gerou. Até aqui a única
associação era a trinca (gift_id, buyer_name, message), recalculada na mão em
payment_service — duas pessoas com o mesmo nome dando o mesmo presente com a
mesma mensagem colidiam.

NULL continua sendo um estado válido: é a compra registrada pelo endpoint
público POST /api/gifts/purchase, que não tem pagamento por trás.

O backfill pareia 1:1 dentro de cada balde (gift_id, buyer_name, message) por
ordem de created_at, então duplicatas no mesmo balde recebem pagamentos
diferentes em vez de todas apontarem para o mesmo. A UNIQUE é criada depois do
backfill de propósito: se o pareamento errar, a migration falha aqui em vez de
deixar dado inconsistente passar.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "c6d7e8f9a0b1"
down_revision: Union[str, None] = "b5c6d7e8f9a0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


BACKFILL = """
WITH ranked_purchases AS (
    SELECT id,
           gift_id,
           buyer_name,
           coalesce(message, '') AS msg,
           row_number() OVER (
               PARTITION BY gift_id, buyer_name, coalesce(message, '')
               ORDER BY created_at, id
           ) AS rn
      FROM gift_purchases
),
ranked_payments AS (
    SELECT id,
           gift_id,
           buyer_name,
           coalesce(message, '') AS msg,
           row_number() OVER (
               PARTITION BY gift_id, buyer_name, coalesce(message, '')
               ORDER BY created_at, id
           ) AS rn
      FROM payments
     WHERE status = 'approved'
)
UPDATE gift_purchases gp
   SET payment_id = pay.id
  FROM ranked_purchases pur
  JOIN ranked_payments pay
    ON pay.gift_id = pur.gift_id
   AND pay.buyer_name = pur.buyer_name
   AND pay.msg = pur.msg
   AND pay.rn = pur.rn
 WHERE gp.id = pur.id
"""


def upgrade() -> None:
    op.add_column("gift_purchases", sa.Column("payment_id", sa.UUID(), nullable=True))
    op.create_foreign_key(
        "fk_gift_purchases_payment_id_payments",
        "gift_purchases",
        "payments",
        ["payment_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.execute(BACKFILL)
    op.create_unique_constraint(
        "uq_gift_purchases_payment_id", "gift_purchases", ["payment_id"]
    )


def downgrade() -> None:
    op.drop_constraint("uq_gift_purchases_payment_id", "gift_purchases", type_="unique")
    op.drop_constraint(
        "fk_gift_purchases_payment_id_payments", "gift_purchases", type_="foreignkey"
    )
    op.drop_column("gift_purchases", "payment_id")
