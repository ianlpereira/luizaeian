from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# Import all models so Alembic can detect them
from app.core.database import Base

# Import models here so they are registered with Base
from app.models import gift     # noqa: F401
from app.models import rsvp     # noqa: F401
from app.models import message  # noqa: F401
from app.models import payment  # noqa: F401

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Lê DATABASE_URL diretamente da env var para evitar problemas com Settings()
import os
import logging

log = logging.getLogger("alembic.env")

_db_url = os.environ.get("DATABASE_URL", "")
if not _db_url:
    # Fallback para desenvolvimento local
    from app.core.config import settings
    _db_url = settings.DATABASE_URL

# Normaliza para driver psycopg2 síncrono (Alembic não suporta asyncpg)
_db_url = _db_url.replace("postgresql+asyncpg://", "postgresql://")
_db_url = _db_url.replace("postgresql+aiopg://", "postgresql://")
if _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql://", 1)

log.info("Alembic connecting to: %s", _db_url.split("@")[-1])  # loga só host/db, sem senha
config.set_main_option("sqlalchemy.url", _db_url)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
