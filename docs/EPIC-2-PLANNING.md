# 🎨 Épico 2 — Apresentação e Identidade Visual

## Status: 🔲 PLANEJADO

**User Stories:** US 1.1 (Hero Section) · US 1.2 (Galeria do Pré-Wedding)

---

## Contexto

Este épico entrega o impacto visual inicial do site. É a primeira coisa que o convidado vê ao abrir o link no WhatsApp. A performance é crítica — o LCP (Largest Contentful Paint) deve ser inferior a 2.5s mesmo em conexões 4G lentas.

---

## User Stories

### US 1.1 — Hero Section (Capa)

**Como** convidado, **quero** ver uma capa impactante com os nomes do casal ao abrir o site, **para** ter imediatamente a experiência visual do evento.

**Requisitos:**
- Exibir nomes `"Luiza e Ian"` com tipografia serif elegante
- Imagem de fundo em alta resolução com overlay escuro para contraste
- CTA de scroll suave para a próxima seção
- Suporte a texto legível em toda faixa mobile (360px → 430px)

**Engineering Focus — PERF-01:**
- Usar atributo `fetchpriority="high"` na tag de imagem da hero
- Imagem em formato WebP com fallback
- LCP target: `< 2.5s`

**Critérios de Aceite:**
- [ ] Nomes exibidos corretamente com tipografia do `theme.typography.fontFamily.serif`
- [ ] Overlay garante contraste mínimo WCAG AA (ratio 4.5:1) sobre a imagem
- [ ] Texto legível em iPhone SE (375px), iPhone 14 (390px), iPhone 14 Plus (430px)
- [ ] Botão/ícone de scroll suave funcional em mobile e desktop
- [ ] LCP medido via Lighthouse < 2.5s

---

### US 1.2 — Galeria do Pré-Wedding

**Como** convidado, **quero** ver as fotos do pré-wedding em uma galeria elegante, **para** reviver o clima do casal antes do grande dia.

**Requisitos:**
- Grid responsivo (CSS Grid) com colunas adaptativas por breakpoint
- Lazy load nativo em todas as imagens (`loading="lazy"`)
- Lightbox para expansão de imagem com swipe mobile
- `aspect-ratio` fixo nos cards para evitar layout shift (CLS)

**Critérios de Aceite:**
- [ ] Grid com 2 colunas em mobile, 3 em tablet, 4 em desktop
- [ ] Imagens nunca causam layout shift (usar `aspect-ratio: 3/4` nos wrappers)
- [ ] Lightbox abre ao clicar/tocar em qualquer foto
- [ ] Swipe horizontal funciona no lightbox em dispositivos touch
- [ ] Lazy load ativo: imagens fora da viewport não são carregadas no DOMContentLoaded

---

## Fases de Implementação

### Fase 2.1 — Hero Section Component

**Objetivo:** Construir o componente `HeroSection` com performance otimizada.

Tasks:

- [ ] Criar `src/components/HeroSection/index.tsx` — componente da capa
- [ ] Criar `src/components/HeroSection/styles.ts` — Styled Components
- [ ] Selecionar e otimizar imagem de fundo (converter para WebP via Supabase Storage ou CDN)
- [ ] Implementar overlay via `::after` pseudo-elemento no Styled Component
- [ ] Adicionar `fetchpriority="high"` na tag de imagem
- [ ] Implementar scroll suave para a seção seguinte
- [ ] Testar LCP com Lighthouse

Padrão do componente:

```typescript
// src/components/HeroSection/index.tsx
import * as S from './styles'

export function HeroSection() {
  const handleScroll = () => {
    document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <S.Wrapper>
      <S.BackgroundImage
        src="/images/hero.webp"
        alt="Luiza e Ian"
        fetchPriority="high"
      />
      <S.Overlay />
      <S.Content>
        <S.Title>Luiza & Ian</S.Title>
        <S.Subtitle>Juntos para sempre</S.Subtitle>
        <S.ScrollButton onClick={handleScroll} aria-label="Rolar para baixo">
          ↓
        </S.ScrollButton>
      </S.Content>
    </S.Wrapper>
  )
}
```

```typescript
// src/components/HeroSection/styles.ts
import styled from 'styled-components'

export const Wrapper = styled.section`
  position: relative;
  height: 100dvh;
  min-height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`

export const BackgroundImage = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
`

export const Overlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
`

export const Content = styled.div`
  position: relative;
  z-index: 1;
  text-align: center;
  padding: ${({ theme }) => theme.spacing.lg};
`

export const Title = styled.h1`
  font-family: ${({ theme }) => theme.typography.fontFamily.serif};
  font-size: clamp(${({ theme }) => theme.typography.fontSize.xl}, 8vw, ${({ theme }) => theme.typography.fontSize.hero});
  color: ${({ theme }) => theme.colors.text.inverse};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  letter-spacing: 0.02em;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`
```

### Fase 2.2 — Gallery Component

**Objetivo:** Construir o componente `Gallery` com Grid, Lazy Load e Lightbox.

Tasks:

- [ ] Criar `src/components/Gallery/index.tsx` — componente de galeria
- [ ] Criar `src/components/Gallery/styles.ts` — Grid responsivo
- [ ] Criar `src/components/Gallery/GalleryItem.tsx` — card individual com `aspect-ratio`
- [ ] Criar `src/components/Lightbox/index.tsx` — modal de visualização
- [ ] Criar `src/components/Lightbox/styles.ts` — overlay e navegação
- [ ] Implementar swipe via `TouchEvent` handlers ou biblioteca leve (`swiper` ou `react-swipeable`)
- [ ] Implementar navegação por teclado (← →, Escape) no Lightbox

