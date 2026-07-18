"""
Script de execução única (não faz parte da cadeia de migrations do Alembic).

Restaura presentes já marcados como esgotados (purchased=true ou stock_limit<=0)
para o estado disponível, já que a compra de presentes deixou de ter limite.
Não altera o schema — apenas os dados existentes.

Uso:
    cd backend && python -m scripts.reset_gift_availability
"""

import asyncio

from sqlalchemy import update

from app.core.database import AsyncSessionLocal
from app.models.gift import Gift


async def main() -> None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            update(Gift)
            .where((Gift.purchased == True) | (Gift.stock_limit <= 0))  # noqa: E712
            .values(purchased=False, stock_limit=999)
        )
        await db.commit()
        print(f"Presentes atualizados: {result.rowcount}")


if __name__ == "__main__":
    asyncio.run(main())
