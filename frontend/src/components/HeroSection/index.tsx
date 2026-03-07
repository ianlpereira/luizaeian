import * as S from './styles'
import { eventInfo } from '@/data/event'

export function HeroSection() {
  const handleScroll = () => {
    document.getElementById('galeria')?.scrollIntoView({ behavior: 'smooth' })
  }

  // Formata a data: "07 de Novembro de 2026"
  const formattedDate = new Date(eventInfo.date + 'T00:00:00').toLocaleDateString(
    'pt-BR',
    { day: '2-digit', month: 'long', year: 'numeric' },
  )

  return (
    <S.Wrapper>
      {/* PERF-01: fetchpriority="high" + sem loading="lazy" → LCP otimizado */}
      <S.BackgroundImage
        src="/images/Ian y Luiza-1.webp"
        alt="Luiza e Ian"
        fetchPriority="high"
      />
      <S.Overlay />

      <S.Content>
        <S.Eyebrow>Celebre conosco</S.Eyebrow>
        <S.Title>Luiza &amp; Ian</S.Title>
        <S.Divider />
        <S.Subtitle>Estamos nos casando</S.Subtitle>
        <S.DateBadge>{formattedDate}</S.DateBadge>
      </S.Content>

      <S.ScrollButton onClick={handleScroll} aria-label="Rolar para a galeria">
        ↓
      </S.ScrollButton>
    </S.Wrapper>
  )
}
