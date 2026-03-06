# Guia de Setup

## Pré-requisitos

| Ferramenta     | Versão mínima |
|----------------|---------------|
| Docker         | 24.x          |
| Docker Compose | v2.x          |
| Git            | 2.x           |

> **Nota:** Node.js e Python **não precisam** estar instalados na máquina host. Todo o ambiente roda dentro dos containers Docker.

---

## 1. Clone o repositório

```bash
git clone <repo-url>
cd luizaeian
```

---

## 2. Configure as variáveis de ambiente

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

Para desenvolvimento local, os valores padrão já funcionam sem alteração.

---

## 3. Suba os serviços

```bash
docker compose up --build
```

Na primeira execução, o Docker irá:
1. Baixar as imagens base (`python:3.11-slim`, `node:20-alpine`, `postgres:16-alpine`)
2. Instalar todas as dependências
3. Iniciar os serviços com hot-reload

---

## 4. Aplique as migrações do banco

```bash
docker compose exec backend alembic upgrade head
```

---

## 5. Acesse a aplicação

| Serviço         | URL                                     |
|-----------------|-----------------------------------------|
| Frontend        | `http://localhost:5173`                 |
| API Docs        | `http://localhost:8000/api/docs`        |
| Health Check    | `http://localhost:8000/api/health`      |

---

## Comandos úteis

### Gerenciar serviços

```bash
# Subir em background
docker compose up -d

# Ver logs de um serviço específico
docker compose logs -f backend
docker compose logs -f frontend

# Parar todos os serviços
docker compose down

# Parar e remover volumes (reset do banco)
docker compose down -v
```

### Backend

```bash
# Acessar shell do container
docker compose exec backend bash

# Rodar testes
docker compose exec backend pytest -v

# Rodar testes com coverage
docker compose exec backend pytest --cov=app --cov-report=term-missing

# Criar nova migração
docker compose exec backend alembic revision --autogenerate -m "add users table"

# Aplicar migrações
docker compose exec backend alembic upgrade head

# Reverter última migração
docker compose exec backend alembic downgrade -1

# Ver histórico de migrações
docker compose exec backend alembic history
```

### Frontend

```bash
# Acessar shell do container
docker compose exec frontend sh

# Instalar nova dependência
docker compose exec frontend npm install <pacote>

# Type check
docker compose exec frontend npm run type-check
```

---

## Resolução de Problemas

### Porta já em uso

Se a porta `5432`, `8000` ou `5173` já estiver ocupada:

```bash
# Verificar processos nas portas
lsof -i :5432
lsof -i :8000
lsof -i :5173
```

Altere as portas no `docker-compose.yml` conforme necessário.

### Banco não inicializa

```bash
# Verificar logs do banco
docker compose logs db

# Reiniciar apenas o banco
docker compose restart db
```

### Limpar tudo e recomeçar

```bash
docker compose down -v --remove-orphans
docker compose up --build
```
