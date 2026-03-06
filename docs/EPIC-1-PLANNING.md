# 🏗️ Épico 1 — Fundação & Setup

## Status: 🔲 PLANEJADO

Este documento descreve o setup completo da **Épico 1 (Foundation)** do projeto Wedding Site "Luiza e Ian".

---

## Contexto

O site de casamento será a principal interface dos convidados, acessada majoritariamente via mobile/WhatsApp. O Épico 1 estabelece toda a fundação técnica para que os épicos subsequentes possam ser construídos com qualidade, performance e manutenibilidade.

**Persona primária:** Convidados de casamento — mobile-first, chegam via link no WhatsApp.

---

## Objetivos

- Estrutura de projeto React + Vite + TypeScript configurada e funcional
- Supabase configurado como Backend as a Service (BaaS)
- Deploy edge (Vercel) provisionado com preview automático por PR
- NFRs globais implementados como base: WebP, mobile-first, sanitização
- Theme system com tipografia elegante e tokens de design centralizados

---

## Stack Definida

| Camada | Tecnologia | Observação |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript | Strict mode obrigatório |
| Estilização | Styled Components | CSS-in-JS; sem Tailwind/CSS Modules |
| BaaS | Supabase | Postgres gerenciado + Realtime + Storage |
| Forms | React Hook Form + Zod | Validação type-safe |
| Server State | TanStack Query | Cache + revalidação automática |
| Client State | Zustand | Estado leve de UI |
| HTTP | Supabase JS Client + Axios | Supabase SDK para BaaS; Axios para externos |
| Deploy | Vercel | Edge CDN, preview por PR, domínio custom |
| Imagens | WebP + lazy load nativo | Sharp/API para conversão |

---

## Fases de Implementação

### Fase 1.1 — Scaffold do Projeto

**Objetivo:** Criar a estrutura de pastas e arquivos base.

Tasks:

- [ ] `npm create vite@latest luizaeian -- --template react-ts`
- [ ] Configurar `tsconfig.json` com strict mode e path aliases (`@/`)
- [ ] Instalar todas as dependências da stack
- [ ] Configurar `vite.config.ts` com alias e proxy (se necessário)

Estrutura esperada:

```text
src/
├── components/        # Componentes reutilizáveis
│   └── Layout/
│       ├── index.tsx
│       └── styles.ts
├── pages/             # Componentes de rota
├── hooks/             # Custom hooks (TanStack Query wrappers)
├── lib/               # Clientes (supabase.ts, api.ts)
├── stores/            # Zustand stores
├── types/             # TypeScript types compartilhados
├── styles/
│   ├── theme.ts       # Design tokens
│   ├── global.ts      # GlobalStyles
│   └── styled.d.ts    # DefaultTheme augmentation
├── utils/             # Helpers puros
├── App.tsx
└── main.tsx
```

### Fase 1.2 — Theme System

**Objetivo:** Criar o sistema de design com tipografia elegante para casamento.

Tasks:

- [ ] Definir paleta de cores (tons neutros, dourado, rose gold)
- [ ] Escolher e importar fontes via Google Fonts (serif elegante + sans clean)
- [ ] Criar `src/styles/theme.ts` com tokens completos: `colors`, `typography`, `spacing`, `shadows`, `breakpoints`
- [ ] Criar `src/styles/global.ts` com reset e importação de fontes
- [ ] Criar `src/styles/styled.d.ts` augmentando `DefaultTheme`

Padrão esperado:

```typescript
// src/styles/theme.ts
export const theme = {
  colors: {
    primary: '#c9a96e',      // dourado
    secondary: '#f5e6d3',    // rose gold claro
    background: '#faf9f7',   // off-white elegante
    surface: '#ffffff',
    text: {
      primary: '#2c2c2c',
      secondary: '#7a7a7a',
      inverse: '#ffffff',
    },
    border: '#e8e0d6',
  },
  typography: {
    fontFamily: {
      serif: "'Playfair Display', Georgia, serif",
      sans: "'Inter', -apple-system, sans-serif",
    },
    fontSize: {
      xs: '12px', sm: '14px', md: '16px',
      lg: '20px', xl: '28px', xxl: '40px', hero: '56px',
    },
    fontWeight: { regular: 400, medium: 500, bold: 700 },
  },
  spacing: {
    xs: '4px', sm: '8px', md: '16px',
    lg: '24px', xl: '48px', xxl: '80px',
  },
  breakpoints: {
    xs: '360px', sm: '390px', md: '414px',
    lg: '768px', xl: '1024px', xxl: '1440px',
  },
} as const
```

### Fase 1.3 — Supabase Setup

**Objetivo:** Configurar o BaaS com todas as tabelas e políticas necessárias.

Tasks:

