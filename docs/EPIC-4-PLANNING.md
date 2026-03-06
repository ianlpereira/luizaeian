# 🎁 Épico 4 — Lista de Presentes (Mocked E-commerce)

## Status: 🔲 PLANEJADO

**User Stories:** US 3.1 (Catálogo de Presentes) · US 3.2 (Fluxo de Checkout Simulado)

---

## Contexto

A lista de presentes é uma das funcionalidades mais interativas do site. O checkout é **simulado** — não há gateway de pagamento real, apenas registro no Supabase. O desafio técnico está na gestão de estado de cotas (stock), feedback visual de sucesso e prevenção de dupla compra.

---

## User Stories

### US 3.1 — Catálogo de Presentes

**Como** convidado, **quero** navegar pela lista de presentes e filtrar por preço, **para** escolher um presente dentro do meu orçamento.

**Requisitos:**
- Data Schema: `id`, `title`, `price`, `image_url`, `category`, `stock_limit`
- Filtro por preço: Crescente / Decrescente
- Badge "Esgotado" quando `stock_limit` chega a zero
- Cards com design uniforme e imagem

**Critérios de Aceite:**
- [ ] Cards com dimensões uniformes (usar `aspect-ratio` nas imagens)
- [ ] Badge "Esgotado" visível quando `stock_limit === 0 || purchased === true`
- [ ] Filtro de ordenação por preço funcional (sem reload de página)
- [ ] Loading skeleton durante fetch do Supabase

---

### US 3.2 — Fluxo de Checkout (Simulado)

**Como** convidado, **quero** "comprar" um presente com meu nome e uma mensagem, **para** que o casal saiba de quem veio.

**Requisitos:**
- Modal com formulário: `nome`, `mensagem`, `valor` (se cota aberta)
- Persistência no Supabase: atualizar `purchased: true` ou decrementar `stock_limit`
- Feedback visual: animação de confetes ou micro-animação de sucesso
- Prevenção de dupla compra: desabilitar item após registro

**Critérios de Aceite:**
- [ ] Formulário com validação via Zod (nome obrigatório, mensagem opcional)
- [ ] Após submit, item marcado como comprado no banco e na UI (otimistic update)
- [ ] Animação de sucesso exibida após confirmação
- [ ] Item esgotado não pode ser selecionado novamente
- [ ] Botão de submit desabilitado durante a mutation (previne duplo envio)

---

## Schema do Banco de Dados

```sql
-- Tabela gifts (criada no Épico 1)
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

-- Tabela gift_purchases: registra quem deu cada presente
create table gift_purchases (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid references gifts(id) not null,
  buyer_name text not null,
  message text,
  amount numeric(10,2),
  created_at timestamptz default now()
);
```

---

## Fases de Implementação

### Fase 4.1 — Supabase: Seed e Tipos

**Objetivo:** Popular o banco com dados iniciais e gerar types TypeScript.

Tasks:

- [ ] Criar seed SQL com presentes do casal (`supabase/seed.sql`)
- [ ] Criar `src/types/gift.ts` com as interfaces TypeScript

Interfaces TypeScript esperadas:

```typescript
// src/types/gift.ts
export interface Gift {
  id: string
  title: string
  price: number
  image_url: string | null
  category: string
  stock_limit: number
  purchased: boolean
  created_at: string
}

export type GiftSortOrder = 'asc' | 'desc'

export interface GiftFilters {
  sortOrder: GiftSortOrder
  category?: string
}

export interface GiftPurchasePayload {
  gift_id: string
  buyer_name: string
  message?: string
  amount?: number
}
```

### Fase 4.2 — Hook: useGifts

**Objetivo:** Custom hook para buscar e filtrar presentes.

Tasks:

- [ ] Criar `src/hooks/useGifts.ts` com TanStack Query
- [ ] Implementar `usePurchaseGift` — mutation que persiste no Supabase
- [ ] Implementar invalidação de cache após compra

Padrão esperado:

```typescript
// src/hooks/useGifts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Gift, GiftFilters, GiftPurchasePayload } from '@/types/gift'

export function useGifts(filters: GiftFilters) {
  return useQuery({
    queryKey: ['gifts', filters],
    queryFn: async () => {
      const query = supabase
        .from('gifts')
        .select('*')
        .order('price', { ascending: filters.sortOrder === 'asc' })

      const { data, error } = await query
      if (error) throw error
      return data as Gift[]
    },
  })
}

export function usePurchaseGift() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: GiftPurchasePayload) => {
      // 1. Registrar a compra
      const { error: purchaseError } = await supabase
        .from('gift_purchases')
        .insert(payload)
      if (purchaseError) throw purchaseError

      // 2. Decrementar stock ou marcar como comprado
      const { error: updateError } = await supabase.rpc('decrement_gift_stock', {
        gift_id: payload.gift_id,
      })
      if (updateError) throw updateError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gifts'] })
    },
  })
}
```

