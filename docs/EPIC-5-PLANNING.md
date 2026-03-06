# 📝 Épico 5 — Engajamento (RSVP & Mural de Recados)

## Status: 🔲 PLANEJADO

**User Stories:** US 4.1 (Confirmação de Presença / RSVP) · US 4.2 (Mural de Recados)

---

## Contexto

Este épico é o de maior interação com os convidados. O RSVP coleta dados estruturados para o casal planejar a festa. O Mural de Recados usa **Supabase Realtime** para exibir novas mensagens sem recarregar a página — criando uma experiência viva durante o período pré-casamento.

A segurança é crítica aqui: todos os inputs passam por sanitização (`SEC-01`) antes de serem persistidos.

---

## User Stories

### US 4.1 — Confirmação de Presença (RSVP)

**Como** convidado, **quero** confirmar ou recusar minha presença no casamento com meus dados, **para** que o casal saiba quem estará presente.

**Requisitos:**
- Campos: `full_name`, `email`, `status` (Confirmado / Declinado)
- Sub-form dinâmico para adicionar acompanhantes (nome por acompanhante)
- Validação de e-mail e campos obrigatórios
- Prevenção de múltiplos envios (debounce + desabilitar botão após submit)

**Critérios de Aceite:**
- [ ] Validação client-side via Zod (e-mail válido, nome obrigatório)
- [ ] Sub-form de acompanhantes aparece/desaparece dinamicamente
- [ ] Botão "Confirmar" desabilitado durante a mutation e após envio bem-sucedido
- [ ] Mensagem de feedback distinta para "Confirmado" vs "Declinado"
- [ ] Prevenção de e-mail duplicado (Supabase `unique` constraint + erro tratado)

---

### US 4.2 — Mural de Recados

**Como** convidado, **quero** deixar uma mensagem para o casal no site, **para** compartilhar meu afeto de forma pública.

**Requisitos:**
- Feed ordenado por `created_at DESC` (mais recente no topo)
- Sanitização de strings para prevenir XSS (`SEC-01`)
- Exibir iniciais do nome em avatar circular se não houver foto
- Layout tipo "cards" ou "bolhas de chat"
- Supabase Realtime: novas mensagens aparecem sem reload

**Critérios de Aceite:**
- [ ] Inputs sanitizados via `DOMPurify` antes da persistência
- [ ] Avatar com iniciais gerado automaticamente
- [ ] Nova mensagem aparece no feed em tempo real (< 1s de latência)
- [ ] Formulário limpo após envio bem-sucedido
- [ ] Scroll suave para o topo do feed ao enviar nova mensagem

---

## Schema do Banco de Dados

```sql
-- Tabela RSVP (criada no Épico 1, refinada aqui)
create table rsvp (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  status text check (status in ('confirmed', 'declined')) not null,
  companions jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- Índice para prevenir duplicatas por e-mail
create unique index rsvp_email_unique on rsvp(lower(email));

-- Tabela Mural de Recados (criada no Épico 1, refinada aqui)
create table messages (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  content text not null,
  created_at timestamptz default now()
);

-- Habilitar Realtime para messages
alter publication supabase_realtime add table messages;
```

---

## Fases de Implementação

### Fase 5.1 — Tipos e Schemas

**Objetivo:** Definir interfaces TypeScript e schemas Zod para RSVP e Mural.

Tasks:

- [ ] Criar `src/types/rsvp.ts`
- [ ] Criar `src/types/message.ts`
- [ ] Criar `src/components/RsvpForm/schema.ts` com Zod
- [ ] Criar `src/components/MessageForm/schema.ts` com Zod

Interfaces esperadas:

```typescript
// src/types/rsvp.ts
export interface Companion {
  name: string
}

export interface RsvpEntry {
  id: string
  full_name: string
  email: string
  status: 'confirmed' | 'declined'
  companions: Companion[]
  created_at: string
}

export type RsvpStatus = 'confirmed' | 'declined'

// src/types/message.ts
export interface Message {
  id: string
  author_name: string
  content: string
  created_at: string
}
```

Schemas Zod esperados:

```typescript
// src/components/RsvpForm/schema.ts
import { z } from 'zod'

const companionSchema = z.object({
  name: z.string().min(2, 'Nome do acompanhante obrigatório'),
})

export const rsvpSchema = z.object({
  full_name: z.string().min(2, 'Nome completo obrigatório'),
  email: z.string().email('E-mail inválido'),
  status: z.enum(['confirmed', 'declined'], {
    required_error: 'Selecione uma opção',
  }),
  companions: z.array(companionSchema).default([]),
})

export type RsvpFormValues = z.infer<typeof rsvpSchema>

// src/components/MessageForm/schema.ts
import { z } from 'zod'

export const messageSchema = z.object({
  author_name: z.string().min(2, 'Informe seu nome'),
  content: z
    .string()
    .min(3, 'Mensagem muito curta')
    .max(500, 'Mensagem muito longa (máx. 500 caracteres)'),
})

export type MessageFormValues = z.infer<typeof messageSchema>
```

