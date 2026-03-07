# 📍 Épico 3 — Logística e Geolocalização

## Status: ✅ COMPLETO

**User Story:** US 2.1 (Localização e Mapas)

---

## Contexto

Os convidados precisam saber exatamente onde e quando se apresentar. Esta seção deve funcionar perfeitamente offline (texto) e oferecer integração direta com o app de mapas nativo do celular via deep links. O mapa embutido (Google Maps Embed) deve ser carregado de forma assíncrona para não bloquear a thread principal.

---

## User Story

### US 2.1 — Localização e Mapas

**Como** convidado, **quero** visualizar o endereço do evento e abrir diretamente no meu app de mapas, **para** chegar ao local sem dificuldades.

**Requisitos:**
- Cards com endereço em texto plano (legível sem internet)
- Botão "Como Chegar" com deep links para Waze e Google Maps
- Google Maps Embed carregado de forma assíncrona (lazy iframe)
- Informações adicionais: data, horário, dress code

**Critérios de Aceite:**
- [ ] Botão "Como Chegar" abre app nativo (Waze ou Google Maps) no mobile
- [ ] Google Maps Embed não bloqueia o Main Thread (carrega fora do viewport)
- [ ] Informações do evento visíveis sem JavaScript (SSR-ready / texto estático)
- [ ] Layout de cards responsivo e elegante em mobile

---

## Fases de Implementação

### Fase 3.1 — EventInfo Component

**Objetivo:** Card com todas as informações do evento.

Tasks:

- [ ] Criar `src/components/EventInfo/index.tsx` — card de informações do evento
- [ ] Criar `src/components/EventInfo/styles.ts` — Styled Components
- [ ] Criar `src/data/event.ts` — dados estáticos do evento (data, horário, local, dress code)
- [ ] Implementar layout com ícones (usar emojis ou `@ant-design/icons`)

Dados estáticos esperados:

```typescript
// src/data/event.ts
export const eventInfo = {
  couple: 'Luiza & Ian',
  date: '2026-11-14',
  dateFormatted: '14 de Novembro de 2026',
  time: '18h00',
  ceremony: {
    name: 'Igreja Nossa Senhora da Graça',
    address: 'Rua das Flores, 123 — Jardim Europa, São Paulo, SP',
    mapsQuery: 'Igreja+Nossa+Senhora+da+Graca+Sao+Paulo',
    wazeLat: -23.5489,
    wazeLng: -46.6388,
    mapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!...',
  },
  reception: {
    name: 'Espaço Villa Jardim',
    address: 'Av. das Palmeiras, 456 — Alto de Pinheiros, São Paulo, SP',
    mapsQuery: 'Espaco+Villa+Jardim+Sao+Paulo',
    wazeLat: -23.5499,
    wazeLng: -46.6400,
    mapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!...',
  },
  dressCode: 'Traje social — tons neutros e pastel',
}
```

Padrão do componente:

```typescript
// src/components/EventInfo/index.tsx
import * as S from './styles'
import { eventInfo } from '@/data/event'

export function EventInfo() {
  return (
    <S.Section id="local">
      <S.SectionTitle>Informações do Evento</S.SectionTitle>
      <S.Grid>
        <EventCard
          icon="⛪"
          title="Cerimônia"
          name={eventInfo.ceremony.name}
          address={eventInfo.ceremony.address}
          time={`${eventInfo.dateFormatted} — ${eventInfo.time}`}
          mapsQuery={eventInfo.ceremony.mapsQuery}
          wazeLat={eventInfo.ceremony.wazeLat}
          wazeLng={eventInfo.ceremony.wazeLng}
          mapsEmbedUrl={eventInfo.ceremony.mapsEmbedUrl}
        />
        <EventCard
          icon="🥂"
          title="Recepção"
          name={eventInfo.reception.name}
          address={eventInfo.reception.address}
          mapsQuery={eventInfo.reception.mapsQuery}
          wazeLat={eventInfo.reception.wazeLat}
          wazeLng={eventInfo.reception.wazeLng}
          mapsEmbedUrl={eventInfo.reception.mapsEmbedUrl}
        />
      </S.Grid>
      <S.DressCode>
        <span>👔</span>
        <strong>Dress Code:</strong> {eventInfo.dressCode}
      </S.DressCode>
    </S.Section>
  )
}
```

### Fase 3.2 — EventCard Component

**Objetivo:** Card individual de local com deep links e mapa.

Tasks:

- [ ] Criar `src/components/EventCard/index.tsx`
- [ ] Criar `src/components/EventCard/styles.ts`
- [ ] Implementar deep links para Google Maps e Waze
- [ ] Implementar `LazyMap` — iframe do Google Maps com Intersection Observer
- [ ] Garantir que deep links funcionam em iOS e Android

Deep links esperados:

```typescript
// src/utils/maps.ts

/**
 * Gera deep link para Google Maps (app nativo ou web).
 * iOS e Android abrem o app se instalado.
 */
export function getGoogleMapsUrl(query: string): string {
  return `https://maps.google.com/?q=${encodeURIComponent(query)}`
}

/**
 * Gera deep link para Waze com lat/lng.
 * Abre o app Waze se instalado, web se não.
 */
export function getWazeUrl(lat: number, lng: number): string {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
}
```

Padrão do componente `EventCard`:

```typescript
// src/components/EventCard/index.tsx
import { getGoogleMapsUrl, getWazeUrl } from '@/utils/maps'
import { LazyMap } from './LazyMap'
import * as S from './styles'