- [ ] Criar projeto no Supabase (https://app.supabase.com)
- [ ] Criar `src/lib/supabase.ts` com cliente configurado
- [ ] Configurar variáveis de ambiente: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- [ ] Criar schema inicial no Supabase SQL Editor:
  - [ ] Tabela `gifts` (Épico 4)
  - [ ] Tabela `rsvp` (Épico 5)
  - [ ] Tabela `messages` (Épico 5)
- [ ] Configurar Row Level Security (RLS) básico
- [ ] Habilitar Supabase Realtime para tabela `messages`

Schema SQL esperado:

```sql
-- Lista de presentes
create table gifts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  price numeric(10,2) not null,
  image_url text,
  category text not null,
  stock_limit int default 1,
  purchased boolean default false,
  created_at timestamptz default now()
);

-- Confirmação de presença
create table rsvp (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  status text check (status in ('confirmed', 'declined')) not null,
  companions jsonb default '[]',
  created_at timestamptz default now()
);

-- Mural de recados
create table messages (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  content text not null,
  created_at timestamptz default now()
);
```

Padrão do cliente Supabase:

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Fase 1.4 — Roteamento e Layout Base

**Objetivo:** Configurar React Router e layout shell da aplicação.

Tasks:

- [ ] Instalar e configurar React Router v6
- [ ] Criar `src/App.tsx` com `BrowserRouter` e rotas iniciais
- [ ] Criar `src/components/Layout/` com shell responsivo (sem nav complexa — site one-page)
- [ ] Criar página inicial `src/pages/Home/` com scroll por seções
- [ ] Criar `src/pages/NotFound/` — página 404

Estrutura de rotas esperada:

```typescript
// site one-page: rota única com seções ancoradas
const routes = [
  { path: '/', element: <HomePage /> },
  { path: '*', element: <NotFoundPage /> },
]
```

### Fase 1.5 — Deploy Vercel

**Objetivo:** Provisionamento do ambiente de produção e preview.

Tasks:

- [ ] Criar projeto no Vercel vinculado ao repositório GitHub
- [ ] Configurar variáveis de ambiente no painel Vercel:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- [ ] Configurar domínio customizado (se disponível)
- [ ] Verificar preview automático em PRs
- [ ] Testar build de produção: `npm run build && npm run preview`

### Fase 1.6 — NFRs Baseline

**Objetivo:** Implementar os requisitos não-funcionais como fundação.

Tasks:

- [ ] **PERF-01:** Configurar `<img loading="lazy">` como padrão em componentes de imagem; criar utilitário `getWebPUrl(url)` para transformar URLs com WebP via Supabase Storage ou CDN
- [ ] **RESP-01:** Validar breakpoints no theme; criar `src/utils/breakpoints.ts` com helpers de media query para Styled Components
- [ ] **SEC-01:** Instalar `dompurify`; criar `src/utils/sanitize.ts` com `sanitizeInput(str: string): string`
- [ ] **HOST-01:** Vercel configurado na Fase 1.5

Utilitários esperados:

```typescript
// src/utils/sanitize.ts
import DOMPurify from 'dompurify'

export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
}

// src/utils/breakpoints.ts
import { theme } from '@/styles/theme'

export const media = {
  mobile: `@media (max-width: ${theme.breakpoints.md})`,
  tablet: `@media (min-width: ${theme.breakpoints.lg})`,
  desktop: `@media (min-width: ${theme.breakpoints.xl})`,
}
```

---

## Estimativa de Tempo

| Fase | Tarefas | Tempo |
|---|---|---|
| 1.1 Scaffold | 4 tasks | 1-2h |
| 1.2 Theme System | 5 tasks | 2-3h |
| 1.3 Supabase Setup | 8 tasks | 2-3h |
| 1.4 Roteamento | 5 tasks | 1-2h |
| 1.5 Deploy Vercel | 5 tasks | 1-2h |
| 1.6 NFRs Baseline | 4 tasks | 1-2h |
| **TOTAL ÉPICO 1** | **31 tasks** | **~8-14h** |

---

## Prioridades

1. **Alta:** Fases 1.1, 1.2 e 1.3 — bloqueiam todos os outros épicos
2. **Alta:** Fase 1.6 — NFRs devem ser base, não afterthought
3. **Média:** Fase 1.4 — roteamento simples (one-page)
4. **Média:** Fase 1.5 — deploy importante, mas não bloqueia desenvolvimento

---

## Checklist de Conclusão

- [ ] `npm run build` sem erros TypeScript
- [ ] Supabase conectado (query simples retorna dados)
- [ ] Theme aplicado e fontes carregando
- [ ] Utilitários `sanitizeInput` e `getWebPUrl` funcionando
- [ ] Deploy no Vercel com preview de PR ativo
- [ ] LCP da página inicial < 2.5s (medir via Lighthouse)

---

## Dependências

- Conta no Supabase (https://app.supabase.com) — gratuita
- Conta no Vercel (https://vercel.com) — gratuita
- Node 20+
- Repositório Git configurado

---

## Próximos Passos (Épico 2)

Após concluir este épico:

1. Hero Section com foto de capa (LCP otimizado)
2. Galeria do Pré-Wedding com Grid responsivo e Lightbox
3. Integração de imagens via Supabase Storage

---

**Status:** Planejado para início
**Prioridade:** ALTA — bloqueador de todos os épicos
