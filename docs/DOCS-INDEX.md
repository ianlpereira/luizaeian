# 📚 Índice de Documentação — Luiza e Ian 💍

## 🎯 Comece por Aqui

**Se é a primeira vez aqui:** Leia nesta ordem:
1. `README.md` — Overview geral do projeto
2. `ROADMAP.md` — Status dos épicos e timeline
3. `EPIC-1-PLANNING.md` — Setup inicial e fundação técnica

---

## 📋 Documentação dos Épicos

### 🏗️ ÉPICO 1: Fundação & Setup
- **Arquivo:** `EPIC-1-PLANNING.md`
- **Escopo:** Estrutura do projeto, stack, deploy target, NFRs baseline
- **US:** —
- **Status:** ✅ Completo

### 🎨 ÉPICO 2: Apresentação e Identidade Visual
- **Arquivo:** `EPIC-2-PLANNING.md`
- **Escopo:** Hero Section + Galeria do Pré-Wedding
- **US:** US 1.1, US 1.2
- **Status:** 🔲 Planejado

### 📍 ÉPICO 3: Logística e Geolocalização
- **Arquivo:** `EPIC-3-PLANNING.md`
- **Escopo:** Cards de endereço, integração Google Maps, deep links
- **US:** US 2.1
- **Status:** 🔲 Planejado

### 🎁 ÉPICO 4: Lista de Presentes
- **Arquivo:** `EPIC-4-PLANNING.md`
- **Escopo:** Catálogo de presentes + Checkout simulado + persistência Supabase
- **US:** US 3.1, US 3.2
- **Status:** 🔲 Planejado

### 📝 ÉPICO 5: Engajamento (RSVP & Mural)
- **Arquivo:** `EPIC-5-PLANNING.md`
- **Escopo:** Confirmação de presença + Mural de recados em tempo real
- **US:** US 4.1, US 4.2
- **Status:** 🔲 Planejado

---

## 📊 Referências Gerais

- `STATUS.md` — Checklist geral de progresso
- `ROADMAP.md` — Visão completa, timeline e prioridades
- `../README.md` — Quick start e arquitetura

---

## 🚀 Fluxo Recomendado

### Novo no projeto?
1. Leia `README.md`
2. Leia `ROADMAP.md`
3. Leia `EPIC-1-PLANNING.md`

### Desenvolvedor iniciando um épico?
1. Leia o doc do épico correspondente
2. Verifique o checklist pré-épico no final do doc
3. Siga as fases em ordem

---

## 📞 Referências Rápidas

### URLs Locais (dev)
```
Frontend:  http://localhost:5173
Supabase:  https://app.supabase.com (dashboard)
```

### NFRs Globais

| Tag       | Requisito             | Meta técnica                                       |
|-----------|-----------------------|----------------------------------------------------|
| PERF-01   | Image Optimization    | WebP + Sharp/API; LCP < 2.5s                       |
| RESP-01   | Mobile First          | Breakpoints: 360px, 390px, 414px                   |
| SEC-01    | Data Sanitization     | Inputs de RSVP e Mural sanitizados contra XSS      |
| HOST-01   | Edge Deployment       | Vercel ou Firebase Hosting (CDN)                   |

---

## ✨ Última Atualização

**Data:** 2026-03-06
**Status:** Documentação criada — aguardando início do Épico 1
