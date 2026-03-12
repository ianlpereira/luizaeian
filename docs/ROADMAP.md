# 🗺️ Roadmap — Site de Casamento "Luiza e Ian"

## Visão Geral

Site estático/API-first para o casamento de Luiza e Ian. Frontend React + Vite + TypeScript, backend FastAPI + PostgreSQL, hospedados no Render.com.

---

## Status dos Épicos

| # | Épico | Status | Prioridade | Dependências |
|---|---|---|---|---|
| 1 | Foundation & Setup | ✅ Completo | 🔴 Crítica | — |
| 2 | Apresentação e Identidade Visual | ✅ Completo | 🔴 Alta | Épico 1 |
| 3 | Logística e Geolocalização | ✅ Completo | 🟡 Média | Épico 1 |
| 4 | Lista de Presentes | ✅ Completo | 🟡 Média | Épico 1 |
| 5 | Engajamento (RSVP & Mural) | ✅ Completo | 🔴 Alta | Épico 1 |

---

## Linha do Tempo Sugerida

```
Semana 1 ── Épico 1 (Foundation)
              └─ Scaffold Vite + TS
              └─ Tema visual (fonte serif, paleta dourado/rosê)
              └─ Supabase project + tabelas SQL → FastAPI + PostgreSQL
              └─ Deploy inicial no Render

Semana 2 ── Épico 2 (Visual)
              └─ HeroSection (imagem de casal, texto, CTA)
              └─ Gallery (grid responsivo + lightbox)

Semana 3 ── Épico 3 (Logística)  +  Épico 4 (Presentes) [paralelos]
              └─ EventCard + LazyMap + Countdown
              └─ GiftCard + CheckoutModal + Confetti

Semana 4 ── Épico 5 (Engajamento)
              └─ RSVPForm com sub-form de acompanhantes
              └─ Mural de Recados com Realtime

Semana 5 ── Polimento & QA
              └─ Testes de acessibilidade (axe-core)
              └─ Lighthouse performance audit
              └─ Testes em dispositivos reais (iOS Safari / Android Chrome)
              └─ Go-live 🎉
```

---

## Backlog NFRs

| Tag | Requisito | Épico | Status |
|---|---|---|---|
| PERF-01 | LCP < 2.5s (imagens WebP + fetchpriority) | 2 | 🔲 |
| PERF-02 | LazyMap via IntersectionObserver | 3 | 🔲 |
| PERF-03 | Gallery lazy load (loading="lazy") | 2 | 🔲 |
| A11Y-01 | Contraste mínimo 4.5:1 | 1 | 🔲 |
| A11Y-02 | Navegação por teclado no Lightbox (ESC, setas) | 2 | 🔲 |
| SEC-01 | Sanitização DOMPurify em todos os inputs | 5 | 🔲 |
| RESP-01 | Mobile-first, breakpoints 768px / 1024px | 1 | 🔲 |

---

## Estrutura Final Esperada

```
src/
├── components/
│   ├── HeroSection/
│   ├── Gallery/
│   ├── Lightbox/
│   ├── EventCard/
│   ├── LazyMap/
│   ├── Countdown/
│   ├── GiftCard/
│   ├── CheckoutModal/
│   ├── GiftList/
│   ├── RsvpForm/
│   ├── MessageBoard/
│   ├── MessageCard/
│   └── MessageForm/
├── hooks/
│   ├── useGifts.ts
│   ├── usePurchaseGift.ts
│   ├── useRsvp.ts
│   └── useMessages.ts
├── data/
│   └── event.ts
├── lib/
│   └── api.ts
├── stores/
│   └── authStore.ts
├── styles/
│   ├── theme.ts
│   ├── global.ts
│   └── styled.d.ts
├── types/
│   ├── rsvp.ts
│   ├── message.ts
│   └── gift.ts
└── utils/
    ├── sanitize.ts
    ├── breakpoints.ts
    └── avatar.ts
```

---

## Notas de Decisão de Arquitetura

| Decisão | Escolha | Alternativa Considerada | Motivo |
|---|---|---|---|
| Backend | FastAPI próprio | Supabase BaaS | Controle total sobre lógica, modelo de dados e deploy no Render |
| Frontend | Vite + React + TS | Next.js | Site é 100% client-side; Next seria over-engineering |
| Hosting | Render.com | Netlify / Vercel | Suporte nativo a Docker + PostgreSQL gerenciado |
| Estilização | Styled Components | TailwindCSS | Consistência com o padrão do monorepo; tema tipado |
| Realtime | SSE / polling | Supabase Realtime | Próprio FastAPI; sem dependência externa |
| Segurança | DOMPurify + html.escape | Escape manual | Dupla camada: frontend (DOMPurify) + backend (html.escape) |

---

## Critérios de Go-Live

- [ ] Todos os 5 épicos concluídos (checklists internos ✅)
- [ ] Lighthouse Performance ≥ 90 em mobile
- [ ] Sem erros no console em produção (Render logs)
- [ ] RSVP testado com e-mails reais
- [ ] Mural de Recados com Realtime funcionando no mobile
- [ ] Link de acesso enviado ao casal para aprovação final
