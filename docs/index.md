# Documentação — Luizaeian

Bem-vindo à documentação técnica do projeto Luizaeian.

## Índice

| Documento                        | Descrição                                              |
|----------------------------------|--------------------------------------------------------|
| [Arquitetura](./architecture.md) | Diagrama de componentes, camadas e fluxo de dados      |
| [Setup](./setup.md)              | Como rodar o projeto localmente                        |
| [Backend](./backend.md)          | Guia de desenvolvimento FastAPI — criando novos recursos |
| [Frontend](./frontend.md)        | Guia de desenvolvimento React — componentes, rotas, forms |

## Princípios

- **KISS:** Sem over-engineering. Foco em velocidade e densidade de dados.
- **Type Safety:** TypeScript strict no frontend, type hints obrigatórios no backend.
- **Portuguese UI:** Toda interface com o usuário em pt-BR.
- **English Codebase:** Variáveis, funções e comentários em inglês.

## Stack resumida

```
Backend:   Python 3.11 · FastAPI · SQLAlchemy 2.0 · Pydantic v2 · Alembic
Frontend:  React 18 · Vite · TypeScript · Styled Components · Ant Design
           React Hook Form · Zod · TanStack Query · Axios · Zustand
DB:        PostgreSQL 16 Alpine
Infra:     Docker · Docker Compose
```