Padrão do componente de galeria:

```typescript
// src/components/Gallery/index.tsx
import { useState } from 'react'
import { Lightbox } from '@/components/Lightbox'
import { GalleryItem } from './GalleryItem'
import * as S from './styles'

interface GalleryImage {
  id: string
  src: string
  alt: string
  webpSrc?: string
}

interface GalleryProps {
  images: GalleryImage[]
}

export function Gallery({ images }: GalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  return (
    <>
      <S.Grid id="gallery">
        {images.map((image, index) => (
          <GalleryItem
            key={image.id}
            image={image}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </S.Grid>
      {activeIndex !== null && (
        <Lightbox
          images={images}
          initialIndex={activeIndex}
          onClose={() => setActiveIndex(null)}
        />
      )}
    </>
  )
}
```

```typescript
// src/components/Gallery/styles.ts
import styled from 'styled-components'

export const Grid = styled.section`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.lg};

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.xl}) {
    grid-template-columns: repeat(4, 1fr);
  }
`

export const ItemWrapper = styled.button`
  position: relative;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  border: none;
  padding: 0;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.borderRadius?.sm ?? '4px'};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  &:hover img {
    transform: scale(1.05);
  }
`
```

### Fase 2.3 — Lightbox Component

**Objetivo:** Modal de visualização com suporte a swipe.

Tasks:

- [ ] Implementar modal `Lightbox` com fundo escuro e botão de fechar
- [ ] Navegação por setas (prev/next) com loop circular
- [ ] Suporte a swipe horizontal via `touchstart`/`touchend`
- [ ] Bloquear scroll do body enquanto Lightbox estiver aberto
- [ ] Fechar ao pressionar `Escape` ou clicar fora da imagem
- [ ] Exibir contador: `3 / 12`

Padrão esperado:

```typescript
// src/components/Lightbox/index.tsx
import { useEffect, useCallback, useState } from 'react'
import * as S from './styles'

interface LightboxProps {
  images: { src: string; alt: string }[]
  initialIndex: number
  onClose: () => void
}

export function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
  const [current, setCurrent] = useState(initialIndex)

  const prev = useCallback(() =>
    setCurrent(i => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() =>
    setCurrent(i => (i + 1) % images.length), [images.length])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [prev, next, onClose])

  return (
    <S.Backdrop onClick={onClose}>
      <S.ImageContainer onClick={e => e.stopPropagation()}>
        <img src={images[current].src} alt={images[current].alt} />
        <S.Counter>{current + 1} / {images.length}</S.Counter>
        <S.NavButton direction="prev" onClick={prev}>‹</S.NavButton>
        <S.NavButton direction="next" onClick={next}>›</S.NavButton>
        <S.CloseButton onClick={onClose}>×</S.CloseButton>
      </S.ImageContainer>
    </S.Backdrop>
  )
}
```

### Fase 2.4 — Integração na Home Page

**Objetivo:** Montar os componentes na página principal com scroll por seções.

Tasks:

- [ ] Integrar `HeroSection` como primeira seção da `HomePage`
- [ ] Integrar `Gallery` com ID `gallery` como segunda seção
- [ ] Popular gallery com dados iniciais (array local ou Supabase Storage)
- [ ] Garantir que ancoragem por ID funciona no scroll suave

Padrão esperado:

```typescript
// src/pages/Home/index.tsx
import { HeroSection } from '@/components/HeroSection'
import { Gallery } from '@/components/Gallery'
import { galleryImages } from '@/data/gallery'

export function HomePage() {
  return (
    <>
      <HeroSection />
      <Gallery images={galleryImages} />
    </>
  )
}
```

---

## Estimativa de Tempo

| Fase | Tarefas | Tempo |
|---|---|---|
| 2.1 Hero Section | 7 tasks | 3-4h |
| 2.2 Gallery Component | 7 tasks | 4-5h |
| 2.3 Lightbox | 6 tasks | 3-4h |
| 2.4 Integração | 4 tasks | 1-2h |
| **TOTAL ÉPICO 2** | **24 tasks** | **~11-15h** |

---

## Métricas de Performance (Critérios de Saída)

| Métrica | Target | Ferramenta |
|---|---|---|
| LCP | < 2.5s | Lighthouse |
| CLS | < 0.1 | Lighthouse |
| FCP | < 1.8s | Lighthouse |
| Tamanho hero.webp | < 200KB | ImageOptim/Squoosh |

---

## Checklist de Conclusão

- [ ] LCP < 2.5s no Lighthouse (modo mobile, throttling 4G)
- [ ] Imagem hero em WebP com `fetchpriority="high"`
- [ ] Gallery sem layout shift (`aspect-ratio` aplicado)
- [ ] Lightbox com swipe funcional em iPhone
- [ ] Acessibilidade: botões com `aria-label`, imagens com `alt`
- [ ] Lighthouse Accessibility score > 90

---

## Dependências

- Épico 1 concluído (theme, Supabase, scaffold)
- Imagens do pré-wedding disponíveis (fornecidas pelo casal)
- Imagens convertidas para WebP (Squoosh ou Supabase Storage transform)

---

## Próximos Passos (Épico 3)

Após concluir este épico:

1. Cards de endereço com informações do evento
2. Integração com Google Maps Embed
3. Deep links para Waze e Google Maps

---

**Status:** Aguardando conclusão do Épico 1
**Prioridade:** ALTA — primeira impressão do convidado
