# Status do Projeto

> Última atualização: 2026-03-12

## 📊 Estado Atual: `TODOS OS ÉPICOS COMPLETOS 🎉`

O projeto evoluiu do bootstrap inicial. Épicos 1–4 do site de casamento estão concluídos. A plataforma está operacional via Docker Compose com hot-reload tanto no backend quanto no frontend.

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
- [x] TanStack Query com devtools
- [x] React Router v6 com layout aninhado
- [x] Zustand com `persist` para auth state
- [x] React Hook Form + Zod (dependências prontas)
- [x] Documentação em `docs/`
- [x] `README.md` com instruções completas

### EPIC-002 — Apresentação e Identidade Visual

**Concluído em:** 2026-03-06

- [x] HeroSection com `fetchPriority="high"`, scroll para `#galeria`
- [x] Gallery — CSS Grid 2→3→4 cols, `aspect-ratio 3/4`
- [x] Lightbox — swipe touch, navegação por teclado, body overflow lock
- [x] 10 fotos reais integradas (`Ian y Luiza-N.webp`)

### EPIC-003 — Logística e Geolocalização

**Concluído em:** 2026-03-06

- [x] `useCountdown` — setInterval 1s, flag `isOver`
- [x] `Countdown` — 4 blocos + animação pulse
- [x] `EventCard` — deep links Google Maps e Waze
- [x] `LazyMap` — IntersectionObserver `rootMargin 200px`
- [x] `EventInfo` — grid 2 cards + pílula DressCode
- [x] `src/data/event.ts` — campos `dressCode`, `mapsEmbedUrl`

### EPIC-004 — Lista de Presentes

**Concluído em:** 2026-03-07

- [x] Backend: modelos `Gift` + `GiftPurchase`, schemas Pydantic v2
- [x] Backend: `GET /api/gifts` (filtro sort + category) + `POST /api/gifts/purchase`
- [x] Alembic migration aplicada (`gifts` + `gift_purchases`)
- [x] `src/lib/api.ts` — cliente fetch, lê `VITE_API_URL`
- [x] `src/hooks/useGifts.ts` — migrado de Supabase para FastAPI
- [x] `GiftCard` — badge Esgotado, hover scale
- [x] `CheckoutModal` — React Hook Form + Zod + confetti + auto-close 2.5s
- [x] `GiftList` — filter select, grid 2→3→4, skeletons shimmer
- [x] Supabase removido integralmente (sem `@supabase/supabase-js`)

### EPIC-005 — Engajamento (RSVP & Mural de Recados)

**Concluído em:** 2026-03-12

- [x] Backend: modelos `Rsvp` + `Message`, schemas Pydantic v2 + `email-validator`
- [x] Backend: `POST /api/rsvp` (deduplicação por e-mail) + `GET /api/messages` + `POST /api/messages`
- [x] Alembic migration aplicada (`rsvp` + `messages`)
- [x] `src/hooks/useRsvp.ts` — mutation com sanitização SEC-01
- [x] `src/hooks/useMessages.ts` — query + polling 10 s (`refetchInterval`)
- [x] `RsvpForm` — React Hook Form + Zod + `useFieldArray` para acompanhantes
- [x] `RsvpForm` — sub-form dinâmico só exibido para `confirmed`
- [x] `RsvpForm` — estado de sucesso distinto para confirmado vs declinado
- [x] `MessageBoard` — feed de cards com avatar de iniciais colorido
- [x] `MessageBoard` — formulário inline, scroll ao topo após envio, contagem 500 chars
- [x] `MessageBoard` — skeletons shimmer durante loading, empty state
- [x] `src/utils/avatar.ts` — `getInitials` + `getAvatarColor` determinístico
- [x] Integrado na `HomePage` (substituiu placeholders de Épico 5)

---

## 🔄 Em Andamento

_Nenhum épico em andamento. Todos os épicos 1–5 concluídos._

---

## 📋 Site de Casamento "Luiza e Ian"

> Stack: React + Vite + TypeScript + FastAPI + PostgreSQL + Render.com.

### Épicos

| # | Épico | Arquivo | Status |
|---|---|---|---|
| 1 | Foundation & Setup | `docs/EPIC-1-PLANNING.md` | ✅ Completo |
| 2 | Apresentação e Identidade Visual | `docs/EPIC-2-PLANNING.md` | ✅ Completo |
| 3 | Logística e Geolocalização | `docs/EPIC-3-PLANNING.md` | ✅ Completo |
| 4 | Lista de Presentes | `docs/EPIC-4-PLANNING.md` | ✅ Completo |
| 5 | Engajamento (RSVP & Mural) | `docs/EPIC-5-PLANNING.md` | ✅ Completo |

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