Supabase RPC function:

```sql
-- Função para decrementar stock de forma atômica
create or replace function decrement_gift_stock(gift_id uuid)
returns void language plpgsql as $$
begin
  update gifts
  set
    stock_limit = greatest(stock_limit - 1, 0),
    purchased = case when stock_limit <= 1 then true else purchased end
  where id = gift_id;
end;
$$;
```

### Fase 4.3 — GiftCard Component

**Objetivo:** Card individual de presente com badge de esgotado.

Tasks:

- [ ] Criar `src/components/GiftCard/index.tsx`
- [ ] Criar `src/components/GiftCard/styles.ts`
- [ ] Implementar badge "Esgotado" condicional
- [ ] Aplicar hover com leve `scale` e `box-shadow`
- [ ] Garantir `aspect-ratio` na imagem para evitar CLS
- [ ] Botão "Presentear" desabilitado quando esgotado

Padrão do componente:

```typescript
// src/components/GiftCard/index.tsx
import * as S from './styles'
import type { Gift } from '@/types/gift'

interface GiftCardProps {
  gift: Gift
  onSelect: (gift: Gift) => void
}

export function GiftCard({ gift, onSelect }: GiftCardProps) {
  const isUnavailable = gift.purchased || gift.stock_limit === 0

  return (
    <S.Card aria-disabled={isUnavailable}>
      <S.ImageWrapper>
        <img
          src={gift.image_url ?? '/images/gift-placeholder.webp'}
          alt={gift.title}
          loading="lazy"
        />
        {isUnavailable && <S.SoldOutBadge>Esgotado</S.SoldOutBadge>}
      </S.ImageWrapper>
      <S.Body>
        <S.Category>{gift.category}</S.Category>
        <S.Title>{gift.title}</S.Title>
        <S.Price>
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(gift.price)}
        </S.Price>
        <S.Button
          onClick={() => !isUnavailable && onSelect(gift)}
          disabled={isUnavailable}
        >
          {isUnavailable ? 'Esgotado' : 'Presentear 🎁'}
        </S.Button>
      </S.Body>
    </S.Card>
  )
}
```

### Fase 4.4 — CheckoutModal Component

**Objetivo:** Modal de confirmação de presente com formulário validado.

Tasks:

- [ ] Criar `src/components/CheckoutModal/index.tsx`
- [ ] Criar `src/components/CheckoutModal/styles.ts`
- [ ] Criar schema Zod para o formulário
- [ ] Implementar feedback de sucesso com `canvas-confetti`
- [ ] Fechar modal após sucesso com delay de 2 segundos
- [ ] Exibir erro se a mutation falhar

Schema Zod esperado:

```typescript
// src/components/CheckoutModal/schema.ts
import { z } from 'zod'

export const checkoutSchema = z.object({
  buyer_name: z.string().min(2, 'Informe seu nome completo'),
  message: z.string().max(300, 'Mensagem muito longa').optional(),
  amount: z.number().positive('Valor deve ser positivo').optional(),
})

export type CheckoutFormValues = z.infer<typeof checkoutSchema>
```

Padrão do componente:

```typescript
// src/components/CheckoutModal/index.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import confetti from 'canvas-confetti'
import { Modal } from 'antd'
import { usePurchaseGift } from '@/hooks/useGifts'
import { checkoutSchema, type CheckoutFormValues } from './schema'
import * as S from './styles'
import type { Gift } from '@/types/gift'

interface CheckoutModalProps {
  gift: Gift
  onClose: () => void
}

export function CheckoutModal({ gift, onClose }: CheckoutModalProps) {
  const { mutate, isPending } = usePurchaseGift()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormValues>({ resolver: zodResolver(checkoutSchema) })

  const onSubmit = (values: CheckoutFormValues) => {
    mutate(
      { gift_id: gift.id, ...values },
      {
        onSuccess: () => {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })
          setTimeout(onClose, 2500)
        },
      }
    )
  }

  return (
    <Modal open onCancel={onClose} footer={null} title={`Presentear: ${gift.title}`}>
      <S.Form onSubmit={handleSubmit(onSubmit)}>
        <S.Field>
          <label>Seu nome *</label>
          <input {...register('buyer_name')} placeholder="Nome completo" />
          {errors.buyer_name && <S.Error>{errors.buyer_name.message}</S.Error>}
        </S.Field>
        <S.Field>
          <label>Mensagem para o casal</label>
          <textarea {...register('message')} placeholder="Escreva uma mensagem..." />
          {errors.message && <S.Error>{errors.message.message}</S.Error>}
        </S.Field>
        <S.SubmitButton type="submit" disabled={isPending}>
          {isPending ? 'Enviando...' : 'Confirmar presente 🎁'}
        </S.SubmitButton>
      </S.Form>
    </Modal>
  )
}
```

