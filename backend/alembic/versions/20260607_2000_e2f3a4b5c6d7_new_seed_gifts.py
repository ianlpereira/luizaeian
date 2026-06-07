"""new seed gifts — Itens de Casa e Viagem (Lua de Mel no Japão)

Revision ID: e2f3a4b5c6d7
Revises: d1e2f3a4b5c6
Create Date: 2026-06-07 20:00:00.000000+00:00

upgrade():
  - Remove todos os presentes que NÃO tenham compras associadas
  - Insere os novos presentes divididos em duas categorias:
      * Itens de Casa
      * Viagem (foco na lua de mel no Japão)
  - Todos com stock_limit = 0 (sem limite de compra)
  - Preços entre R$ 150 e R$ 10.000, maioria na faixa R$ 250–500

downgrade():
  - Remove os presentes inseridos por esta migration (sem compras associadas)
"""
from typing import Sequence, Union
import uuid

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "e2f3a4b5c6d7"
down_revision: Union[str, None] = "d1e2f3a4b5c6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _u() -> str:
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# Presentes
# Campos: id, title, price, image_url, category, stock_limit, purchased, hidden
# stock_limit = 0 → sem limite de compra
# ---------------------------------------------------------------------------

GIFTS = [
    # ── Itens de Casa ──────────────────────────────────────────────────────────
    {
        "id": _u(),
        "title": "Jogo de panelas de cerâmica antiaderente 5 peças",
        "price": "449.90",
        "image_url": "https://images.unsplash.com/photo-1571559932711-cb498a7a1ce1?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "category": "Itens de Casa",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Air fryer digital 6 litros",
        "price": "479.00",
        "image_url": "https://images.unsplash.com/photo-1649264191931-9235c8dd03ef?q=80&w=1738&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "category": "Itens de Casa",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Cafeteira espresso semiprofissional",
        "price": "899.00",
        "image_url": "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=600&q=80",
        "category": "Itens de Casa",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Aspirador robô com mapeamento inteligente",
        "price": "1350.00",
        "image_url": "https://images.unsplash.com/photo-1558317374-067fb5f30001?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "category": "Itens de Casa",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Jogo de cama queen percal 400 fios — branco",
        "price": "399.00",
        "image_url": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80",
        "category": "Itens de Casa",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Edredom casal pluma sintética premium",
        "price": "479.00",
        "image_url": "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&q=80",
        "category": "Itens de Casa",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Jogo de toalhas de banho felpudas 6 peças — algodão egípcio",
        "price": "289.90",
        "image_url": "https://images.unsplash.com/photo-1616627561950-9f746e330187?w=600&q=80",
        "category": "Itens de Casa",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Batedeira de alta potência 1200W",
        "price": "379.00",
        "image_url": "https://images.unsplash.com/photo-1578643463396-0997cb5328c1?w=600&q=80",
        "category": "Itens de Casa",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Conjunto de pratos e talheres para 6 pessoas",
        "price": "499.00",
        "image_url": "https://images.unsplash.com/photo-1675092097368-8f18d504de7f?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "category": "Itens de Casa",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Café da manhã no hotel para o casal",
        "price": "259.90",
        "image_url": "https://images.pexels.com/photos/6775268/pexels-photo-6775268.jpeg?auto=compress&cs=tinysrgb&w=600",
        "category": "Viagem",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Tapete para sala 200x140cm — off-white",
        "price": "459.00",
        "image_url": "https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=654&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "category": "Itens de Casa",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Luminária de chão para sala — base dourada",
        "price": "349.90",
        "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80",
        "category": "Itens de Casa",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Smart TV 50'' 4K UHD",
        "price": "2499.00",
        "image_url": "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&q=80",
        "category": "Itens de Casa",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Sofá retrátil 3 lugares — tecido veludo",
        "price": "4500.00",
        "image_url": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80",
        "category": "Itens de Casa",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Adega climatizada para 12 garrafas",
        "price": "1250.00",
        # Garrafas de vinho organizadas e iluminadas em prateleiras
        "image_url": "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=600&q=80",
        "category": "Itens de Casa",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Conjunto de taças de cristal para vinho — 6 peças",
        "price": "320.00",
        # Taças de cristal elegantes refletindo a luz na mesa
        "image_url": "https://images.unsplash.com/photo-1651665849313-91055ad02729?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "category": "Itens de Casa",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Purificador de água com compressor e painel touch",
        "price": "750.00",
        # Copo elegante sendo servido com água fresca e limpa
        "image_url": "https://images.unsplash.com/photo-1589986005992-68bc7aa343c2?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "category": "Itens de Casa",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Fechadura digital inteligente com biometria",
        "price": "680.00",
        # Porta moderna com fechadura digital em close
        "image_url": "https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "category": "Itens de Casa",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    # ── Viagem — Lua de Mel no Japão ──────────────────────────────────────────
    {
        "id": _u(),
        "title": "Mala de viagem rígida 70L para a lua de mel no Japão",
        "price": "699.00",
        "image_url": "https://images.unsplash.com/photo-1639597784674-431b34cec7a8?q=80&w=1738&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "category": "Viagem",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Guia de viagem Japão — Tóquio, Kyoto, Osaka e Hiroshima",
        "price": "289.90",
        "image_url": "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&q=80",
        "category": "Viagem",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Cerimônia do chá tradicional japonesa para casal em Kyoto",
        "price": "349.90",
        "image_url": "https://images.unsplash.com/flagged/photo-1565080636132-56952ee2861c?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "category": "Viagem",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Câmera instantânea Fujifilm Instax para registrar o Japão",
        "price": "599.00",
        "image_url": "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&q=80",
        "category": "Viagem",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Pokémon Café Tokyo — experiência gastronômica temática para o casal",
        "price": "379.00",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/0/09/Pokemon_Cafe_%28Shinsaibashi%29.jpg",
        "category": "Viagem",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Bonecos do Studio Ghibli para decorar o quarto do casal",
        "price": "259.90",
        "image_url": "https://images.unsplash.com/photo-1695747000284-4dba6bc2e975?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "category": "Viagem",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Contribuição para estadia em Ryokan tradicional japonês",
        "price": "500.00",
        "image_url": "https://images.unsplash.com/photo-1614301246509-d1fc7d78b6b6?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "category": "Viagem",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Experiência de cerimônia do chá e degustação de saquê em Kyoto",
        "price": "450.00",
        "image_url": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&q=80",
        "category": "Viagem",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Casal de Yukata (quimono casual) para usar no Ryokan",
        "price": "389.00",
        "image_url": "https://images.unsplash.com/photo-1493780474015-ba834fd0ce2f?w=600&q=80",
        "category": "Viagem",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Contribuição para passeio ao Monte Fuji e Hakone",
        "price": "500.00",
        "image_url": "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=600&q=80",
        "category": "Viagem",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Decoração de Minions para o quarto do casal (fãs de Minions)",
        "price": "299.90",
        "image_url": "https://images.unsplash.com/photo-1682613739449-55796660ac1b?q=80&w=1691&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "category": "Itens de Casa",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Curso online de japonês básico para viajantes",
        "price": "350.00",
        "image_url": "https://images.pexels.com/photos/4050286/pexels-photo-4050286.jpeg?auto=compress&cs=tinysrgb&w=600",
        "category": "Viagem",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Seguro viagem casal — cobertura completa para o Japão",
        "price": "450.00",
        "image_url": "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80",
        "category": "Viagem",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Ingressos de entrada para a Tokyo Disneyland (Casal)",
        "price": "650.00",
        # Castelo encantado de parque de diversões à noite, lembrando o clima da Disney
        "image_url": "https://res-1.cloudinary.com/jnto/image/upload/w_2064,h_1300,c_fill,f_auto,fl_lossy,q_auto/v1645708829/chiba/H_00336_001",
        "category": "Viagem",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Jantar romântico inesquecível com carne Wagyu A5 em Tóquio",
        "price": "850.00",
        # Fatias de carne premium grelhando / alta gastronomia
        "image_url": "https://images.unsplash.com/photo-1591224803255-6cfbba886c2c?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "category": "Viagem",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Passeio de Trem-Bala (Shinkansen) de Tóquio a Kyoto",
        "price": "1100.00",
        # Famosa imagem do Shinkansen passando com o Monte Fuji ao fundo
        "image_url": "https://images.unsplash.com/photo-1514337224818-9787cf717f2a?q=80&w=1931&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "category": "Viagem",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
    {
        "id": _u(),
        "title": "Ingressos para o museu de arte digital teamLab Planets",
        "price": "290.00",
        # Instalação imersiva de luzes abstratas que lembra as artes digitais do teamLab
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/6/69/At_teamLab_Planets_%2848277793276%29.jpg",
        "category": "Viagem",
        "stock_limit": 999,
        "purchased": False,
        "hidden": False,
    },
]


# ---------------------------------------------------------------------------
# Migration
# ---------------------------------------------------------------------------

def upgrade() -> None:
    bind = op.get_bind()

    # Remove presentes sem compras associadas (garante idempotência segura)
    bind.execute(
        sa.text(
            "DELETE FROM gifts WHERE id NOT IN "
            "(SELECT DISTINCT gift_id FROM gift_purchases)"
        )
    )

    gifts_table = sa.table(
        "gifts",
        sa.column("id", sa.String),
        sa.column("title", sa.String),
        sa.column("price", sa.Numeric),
        sa.column("image_url", sa.Text),
        sa.column("category", sa.String),
        sa.column("stock_limit", sa.Integer),
        sa.column("purchased", sa.Boolean),
        sa.column("hidden", sa.Boolean),
    )

    op.bulk_insert(gifts_table, GIFTS)


def downgrade() -> None:
    op.execute(
        sa.text(
            "DELETE FROM gifts WHERE id NOT IN "
            "(SELECT DISTINCT gift_id FROM gift_purchases)"
        )
    )