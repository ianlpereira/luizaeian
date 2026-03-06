import * as S from './styles'

/**
 * HomePage — Site one-page.
 * Cada seção é um placeholder que será implementada nos Épicos 2-5.
 */
export function HomePage() {
  return (
    <S.Page>
      {/* ÉPICO 2 — Hero Section */}
      <S.PlaceholderSection id="hero" $bg="#2c2c2c">
        <S.PlaceholderLabel>Épico 2</S.PlaceholderLabel>
        <S.SectionTitle style={{ color: '#ffffff' }}>Luiza &amp; Ian</S.SectionTitle>
        <S.SectionSubtitle style={{ color: '#b0a898' }}>
          Hero Section · Foto de casal · Smooth scroll
        </S.SectionSubtitle>
      </S.PlaceholderSection>

      {/* ÉPICO 2 — Gallery */}
      <S.PlaceholderSection id="galeria">
        <S.PlaceholderLabel>Épico 2</S.PlaceholderLabel>
        <S.SectionTitle>Nossa História</S.SectionTitle>
        <S.SectionSubtitle>
          Galeria de fotos com lightbox
        </S.SectionSubtitle>
      </S.PlaceholderSection>

      {/* ÉPICO 3 — Logística */}
      <S.PlaceholderSection id="local" $bg="#f5f0e8">
        <S.PlaceholderLabel>Épico 3</S.PlaceholderLabel>
        <S.SectionTitle>Onde & Quando</S.SectionTitle>
        <S.SectionSubtitle>
          Local · Data · Mapa com deep links para Google Maps e Waze
        </S.SectionSubtitle>
      </S.PlaceholderSection>

      {/* ÉPICO 4 — Lista de Presentes */}
      <S.PlaceholderSection id="presentes">
        <S.PlaceholderLabel>Épico 4</S.PlaceholderLabel>
        <S.SectionTitle>Lista de Presentes</S.SectionTitle>
        <S.SectionSubtitle>
          Presentes com estoque · Checkout modal · Confetti
        </S.SectionSubtitle>
      </S.PlaceholderSection>

      {/* ÉPICO 5 — RSVP */}
      <S.PlaceholderSection id="rsvp" $bg="#f5f0e8">
        <S.PlaceholderLabel>Épico 5</S.PlaceholderLabel>
        <S.SectionTitle>Confirme sua Presença</S.SectionTitle>
        <S.SectionSubtitle>
          Formulário de RSVP com acompanhantes
        </S.SectionSubtitle>
      </S.PlaceholderSection>

      {/* ÉPICO 5 — Mural de Recados */}
      <S.PlaceholderSection id="mural">
        <S.PlaceholderLabel>Épico 5</S.PlaceholderLabel>
        <S.SectionTitle>Mural de Recados</S.SectionTitle>
        <S.SectionSubtitle>
          Mensagens em tempo real via Supabase Realtime
        </S.SectionSubtitle>
      </S.PlaceholderSection>
    </S.Page>
  )
}