### Fase 4.5 — GiftList Page/Section

**Objetivo:** Montar a seção completa com filtros, grid e modal.

Tasks:

- [ ] Criar `src/components/GiftList/index.tsx` — seção completa
- [ ] Criar `src/components/GiftList/styles.ts`
- [ ] Implementar barra de filtros (Select de ordenação, filtro por categoria)
- [ ] Implementar skeleton loading (usando Ant Design `Skeleton` ou custom)
- [ ] Integrar `GiftCard` + `CheckoutModal` na mesma seção
- [ ] Integrar na `HomePage` com âncora `#presentes`

Padrão:

```typescript
// src/components/GiftList/index.tsx
import { useState } from 'react'
import { Select } from 'antd'
import { useGifts } from '@/hooks/useGifts'
import { GiftCard } from '@/components/GiftCard'
import { CheckoutModal } from '@/components/CheckoutModal'
import type { Gift, GiftFilters } from '@/types/gift'
import * as S from './styles'

export function GiftList() {
  const [filters, setFilters] = useState<GiftFilters>({ sortOrder: 'asc' })
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null)
  const { data: gifts, isLoading } = useGifts(filters)

  return (
    <S.Section id="presentes">
      <S.SectionTitle>Lista de Presentes</S.SectionTitle>
      <S.FilterBar>
        <Select
          value={filters.sortOrder}
          onChange={(v) => setFilters(f => ({ ...f, sortOrder: v }))}
          options={[
            { value: 'asc', label: 'Menor preço primeiro' },
            { value: 'desc', label: 'Maior preço primeiro' },
          ]}
        />
      </S.FilterBar>
      <S.Grid>
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <S.SkeletonCard key={i} />)
          : gifts?.map(gift => (
              <GiftCard key={gift.id} gift={gift} onSelect={setSelectedGift} />
            ))
        }
      </S.Grid>
      {selectedGift && (
        <CheckoutModal
          gift={selectedGift}
          onClose={() => setSelectedGift(null)}
        />
      )}
    </S.Section>
  )
}
```

---

## Estimativa de Tempo

| Fase | Tarefas | Tempo |
|---|---|---|
| 4.1 Seed e Tipos | 2 tasks | 1h |
| 4.2 Hook useGifts | 3 tasks | 2-3h |
| 4.3 GiftCard | 5 tasks | 3-4h |
| 4.4 CheckoutModal | 5 tasks | 4-5h |
| 4.5 GiftList Section | 6 tasks | 3-4h |
| **TOTAL ÉPICO 4** | **21 tasks** | **~13-17h** |

---

## Checklist de Conclusão

- [ ] Presentes carregam do Supabase sem erros
- [ ] Filtro de ordenação por preço funcional
- [ ] Badge "Esgotado" exibido corretamente
- [ ] Checkout persiste `gift_purchases` no Supabase
- [ ] `stock_limit` decrementado corretamente via RPC
- [ ] Confetes exibidos após sucesso
- [ ] Botão de submit desabilitado durante mutation (sem duplo envio)
- [ ] Modal fecha automaticamente após 2.5s de sucesso

---

## Dependências

- Épico 1 concluído (Supabase configurado, tabelas `gifts` e `gift_purchases` criadas)
- Lista de presentes definida pelo casal (nome, preço, categoria, imagem)
- `canvas-confetti` instalado: `npm install canvas-confetti`
- `@types/canvas-confetti` instalado: `npm install -D @types/canvas-confetti`

---

## Próximos Passos (Épico 5)

Após concluir este épico:

1. Formulário RSVP com validação e sub-form de acompanhantes
2. Mural de recados com feed em tempo real (Supabase Realtime)

---

**Status:** Aguardando conclusão do Épico 3
**Prioridade:** ALTA — funcionalidade de alto engajamento
