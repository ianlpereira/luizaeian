#!/bin/bash
set -e

# DATABASE_URL pode vir como:
#   postgresql://user:pass@host/db            (Render — sem porta explícita)
#   postgresql://user:pass@host:5432/db       (com porta explícita)
#   postgresql+asyncpg://user:pass@host:5432/db (configuração local)

# Extrai apenas a parte host:port (ou só host) depois do @
DB_HOSTPORT=$(echo "$DATABASE_URL" | sed -E 's|.*@([^/]+)/.*|\1|')
DB_HOST=$(echo "$DB_HOSTPORT" | cut -d: -f1)
DB_PORT=$(echo "$DB_HOSTPORT" | grep -oE ':[0-9]+$' | tr -d ':')
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

echo "==> Starting FastAPI application..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
