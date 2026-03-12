#!/bin/sh
set -e

# Extrai host e porta do DATABASE_URL para fazer o health-check de conexão
# Formato esperado: postgresql+asyncpg://user:pass@host:port/dbname
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:/]+)[:/].*|\1|')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')
DB_PORT=${DB_PORT:-5432}

echo "==> Waiting for database at ${DB_HOST}:${DB_PORT}..."
MAX_TRIES=30
COUNT=0
until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
  COUNT=$((COUNT + 1))
  if [ "$COUNT" -ge "$MAX_TRIES" ]; then
    echo "ERROR: Database not available after ${MAX_TRIES} attempts. Exiting."
    exit 1
  fi
  echo "   ...attempt ${COUNT}/${MAX_TRIES}, retrying in 2s"
  sleep 2
done
echo "==> Database is ready."

echo "==> Running database migrations..."
alembic upgrade head

echo "==> Starting server on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