interface EventCardProps {
  icon: string
  title: string
  name: string
  address: string
  time?: string
  mapsQuery: string
  wazeLat: number
  wazeLng: number
  mapsEmbedUrl: string
}

export function EventCard({
  icon, title, name, address, time,
  mapsQuery, wazeLat, wazeLng, mapsEmbedUrl,
}: EventCardProps) {
  return (
    <S.Card>
      <S.Header>
        <span>{icon}</span>
        <S.Title>{title}</S.Title>
      </S.Header>
      <S.Venue>{name}</S.Venue>
      <S.Address>{address}</S.Address>
      {time && <S.Time>{time}</S.Time>}
      <LazyMap embedUrl={mapsEmbedUrl} title={`Mapa — ${name}`} />
      <S.Actions>
        <S.MapButton
          as="a"
          href={getGoogleMapsUrl(mapsQuery)}
          target="_blank"
          rel="noopener noreferrer"
        >
          🗺️ Google Maps
        </S.MapButton>
        <S.WazeButton
          as="a"
          href={getWazeUrl(wazeLat, wazeLng)}
          target="_blank"
          rel="noopener noreferrer"
        >
          🚗 Waze
        </S.WazeButton>
      </S.Actions>
    </S.Card>
  )
}
```

### Fase 3.3 — LazyMap Component

**Objetivo:** Carregar o iframe do Google Maps somente quando entrar na viewport.

Tasks:

- [ ] Criar `src/components/EventCard/LazyMap.tsx`
- [ ] Implementar `IntersectionObserver` para carregar o iframe sob demanda
- [ ] Exibir placeholder skeleton enquanto o mapa não está visível
- [ ] Garantir que o iframe não bloqueia o Main Thread antes do scroll

Padrão esperado:

```typescript
// src/components/EventCard/LazyMap.tsx
import { useEffect, useRef, useState } from 'react'
import * as S from './styles'

interface LazyMapProps {
  embedUrl: string
  title: string
}

export function LazyMap({ embedUrl, title }: LazyMapProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <S.MapContainer ref={ref}>
      {isVisible ? (
        <iframe
          src={embedUrl}
          title={title}
          width="100%"
          height="200"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <S.MapSkeleton aria-label="Carregando mapa..." />
      )}
    </S.MapContainer>
  )
}
```

### Fase 3.4 — Countdown Component (Bônus)

**Objetivo:** Contador regressivo até a data do casamento.

Tasks:

- [ ] Criar `src/components/Countdown/index.tsx`
- [ ] Criar `src/components/Countdown/styles.ts`
- [ ] Implementar hook `useCountdown(targetDate: string)` que retorna `{ days, hours, minutes, seconds }`
- [ ] Atualizar a cada segundo via `setInterval`
- [ ] Exibir "Chegou o grande dia! 💍" quando o contador zerar
- [ ] Integrar na seção de informações do evento

Padrão do hook:

```typescript
// src/hooks/useCountdown.ts
import { useState, useEffect } from 'react'

interface CountdownResult {
  days: number
  hours: number
  minutes: number
  seconds: number
  isOver: boolean
}

export function useCountdown(targetDate: string): CountdownResult {
  const getTimeLeft = () => {
    const diff = new Date(targetDate).getTime() - Date.now()
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true }
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / 1000 / 60) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      isOver: false,
    }
  }

  const [timeLeft, setTimeLeft] = useState(getTimeLeft)

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000)
    return () => clearInterval(id)
  }, [targetDate])

  return timeLeft
}
```

### Fase 3.5 — Integração na Home Page

Tasks:

- [ ] Adicionar `EventInfo` à `HomePage` como terceira seção (após Gallery)
- [ ] Adicionar `Countdown` logo abaixo do Hero ou dentro da seção de localização
- [ ] Garantir que a âncora `#local` está corretamente definida no scroll do Hero

---

## Estimativa de Tempo

| Fase | Tarefas | Tempo |
|---|---|---|
| 3.1 EventInfo | 4 tasks | 2-3h |
| 3.2 EventCard | 5 tasks | 3-4h |
| 3.3 LazyMap | 4 tasks | 2-3h |
| 3.4 Countdown (Bônus) | 4 tasks | 2h |
| 3.5 Integração | 3 tasks | 1h |
| **TOTAL ÉPICO 3** | **20 tasks** | **~10-13h** |

---

## Checklist de Conclusão

- [ ] Deep link Google Maps abre app nativo no iOS e Android
- [ ] Deep link Waze abre app nativo no iOS e Android
- [ ] Google Maps Embed não aparece no performance trace do DOMContentLoaded
- [ ] Mapa carrega ao scrollar próximo (IntersectionObserver com rootMargin 200px)
- [ ] Texto de endereço legível sem internet (estático)
- [ ] Countdown funcional e atualiza por segundo

---

## Dependências

- Épico 1 e 2 concluídos
- Coordenadas geográficas (lat/lng) e endereços reais dos locais definidos pelo casal
- URL do Google Maps Embed (gerada gratuitamente no Google Maps)

---

## Próximos Passos (Épico 4)

Após concluir este épico:

1. Catálogo de presentes com schema do Supabase
2. Filtro por preço e categoria
3. Checkout simulado com persistência

---

**Status:** Aguardando conclusão do Épico 2
**Prioridade:** MÉDIA-ALTA
