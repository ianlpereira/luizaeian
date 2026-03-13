"""replace seed gifts

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-03-13 00:01:00.000000+00:00

Substitui a seed de presentes pela nova versão atualizada.

upgrade():
  - Remove todos os presentes que NÃO tenham compras associadas
    (preserva os já comprados por segurança)
  - Insere os novos presentes

downgrade():
  - Remove os presentes inseridos por esta migration (sem compras),
    restaurando o estado anterior à migration.
"""
from typing import Sequence, Union
import uuid

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _u() -> str:
    """Gera um UUID v4 como string para uso no bulk insert."""
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# Dados dos presentes (versão atualizada)
# Campos: id, title, price, image_url, category, stock_limit, purchased
#
# Categorias:
#   Eletrodomésticos · Sala · Quarto · Cozinha · Cama, Mesa e Banho
#   Decoração · Utilidades · Lua de Mel
# ---------------------------------------------------------------------------

GIFTS = [
    # ── Eletrodomésticos (Grandes Sonhos) ────────────────────────────────────
    {"id": _u(), "title": "Geladeira Smart French Door 579L", "price": "9599.00", "image_url": "https://images.unsplash.com/photo-1584824486509-112e4181f1ce?w=600&q=80", "category": "Eletrodomésticos", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Smart TV OLED 65 Polegadas 4K", "price": "7499.00", "image_url": "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&q=80", "category": "Eletrodomésticos", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Máquina Lava e Seca 11kg Frontal", "price": "4299.00", "image_url": "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&q=80", "category": "Eletrodomésticos", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Sofá Retrátil de Couro 3 Lugares", "price": "3890.00", "image_url": "https://images.unsplash.com/photo-1512212621149-107ffe572d2f?w=600&q=80", "category": "Sala", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Robô Aspirador Inteligente com Mapeamento", "price": "3499.00", "image_url": "https://images.unsplash.com/photo-1589008581671-50e50882e987?w=600&q=80", "category": "Eletrodomésticos", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Cama Box Queen Size com Baú", "price": "2899.00", "image_url": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80", "category": "Quarto", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Máquina de Café Expresso Automática", "price": "2499.00", "image_url": "https://images.unsplash.com/photo-1518832553480-161ceee1e3d3?w=600&q=80", "category": "Eletrodomésticos", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Ar Condicionado Split Inverter 12000 BTUs", "price": "2199.00", "image_url": "https://images.unsplash.com/photo-1618220179428-22790b46a0eb?w=600&q=80", "category": "Eletrodomésticos", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Forno de Embutir Elétrico 80L", "price": "1899.00", "image_url": "https://images.unsplash.com/photo-1584824486509-112e4181f1ce?w=600&q=80", "category": "Eletrodomésticos", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Adega Climatizada 24 Garrafas", "price": "1650.00", "image_url": "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=600&q=80", "category": "Eletrodomésticos", "stock_limit": 1, "purchased": False},

    # ── Cozinha (Faixa de R$ 150 a R$ 800) ───────────────────────────────────
    {"id": _u(), "title": "Jogo de panelas antiaderente 5 peças", "price": "349.90", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Jogo de panelas em Aço Inox Fundo Triplo", "price": "649.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Jogo de panelas de Cerâmica", "price": "799.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Panela de Ferro Fundido Esmaltada", "price": "450.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Frigideira Wok com Tampa", "price": "220.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Conjunto de Frigideiras Antiaderentes", "price": "280.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Panela de Pressão Aço Inox 6L", "price": "350.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Panela de Pressão Elétrica Digital", "price": "499.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Batedeira Planetária 600W", "price": "599.00", "image_url": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Liquidificador de Alta Potência 1200W", "price": "299.00", "image_url": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Airfryer Fritadeira Sem Óleo 4L", "price": "450.00", "image_url": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Airfryer Forno Fritadeira 12L", "price": "790.00", "image_url": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Micro-ondas 34 Litros Inox", "price": "750.00", "image_url": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Torradeira Elétrica Inox", "price": "180.00", "image_url": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Chaleira Elétrica Inox", "price": "160.00", "image_url": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Mixer de Mão 3 em 1", "price": "230.00", "image_url": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Multiprocessador de Alimentos", "price": "380.00", "image_url": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Sanduicheira e Grill Inox", "price": "190.00", "image_url": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Grill Elétrico com Chapa Dupla", "price": "320.00", "image_url": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Moedor de Café Elétrico", "price": "210.00", "image_url": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Extrator de Sucos Profissional", "price": "250.00", "image_url": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Máquina de Pão Automática", "price": "650.00", "image_url": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Faqueiro Inox 130 Peças", "price": "490.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Faqueiro Inox 72 Peças Estojo Madeira", "price": "350.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Jogo de Facas Profissionais do Chef", "price": "380.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Cepo com Facas e Tesoura", "price": "290.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Tábua de Corte Profissional em Teca", "price": "180.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Conjunto Servir Salada Inox", "price": "150.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Kit Utensílios de Silicone com Cabo de Madeira", "price": "160.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Conjunto de Assadeiras de Vidro com Tampa", "price": "170.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Conjunto Assadeiras Antiaderentes", "price": "190.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Aparelho de Jantar Porcelana 42 Peças", "price": "690.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Aparelho de Jantar Cerâmica 30 Peças", "price": "450.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Jogo de Pratos Fundos 6 Peças", "price": "180.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Jogo de Pratos Rasos 6 Peças", "price": "190.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Jogo de Pratos de Sobremesa 6 Peças", "price": "150.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Jogo de Xícaras de Café com Pires", "price": "160.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Jogo de Xícaras de Chá com Pires", "price": "180.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Kit Sousplat de Bambu 6 Peças", "price": "220.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Kit Sousplat de Vidro com Borda Dourada", "price": "310.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Jogo de Taças de Vinho Tinto Cristal 6p", "price": "280.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Jogo de Taças de Vinho Branco Cristal 6p", "price": "250.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Jogo de Taças de Espumante Cristal 6p", "price": "240.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Jogo de Taças de Água Cristal 6p", "price": "260.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Jogo de Copos Cerveja Cristal", "price": "190.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Jogo de Copos Long Drink 6p", "price": "150.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Jarra de Cristal 1.5L", "price": "220.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Decanter de Vinho em Cristal", "price": "180.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Conjunto Coqueteleira e Acessórios Bar", "price": "250.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Moedor de Sal e Pimenta Elétrico", "price": "170.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Conjunto de Potes Herméticos de Vidro 10p", "price": "280.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Kit Potes Mantimentos Bambu e Vidro", "price": "240.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Faqueiro de Churrasco Tramontina", "price": "310.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Petisqueira Giratória de Bambu", "price": "190.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Balança Digital de Cozinha e Termômetro", "price": "160.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Máquina de Gelo Portátil", "price": "750.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Pipoqueira Elétrica", "price": "180.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Panquequeira e Crepeira Elétrica", "price": "210.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Fondue de Ferro Esmaltado", "price": "340.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Galheteiro Inox e Vidro com Suporte", "price": "150.00", "image_url": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Fruteira de Mesa Inox Design Moderno", "price": "160.00", "image_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Tábua de Frios em Mármore Branco", "price": "230.00", "image_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80", "category": "Cozinha", "stock_limit": 1, "purchased": False},

    # ── Cama, Mesa e Banho (Faixa de R$ 150 a R$ 600) ────────────────────────
    {"id": _u(), "title": "Jogo Lençol Queen 400 Fios Algodão Egípcio", "price": "550.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Jogo Lençol Queen 300 Fios Branco", "price": "350.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Jogo Lençol Casal 300 Fios Cinza", "price": "290.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Jogo Lençol King Size 400 Fios", "price": "590.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Jogo Lençol Queen de Cetim", "price": "280.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Jogo Lençol Casal Percal 200 Fios", "price": "220.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Jogo Lençol Queen Estampado Percal", "price": "260.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Jogo Lençol King Percal 200 Fios", "price": "310.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Edredom Casal Dupla Face", "price": "320.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Edredom Queen Algodão Percal", "price": "450.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Manta de Microfibra Queen Premium", "price": "180.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Kit Cobre-leito Piquet Casal", "price": "250.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Kit Colcha Matelassê Queen 3 Peças", "price": "390.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Kit 2 Travesseiros Nasa Viscoelástico", "price": "240.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Kit 2 Travesseiros Pluma de Ganso Sintética", "price": "280.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Saia para Cama Box Queen Ponto Palito", "price": "150.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Jogo de Toalhas 5 Peças Fio Penteado", "price": "350.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Jogo de Toalhas Algodão Egípcio 4 Peças", "price": "420.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Kit 2 Toalhas de Banho Banhão Gigante", "price": "220.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Kit 4 Toalhas de Rosto Premium", "price": "160.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Conjunto Tapetes Banheiro Antiderrapante", "price": "150.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Roupão de Banho Felpudo - Ele", "price": "250.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Roupão de Banho Felpudo - Ela", "price": "250.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Kit Acessórios Banheiro Cerâmica 4 Peças", "price": "180.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Toalha de Mesa em Linho Retangular", "price": "280.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Toalha de Mesa com Renda Francesa", "price": "350.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Jogo Americano de Linho 6 Lugares", "price": "240.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Jogo Americano em Ratã 6 Peças", "price": "290.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Guardanapos de Tecido Bordado 6 Peças", "price": "160.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Kit Argolas para Guardanapo Madeira 6p", "price": "150.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Caminho de Mesa Bordado Richelieu", "price": "210.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Protetor de Colchão Impermeável Queen", "price": "190.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Kit Protetor de Travesseiro Impermeável 4p", "price": "150.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Manta Decorativa para Sofá Chenille", "price": "260.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Kit Almofadas Decorativas de Veludo 4p", "price": "320.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Kit Capas de Almofada Linho 4p", "price": "180.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Jogo de Toalhas Lavabo Bordadas 4p", "price": "170.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Manta de Tricô Decorativa Cama Queen", "price": "390.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Jogo de Cama Algodão 200 Fios Estampa Floral", "price": "270.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Peseira de Cama Tricot Queen", "price": "290.00", "image_url": "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80", "category": "Cama, Mesa e Banho", "stock_limit": 1, "purchased": False},

    # ── Decoração e Utilidades (Faixa de R$ 150 a R$ 800) ────────────────────
    {"id": _u(), "title": "Vaso de Cristal Decorativo Grande", "price": "350.00", "image_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80", "category": "Decoração", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Espelho Redondo Decorativo com Alça Couro", "price": "450.00", "image_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80", "category": "Decoração", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Conjunto Quadros Decorativos Abstratos", "price": "290.00", "image_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80", "category": "Decoração", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Luminária de Chão em Aço Inox", "price": "550.00", "image_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80", "category": "Decoração", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Abajur Clássico para Mesa de Cabeceira", "price": "220.00", "image_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80", "category": "Decoração", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Tapete para Sala Peludo 2x3m", "price": "790.00", "image_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80", "category": "Decoração", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Centro de Mesa de Cristal Murano", "price": "650.00", "image_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80", "category": "Decoração", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Escultura Decorativa em Cerâmica", "price": "180.00", "image_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80", "category": "Decoração", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Relógio de Parede Minimalista Cobre", "price": "150.00", "image_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80", "category": "Decoração", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Bandeja Espelhada para Bar", "price": "280.00", "image_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80", "category": "Decoração", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Kit Organizadores de Acrílico para Gaveta", "price": "190.00", "image_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80", "category": "Utilidades", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Cesto de Roupa em Bambu com Tampa", "price": "210.00", "image_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80", "category": "Utilidades", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Conjunto Porta-Retratos de Prata 2p", "price": "150.00", "image_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80", "category": "Decoração", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Difusor de Ambientes Elétrico Ultrassônico", "price": "180.00", "image_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80", "category": "Decoração", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Conjunto de Velas Aromáticas Premium", "price": "160.00", "image_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80", "category": "Decoração", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Cabideiro de Parede Madeira Rústica", "price": "170.00", "image_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80", "category": "Decoração", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Suporte para Vinhos de Parede Inox", "price": "200.00", "image_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80", "category": "Decoração", "stock_limit": 1, "purchased": False},
    {"id": _u(), "title": "Aspirador de Pó Vertical e Portátil", "price": "350.00", "image_url": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80", "category": "Utilidades", "stock_limit": 1, "purchased": False},

    # ── Cotas de Lua de Mel ───────────────────────────────────────────────────
    # Cota Passagens Aéreas — R$ 500,00 cada (35 cotas)
    *[{"id": _u(), "title": f"Cota de Lua de Mel: Passagens Aéreas (Cota {i}/35)", "price": "500.00", "image_url": "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=600&q=80", "category": "Lua de Mel", "stock_limit": 1, "purchased": False} for i in range(1, 36)],
    # Cota Hospedagem Resort — R$ 400,00 cada (35 cotas)
    *[{"id": _u(), "title": f"Cota de Lua de Mel: Hospedagem Resort (Cota {i}/35)", "price": "400.00", "image_url": "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=600&q=80", "category": "Lua de Mel", "stock_limit": 1, "purchased": False} for i in range(1, 36)],
    # Cota Passeios e Aventura — R$ 250,00 cada (30 cotas)
    *[{"id": _u(), "title": f"Cota de Lua de Mel: Passeios de Barco e Guias (Cota {i}/30)", "price": "250.00", "image_url": "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=600&q=80", "category": "Lua de Mel", "stock_limit": 1, "purchased": False} for i in range(1, 31)],
    # Cota Gastronomia e Drinks — R$ 150,00 cada (30 cotas)
    *[{"id": _u(), "title": f"Cota de Lua de Mel: Jantares Românticos e Drinks (Cota {i}/30)", "price": "150.00", "image_url": "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=600&q=80", "category": "Lua de Mel", "stock_limit": 1, "purchased": False} for i in range(1, 31)],
]

# ---------------------------------------------------------------------------
# Tabela auxiliar para bulk_insert
# ---------------------------------------------------------------------------

_gifts_table = sa.table(
    "gifts",
    sa.column("id", sa.String),
    sa.column("title", sa.String),
    sa.column("price", sa.Numeric),
    sa.column("image_url", sa.Text),
    sa.column("category", sa.String),
    sa.column("stock_limit", sa.Integer),
    sa.column("purchased", sa.Boolean),
)

# ---------------------------------------------------------------------------
# Migration
# ---------------------------------------------------------------------------

def upgrade() -> None:
    bind = op.get_bind()

    # Remove presentes sem compras associadas (os da seed anterior)
    # Presentes já comprados são preservados por segurança.
    bind.execute(sa.text(
        "DELETE FROM gifts "
        "WHERE id NOT IN (SELECT DISTINCT gift_id FROM gift_purchases)"
    ))

    # Insere a nova lista de presentes
    op.bulk_insert(_gifts_table, GIFTS)


def downgrade() -> None:
    # Remove os presentes inseridos por esta migration (sem compras)
    bind = op.get_bind()
    bind.execute(sa.text(
        "DELETE FROM gifts "
        "WHERE id NOT IN (SELECT DISTINCT gift_id FROM gift_purchases)"
    ))