### Fase 5.2 — Hooks: useRsvp e useMessages

**Objetivo:** Hooks de TanStack Query + Supabase Realtime para os dados.

Tasks:

- [ ] Criar `src/hooks/useRsvp.ts` — mutation para enviar RSVP
- [ ] Criar `src/hooks/useMessages.ts` — query + subscription Realtime
- [ ] Implementar sanitização no hook antes de persistir

Padrão esperado:

```typescript
// src/hooks/useRsvp.ts
import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { sanitizeInput } from '@/utils/sanitize'
import type { RsvpFormValues } from '@/components/RsvpForm/schema'

export function useSubmitRsvp() {
  return useMutation({
    mutationFn: async (values: RsvpFormValues) => {
      const payload = {
        full_name: sanitizeInput(values.full_name),
        email: values.email.toLowerCase().trim(),
        status: values.status,
        companions: values.companions.map(c => ({
          name: sanitizeInput(c.name),
        })),
      }
      const { error } = await supabase.from('rsvp').insert(payload)
      if (error) {
        if (error.code === '23505') {
          throw new Error('Este e-mail já foi registrado.')
        }
        throw error
      }
    },
  })
}
```

```typescript
// src/hooks/useMessages.ts
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { sanitizeInput } from '@/utils/sanitize'
import type { Message } from '@/types/message'
import type { MessageFormValues } from '@/components/MessageForm/schema'
import { useMutation } from '@tanstack/react-query'

export function useMessages() {
  const queryClient = useQueryClient()

  // Query inicial
  const query = useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Message[]
    },
  })

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages'] })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [queryClient])

  return query
}

export function usePostMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: MessageFormValues) => {
      const { error } = await supabase.from('messages').insert({
        author_name: sanitizeInput(values.author_name),
        content: sanitizeInput(values.content),
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
    },
  })
}
```

### Fase 5.3 — RsvpForm Component

**Objetivo:** Formulário de RSVP com sub-form dinâmico de acompanhantes.

Tasks:

- [ ] Criar `src/components/RsvpForm/index.tsx`
- [ ] Criar `src/components/RsvpForm/styles.ts`
- [ ] Implementar `useFieldArray` do React Hook Form para acompanhantes
- [ ] Exibir sub-form apenas se status === `'confirmed'`
- [ ] Implementar estado de sucesso pós-envio (substituir form por mensagem de agradecimento)

Padrão do componente:

```typescript
// src/components/RsvpForm/index.tsx
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSubmitRsvp } from '@/hooks/useRsvp'
import { rsvpSchema, type RsvpFormValues } from './schema'
import * as S from './styles'

export function RsvpForm() {
  const { mutate, isPending, isSuccess, error } = useSubmitRsvp()
  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<RsvpFormValues>({ resolver: zodResolver(rsvpSchema) })

  const { fields, append, remove } = useFieldArray({ control, name: 'companions' })
  const status = watch('status')

  if (isSuccess) {
    return (
      <S.SuccessMessage>
        🎉 Presença confirmada! Mal podemos esperar para te ver.
      </S.SuccessMessage>
    )
  }

  return (
    <S.Form onSubmit={handleSubmit(data => mutate(data))}>
      <S.Field>
        <label>Nome completo *</label>
        <input {...register('full_name')} placeholder="Seu nome completo" />
        {errors.full_name && <S.Error>{errors.full_name.message}</S.Error>}
      </S.Field>
      <S.Field>
        <label>E-mail *</label>
        <input {...register('email')} type="email" placeholder="seu@email.com" />
        {errors.email && <S.Error>{errors.email.message}</S.Error>}
      </S.Field>
      <S.Field>
        <label>Confirmação *</label>
        <S.StatusGroup>
          <label>
            <input {...register('status')} type="radio" value="confirmed" />
            ✅ Vou comparecer
          </label>
          <label>
            <input {...register('status')} type="radio" value="declined" />
            ❌ Não poderei ir
          </label>
        </S.StatusGroup>
        {errors.status && <S.Error>{errors.status.message}</S.Error>}
      </S.Field>

      {status === 'confirmed' && (
        <S.CompanionsSection>
          <S.CompanionsTitle>Acompanhantes</S.CompanionsTitle>
          {fields.map((field, index) => (
            <S.CompanionRow key={field.id}>
              <input
                {...register(`companions.${index}.name`)}
                placeholder={`Acompanhante ${index + 1}`}
              />
              <button type="button" onClick={() => remove(index)}>✕</button>
            </S.CompanionRow>
          ))}
          <S.AddCompanionButton type="button" onClick={() => append({ name: '' })}>
            + Adicionar acompanhante
          </S.AddCompanionButton>
        </S.CompanionsSection>
      )}

      {error && <S.Error>{(error as Error).message}</S.Error>}

      <S.SubmitButton type="submit" disabled={isPending}>
        {isPending ? 'Enviando...' : 'Confirmar Presença'}
      </S.SubmitButton>
    </S.Form>
  )
}
```

