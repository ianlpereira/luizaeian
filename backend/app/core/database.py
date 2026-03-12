from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from typing import AsyncGenerator

from app.core.config import settings


def _async_db_url(url: str) -> str:
    """Garante que a URL use driver asyncpg, independente do formato recebido."""
    url = url.replace("postgresql+psycopg2://", "postgresql+asyncpg://")
    url = url.replace("postgres://", "postgresql+asyncpg://")
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


engine = create_async_engine(
    _async_db_url(settings.DATABASE_URL),
    echo=settings.DATABASE_ECHO,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
