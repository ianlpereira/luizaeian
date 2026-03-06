# Luizaeian

Plataforma interna de gestão — monorepo com FastAPI backend e React frontend.

## 🛠️ Stack

| Camada     | Tecnologia                                              |
| ---------- | ------------------------------------------------------- |
| Backend    | Python 3.11, FastAPI, SQLAlchemy 2.0, Pydantic v2       |
| Frontend   | React 18, Vite, TypeScript, Styled Components, Ant Design |
| Banco      | PostgreSQL 16                                           |
| Migrations | Alembic                                                 |
| Infra      | Docker, Docker Compose                                  |

## 🚀 Início Rápido

### Pré-requisitos

- Docker >= 24
- Docker Compose v2

### 1. Clone e configure variáveis de ambiente

```bash
git clone <repo-url>
cd luizaeian

# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

### 2. Suba todos os serviços

```bash
docker compose up --build
```

### 3. Acesse

| Serviço         | URL                          |
| --------------- | ---------------------------- |
| Frontend        | http://localhost:5173        |
| Backend API     | http://localhost:8000/api    |
| Swagger UI      | http://localhost:8000/api/docs |
| ReDoc           | http://localhost:8000/api/redoc |

## 📂 Estrutura do Projeto

```
luizaeian/
├── backend/            # FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── core/       # Config, database, security
│   │   ├── models/     # SQLAlchemy ORM models
│   │   ├── schemas/    # Pydantic v2 schemas
│   │   ├── repositories/  # Database access layer
│   │   ├── services/   # Business logic layer
│   │   └── routers/    # FastAPI route handlers
│   ├── alembic/        # Database migrations
│   ├── tests/          # Pytest tests
│   └── requirements.txt
├── frontend/           # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Route-level page components
│   │   ├── stores/     # Zustand state stores
│   │   ├── lib/        # HTTP client (axios)
│   │   ├── types/      # TypeScript type definitions
│   │   └── styles/     # Theme + global styles
│   └── package.json
├── docs/               # Project documentation
├── docker-compose.yml
└── README.md
```

## 🗄️ Migrações de Banco de Dados

```bash
# Criar nova migração
docker compose exec backend alembic revision --autogenerate -m "description"

# Aplicar migrações
docker compose exec backend alembic upgrade head

# Reverter uma migração
docker compose exec backend alembic downgrade -1

# Checar versão atual
docker compose exec backend alembic current
```

## 📖 Documentação

Toda a documentação técnica está na pasta [`docs/`](./docs/).

- [Arquitetura](./docs/architecture.md)
- [Guia de Setup](./docs/setup.md)
- [Backend](./docs/backend.md)
- [Frontend](./docs/frontend.md)

## 🧪 Testes

```bash
# Backend
docker compose exec backend pytest -v

# Backend com coverage
docker compose exec backend pytest --cov=app --cov-report=term-missing
```
