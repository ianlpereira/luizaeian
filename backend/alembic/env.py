from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import AsyncEngine

from alembic import context

# Import all models so Alembic can detect them
from app.core.database import Base
from app.core.config import settings

# Import models here so they are registered with Base
from app.models import gift     # noqa: F401
from app.models import rsvp     # noqa: F401
from app.models import message  # noqa: F401

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set the SQLAlchemy URL from settings — normaliza para driver psycopg2 síncrono
_db_url = settings.DATABASE_URL
_db_url = _db_url.replace("postgresql+asyncpg://", "postgresql://")
_db_url = _db_url.replace("postgresql+aiopg://", "postgresql://")
_db_url = _db_url.replace("postgres://", "postgresql://")  # Render usa "postgres://"
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
