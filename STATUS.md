# Status do Projeto

> Última atualização: 2026-03-06

## 📊 Estado Atual: `BOOTSTRAP`

O projeto foi inicializado com a estrutura base do monorepo. A plataforma está operacional via Docker Compose com hot-reload tanto no backend quanto no frontend.

---

## ✅ Épicos Concluídos

### EPIC-001 — Bootstrap do Monorepo

**Concluído em:** 2026-03-06

**Escopo entregue:**

- [x] Monorepo estruturado com `backend/` e `frontend/`
- [x] Docker Compose com PostgreSQL 16, FastAPI e Vite com hot-reload
- [x] Backend FastAPI com arquitetura em camadas (routers → services → repositories → models)
- [x] SQLAlchemy 2.0 assíncrono + Alembic configurado
- [x] Pydantic v2 com `from_attributes = True`
- [x] Frontend React 18 + Vite + TypeScript strict
- [x] Styled Components com tema centralizado e `DefaultTheme` declarado
- [x] Ant Design com locale pt-BR
- [x] TanStack Query com devtools
- [x] React Router v6 com layout aninhado
- [x] Zustand com `persist` para auth state
- [x] Axios com interceptors de auth e erro global
- [x] React Hook Form + Zod (dependências prontas)
- [x] Documentação em `docs/`
- [x] `README.md` com instruções completas

---

## 🔄 Em Andamento

_Nenhum épico em andamento no momento._

---

## 📋 Backlog

_A definir pelo Product Manager / Engineering Manager._

---

## 🔗 Links Úteis

| Recurso     | URL                                  |
|-------------|--------------------------------------|
| API Docs    | `http://localhost:8000/api/docs`     |
| Frontend    | `http://localhost:5173`              |
| ReDoc       | `http://localhost:8000/api/redoc`    |