### Fase 5.4 — MessageBoard Component

**Objetivo:** Feed de recados em tempo real com avatar de iniciais.

Tasks:

- [ ] Criar `src/components/MessageBoard/index.tsx`
- [ ] Criar `src/components/MessageBoard/styles.ts`
- [ ] Criar `src/components/MessageBoard/MessageCard.tsx` — card individual
- [ ] Criar `src/utils/avatar.ts` — função para gerar iniciais e cor de avatar
- [ ] Implementar `MessageForm` integrado ao feed
- [ ] Scroll suave ao topo após novo post

Utilitário de avatar:

```typescript
// src/utils/avatar.ts

const AVATAR_COLORS = [
  '#c9a96e', '#e8b4b8', '#a8c5da', '#b5ccb8',
  '#d4a5a5', '#9b8ea8', '#c4b7a6',
]

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('')
}

export function getAvatarColor(name: string): string {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}
```

Padrão do componente:

```typescript
// src/components/MessageBoard/MessageCard.tsx
import { getInitials, getAvatarColor } from '@/utils/avatar'
import * as S from './styles'
import type { Message } from '@/types/message'

interface MessageCardProps {
  message: Message
}

export function MessageCard({ message }: MessageCardProps) {
  const initials = getInitials(message.author_name)
  const avatarColor = getAvatarColor(message.author_name)
  const date = new Date(message.created_at).toLocaleDateString('pt-BR')

  return (
    <S.Card>
      <S.Avatar style={{ backgroundColor: avatarColor }}>{initials}</S.Avatar>
      <S.Body>
        <S.Author>{message.author_name}</S.Author>
        <S.Content>{message.content}</S.Content>
        <S.Date>{date}</S.Date>
      </S.Body>
    </S.Card>
  )
}
```

### Fase 5.5 — Integração na Home Page

Tasks:

- [ ] Adicionar seção RSVP (`#rsvp`) à `HomePage`
- [ ] Adicionar seção Mural de Recados (`#mural`) à `HomePage`
- [ ] Atualizar scroll do Hero para incluir navegação por âncoras
- [ ] Verificar ordem das seções: Hero → Gallery → Localização → Presentes → RSVP → Mural

---

## Estimativa de Tempo

| Fase | Tarefas | Tempo |
|---|---|---|
| 5.1 Tipos e Schemas | 4 tasks | 1-2h |
| 5.2 Hooks | 4 tasks | 3-4h |
| 5.3 RsvpForm | 6 tasks | 4-5h |
| 5.4 MessageBoard | 5 tasks | 4-5h |
| 5.5 Integração | 4 tasks | 1-2h |
| **TOTAL ÉPICO 5** | **23 tasks** | **~13-18h** |

---

## Checklist de Conclusão

- [ ] RSVP persiste corretamente no Supabase
- [ ] E-mail duplicado retorna erro amigável (sem expor código SQL)
- [ ] Sub-form de acompanhantes exibido apenas para `confirmed`
- [ ] Sanitização ativa: tentar injetar `<script>alert(1)</script>` não executa
- [ ] Mensagem aparece no feed em tempo real (Realtime funcional)
- [ ] Avatar com iniciais exibido corretamente
- [ ] Formulário de recado limpo após envio

---

## Dependências

- Épico 1 concluído (Supabase com `rsvp` e `messages` + Realtime habilitado)
- `DOMPurify` instalado (Épico 1 — NFR SEC-01)
- `canvas-confetti` (opcional no RSVP — já instalado no Épico 4)

---

## NFRs Cobertos neste Épico

| Tag | Requisito | Implementação |
|---|---|---|
| SEC-01 | Data Sanitization | `sanitizeInput` via DOMPurify em todos os campos antes de INSERT |
| RESP-01 | Mobile First | Forms com `width: 100%`, inputs com `font-size: 16px` (evita zoom no iOS) |

---

## Próximos Passos

Com o Épico 5 concluído, todos os épicos do backlog original estão entregues.

Melhorias possíveis pós-lançamento:

- Painel administrativo para o casal visualizar RSVPs e recados
- Envio de e-mail de confirmação via Supabase Edge Functions
- Countdown animado na Hero Section
- Música de fundo opcional (toggle)

---

**Status:** Aguardando conclusão do Épico 4
**Prioridade:** ALTA — funcionalidade essencial para logística do evento
