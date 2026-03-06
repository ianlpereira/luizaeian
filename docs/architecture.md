# Arquitetura do Sistema

## Visão Geral

O Luizaeian é um **monorepo** composto por dois serviços principais orquestrados via Docker Compose:

```
┌─────────────────────────────────────────────┐
│                  Docker Compose              │
│                                             │
│  ┌───────────┐   ┌───────────┐   ┌───────┐ │
│  │  Frontend │   │  Backend  │   │  DB   │ │
│  │  (Vite)   │──▶│ (FastAPI) │──▶│ (PG)  │ │
│  │  :5173    │   │  :8000    │   │ :5432 │ │
│  └───────────┘   └───────────┘   └───────┘ │
└─────────────────────────────────────────────┘
```

---

## Backend — Arquitetura em Camadas

O backend segue o padrão de **Layered Architecture** com separação estrita de responsabilidades:

```
HTTP Request
    │
    ▼
┌─────────────┐
│   Router    │  ← Recebe a request, valida via Pydantic Schema, retorna response
└──────┬──────┘
       │ chama
       ▼
┌─────────────┐
│   Service   │  ← Contém toda a lógica de negócio
└──────┬──────┘
       │ chama
       ▼
┌──────────────┐
│  Repository  │  ← Único responsável por acessar o banco de dados
└──────┬───────┘
       │ usa
       ▼
┌──────────────┐
│    Model     │  ← Definição da tabela (SQLAlchemy ORM)
└──────────────┘
```

### Regras de camada

| Camada       | Pode acessar          | Não pode acessar       |
|--------------|-----------------------|------------------------|
| Router       | Service, Schemas      | Repository, Model diretamente |
| Service      | Repository, Schemas   | Router                 |
| Repository   | Model, Database       | Service, Router        |
| Model        | Base, Mixins          | Qualquer camada acima  |

---

## Frontend — Arquitetura de Componentes

### Responsabilidades

| Recurso         | Responsabilidade                                       |
|-----------------|--------------------------------------------------------|
| `pages/`        | Componentes de rota (um por rota)                      |
| `components/`   | Componentes reutilizáveis                              |
| `stores/`       | Estado do cliente (Zustand)                            |
| `lib/api.ts`    | HTTP client (Axios) com interceptors                   |
| `hooks/`        | Custom hooks (TanStack Query wrappers)                 |
| `styles/`       | Tema global + GlobalStyles                             |
| `types/`        | Tipos TypeScript compartilhados                        |

### Regra de Estilização

```
Ant Design      → Componentes com lógica complexa (Table, DatePicker, Modal, Select)
Styled Components → Todos os demais layouts, wrappers e estilização customizada
```

**Nunca** usar CSS Modules, Tailwind ou estilos inline.

### Estrutura de componente

```
/MyComponent
  index.tsx   ← Lógica React + JSX
  styles.ts   ← Apenas definições de Styled Components
```

### Import de estilos

```tsx
import * as S from './styles'

// uso:
<S.Container>...</S.Container>
```

---

## Banco de Dados

- **SGBD:** PostgreSQL 16 Alpine
- **ORM:** SQLAlchemy 2.0 (modo assíncrono via `asyncpg`)
- **Migrações:** Alembic com auto-geração
- **Convenções:**
  - Tabelas e colunas em `snake_case`
  - Valores monetários: `NUMERIC` (nunca `FLOAT`)
  - Datas: UTC

---

## Fluxo de Dados

```
Frontend (React)
    │
    │  HTTP/JSON via Axios
    ▼
Backend (FastAPI /api/*)
    │
    │  SQLAlchemy async queries
    ▼
PostgreSQL
```

---

## Variáveis de Ambiente

### Backend (`backend/.env`)

| Variável                   | Descrição                          | Padrão dev                                          |
|----------------------------|------------------------------------|-----------------------------------------------------|
| `DATABASE_URL`             | DSN do banco (asyncpg)             | `postgresql+asyncpg://postgres:postgres@db:5432/luizaeian` |
| `SECRET_KEY`               | Chave de assinatura JWT            | `dev-secret-key-change-in-production`               |
| `DEBUG`                    | Modo debug                         | `true`                                              |
| `CORS_ORIGINS`             | Origens permitidas (JSON array)    | `["http://localhost:5173"]`                         |

### Frontend (`frontend/.env`)

| Variável        | Descrição                  | Padrão dev                    |
|-----------------|----------------------------|-------------------------------|
| `VITE_API_URL`  | URL base da API            | `http://localhost:8000/api`   |
