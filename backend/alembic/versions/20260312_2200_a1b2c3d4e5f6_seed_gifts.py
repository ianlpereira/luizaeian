"""seed gifts

Revision ID: a1b2c3d4e5f6
Revises: 73f9b57866fc
Create Date: 2026-03-12 22:00:00.000000+00:00

Esta migration insere os presentes iniciais da lista de casamento.
É idempotente: só insere se a tabela gifts estiver vazia.
O downgrade remove TODOS os presentes sem compras associadas.
"""
from typing import Sequence, Union
import uuid

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "73f9b57866fc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _u() -> str:
    """Gera um UUID v4 como string para uso no bulk insert."""
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# Dados dos presentes
# Campos: id, title, price, image_url, category, stock_limit, purchased
# ---------------------------------------------------------------------------
#
# Categorias usadas:
#   Cozinha · Casa · Cama & Banho · Eletrônicos · Lazer · Viagem · Engraçado
#
# Imagens: URLs do Unsplash (sem autenticação, resolução 600×600).
# ---------------------------------------------------------------------------

GIFTS = [
    # ── Cozinha ──────────────────────────────────────────────────────────────
    {
        "id": _u(),
        "title": "Jogo de panelas antiaderente 5 peças",
        "price": "349.90",
        "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80",
        "category": "Cozinha",
        "stock_limit": 1,
        "purchased": False,
    },
    {
        "id": _u(),
        "title": "Batedeira planetária 600W",
        "price": "599.00",
        "image_url": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80",
        "category": "Cozinha",
        "stock_limit": 1,
        "purchased": False,
    },
    {
        "id": _u(),
        "title": "Cafeteira espresso automática",
        "price": "899.00",
        "image_url": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80",
        "category": "Cozinha",
        "stock_limit": 1,
        "purchased": False,
    },
    {
        "id": _u(),
        "title": "Jogo de facas de chef 6 peças com suporte",
        "price": "279.90",
        "image_url": "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=600&q=80",
        "category": "Cozinha",
        "stock_limit": 1,
        "purchased": False,
    },
    {
        "id": _u(),
        "title": "Air fryer 5,5 litros",
        "price": "499.00",
        "image_url": "https://images.unsplash.com/photo-1649180556628-9ba704115795?w=600&q=80",
        "category": "Cozinha",
        "stock_limit": 1,
        "purchased": False,
    },
    {
        "id": _u(),
        "title": "Liquidificador de alta potência 1200W",
        "price": "349.00",
        "image_url": "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600&q=80",
        "category": "Cozinha",
        "stock_limit": 1,
        "purchased": False,
    },
    {
        "id": _u(),
        "title": "Jogo de vasilhas com tampa hermética 12 peças",
        "price": "189.90",
        "image_url": "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600&q=80",
        "category": "Cozinha",
        "stock_limit": 1,
        "purchased": False,
    },
    {
        "id": _u(),
        "title": "Tábua de corte de bambu grande",
        "price": "89.90",
        "image_url": "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=600&q=80",
        "category": "Cozinha",
        "stock_limit": 2,
        "purchased": False,
    },
    # ── Casa ─────────────────────────────────────────────────────────────────
    {
        "id": _u(),
        "title": "Aspirador de pó robô com mapeamento",
        "price": "1299.00",
        "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
        "category": "Casa",
        "stock_limit": 1,
        "purchased": False,
    },
    {
        "id": _u(),
        "title": "Conjunto de vasos decorativos para sala",
        "price": "199.00",
        "image_url": "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&q=80",
        "category": "Casa",
        "stock_limit": 1,
        "purchased": False,
    },
    {
        "id": _u(),
        "title": "Luminária de mesa com regulagem de intensidade",
        "price": "249.90",
        "image_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
        "category": "Casa",
        "stock_limit": 2,
        "purchased": False,
    },
    {
        "id": _u(),
        "title": "Tapete sala 2m × 1,4m — off-white",
        "price": "459.00",
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80",
        "category": "Casa",
        "stock_limit": 1,
        "purchased": False,
    },
    {
        "id": _u(),
        "title": "Quadro decorativo trio botânico",
        "price": "159.90",
        "image_url": "https://images.unsplash.com/photo-1549887534-1541e9326642?w=600&q=80",
        "category": "Casa",
        "stock_limit": 1,
        "purchased": False,
    },
    {
        "id": _u(),
        "title": "Jogo de porta-retratos de madeira 3 peças",
        "price": "99.90",
        "image_url": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&q=80",
        "category": "Casa",
        "stock_limit": 2,
        "purchased": False,
    },
    # ── Cama & Banho ─────────────────────────────────────────────────────────
    {
        "id": _u(),
        "title": "Jogo de cama queen 400 fios — branco",
        "price": "389.00",
        "image_url": "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80",
        "category": "Cama & Banho",
        "stock_limit": 1,
        "purchased": False,
    },
    {
        "id": _u(),
        "title": "Edredom king pluma sintética",
        "price": "479.00",
        "image_url": "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&q=80",
        "category": "Cama & Banho",
        "stock_limit": 1,
        "purchased": False,
    },
    {
        "id": _u(),
        "title": "Jogo de toalhas felpudas 6 peças",
        "price": "219.90",
        "image_url": "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&q=80",
        "category": "Cama & Banho",
        "stock_limit": 2,
        "purchased": False,
    },
    {
        "id": _u(),
        "title": "Roupão de banho casal — algodão egípcio",
        "price": "299.00",
        "image_url": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80",
        "category": "Cama & Banho",
        "stock_limit": 1,
        "purchased": False,
    },
    # ── Eletrônicos ──────────────────────────────────────────────────────────
    {
        "id": _u(),
        "title": "Smart TV 50\" 4K",
        "price": "2499.00",
        "image_url": "https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=600&q=80",
        "category": "Eletrônicos",
        "stock_limit": 1,
        "purchased": False,
    },
    {
        "id": _u(),
        "title": "Caixa de som portátil Bluetooth à prova d'água",
        "price": "399.00",
        "image_url": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80",
        "category": "Eletrônicos",
        "stock_limit": 1,
        "purchased": False,
    },
    {
        "id": _u(),
        "title": "Fone de ouvido over-ear com cancelamento de ruído",
        "price": "799.00",
        "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
        "category": "Eletrônicos",
        "stock_limit": 1,
        "purchased": False,
    },
    # ── Lazer ────────────────────────────────────────────────────────────────
    {
        "id": _u(),
        "title": "Jogo de tabuleiro Catan — edição completa",
        "price": "229.90",
        "image_url": "https://images.unsplash.com/photo-1608848461950-0fe51dfc41cb?w=600&q=80",
        "category": "Lazer",
        "stock_limit": 1,
        "purchased": False,
    },
    {
        "id": _u(),
        "title": "Kit fondue de chocolate para 4 pessoas",
        "price": "129.90",
        "image_url": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80",
        "category": "Lazer",
        "stock_limit": 2,
        "purchased": False,
    },
    {
        "id": _u(),
        "title": "Assinatura anual de streaming",
        "price": "599.00",
        "image_url": "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=600&q=80",
        "category": "Lazer",
        "stock_limit": 1,
        "purchased": False,
    },
    # ── Viagem ───────────────────────────────────────────────────────────────
    {
        "id": _u(),
        "title": "Mala de viagem rígida 70L — rose gold",
        "price": "699.00",
        "image_url": "https://images.unsplash.com/photo-1553531384-cc64ac80f931?w=600&q=80",
        "category": "Viagem",
        "stock_limit": 1,
        "purchased": False,
    },
    {
        "id": _u(),
        "title": "Kit necessaire de viagem 3 peças — couro vegano",
        "price": "189.90",
        "image_url": "https://images.unsplash.com/photo-1547949003-9792a18a2601?w=600&q=80",
        "category": "Viagem",
        "stock_limit": 2,
        "purchased": False,
    },
    {
        "id": _u(),
        "title": "Contribuição para lua de mel ✈️",
        "price": "200.00",
        "image_url": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80",
        "category": "Viagem",
        "stock_limit": 10,
        "purchased": False,
    },
    # ── Engraçado 🎉 ─────────────────────────────────────────────────────────
    {
        "id": _u(),
        "title": "Chapéu de chef para o Ian fingir que cozinha",
        "price": "39.90",
        "image_url": "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=600&q=80",
        "category": "Engraçado",
        "stock_limit": 1,
        "purchased": False,
    },
    {
        "id": _u(),
        "title": "Boia de flamingo gigante para a piscina que ainda não temos",
        "price": "79.90",
        "image_url": "https://images.unsplash.com/photo-1530053969600-caed2596d242?w=600&q=80",
        "category": "Engraçado",
        "stock_limit": 1,
        "purchased": False,
    },
    {
        "id": _u(),
        "title": "Manual de instruções: Como sobreviver ao casamento — livro de humor",
        "price": "49.90",
        "image_url": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&q=80",
        "category": "Engraçado",
        "stock_limit": 3,
        "purchased": False,
    },
    {
        "id": _u(),
        "title": "Almofada personalizada com foto dos noivos em forma de batata",
        "price": "89.90",
        "image_url": "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=600&q=80",
        "category": "Engraçado",
        "stock_limit": 2,
        "purchased": False,
    },
    {
        "id": _u(),
        "title": "Caneca 'Ele tolera, ela decide' — dupla",
        "price": "59.90",
        "image_url": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80",
        "category": "Engraçado",
        "stock_limit": 3,
        "purchased": False,
    },
    {
        "id": _u(),
        "title": "Cobertor do 'não me chame antes do meio-dia' — tamanho casal",
        "price": "129.90",
        "image_url": "https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?w=600&q=80",
        "category": "Engraçado",
        "stock_limit": 2,
        "purchased": False,
    },
    {
        "id": _u(),
        "title": "Kit 'controle remoto da esposa' — caixa decorativa vazia com bilhete",
        "price": "29.90",
        "image_url": "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&q=80",
        "category": "Engraçado",
        "stock_limit": 5,
        "purchased": False,
    },
]


# ---------------------------------------------------------------------------
# Migration
# ---------------------------------------------------------------------------

def upgrade() -> None:
    bind = op.get_bind()

    # Garante idempotência: só insere se a tabela estiver vazia
    existing = bind.execute(sa.text("SELECT COUNT(*) FROM gifts")).scalar()
    if existing and existing > 0:
        return

    gifts_table = sa.table(
        "gifts",
        sa.column("id", sa.String),
        sa.column("title", sa.String),
        sa.column("price", sa.Numeric),
        sa.column("image_url", sa.Text),
        sa.column("category", sa.String),
        sa.column("stock_limit", sa.Integer),
        sa.column("purchased", sa.Boolean),
    )

    op.bulk_insert(gifts_table, GIFTS)


def downgrade() -> None:
    # Remove somente presentes sem nenhuma compra associada (seguro para rollback)
    op.execute(
        sa.text(
            "DELETE FROM gifts WHERE id NOT IN (SELECT DISTINCT gift_id FROM gift_purchases)"
        )
    )
