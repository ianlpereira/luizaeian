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

## 📋 Site de Casamento "Luiza e Ian"

> Produto paralelo documentado em `docs/`. Stack: React + Vite + TypeScript + Supabase + Vercel.
> Todos os épicos planejados — aguardando início da implementação.

### Épicos Planejados

| # | Épico | Arquivo | Status |
|---|---|---|---|
| 1 | Foundation & Setup | `docs/EPIC-1-PLANNING.md` | ✅ Completo |
| 2 | Apresentação e Identidade Visual | `docs/EPIC-2-PLANNING.md` | ✅ Completo |
| 3 | Logística e Geolocalização | `docs/EPIC-3-PLANNING.md` | ✅ Completo |
| 4 | Lista de Presentes | `docs/EPIC-4-PLANNING.md` | 🔲 Planejado |
| 5 | Engajamento (RSVP & Mural) | `docs/EPIC-5-PLANNING.md` | 🔲 Planejado |

**Documentação completa:** `docs/DOCS-INDEX.md`
**Roadmap:** `docs/ROADMAP.md`

---

## 📋 Backlog — Monorepo Geral

_A definir pelo Product Manager / Engineering Manager._

---

## 🔗 Links Úteis

| Recurso     | URL                                  |
|-------------|--------------------------------------|
| API Docs    | `http://localhost:8000/api/docs`     |
| Frontend    | `http://localhost:5173`              |
| ReDoc       | `http://localhost:8000/api/redoc`    |
