import { HeroSection } from '@/components/HeroSection'
import { Gallery } from '@/components/Gallery'
import { Countdown } from '@/components/Countdown'
import { EventInfo } from '@/components/EventInfo'
import { galleryImages } from '@/data/gallery'
import * as S from './styles'

/**
 * HomePage — Site one-page.
 * Épico 2: HeroSection + Gallery implementados. ✅
 * Épico 3: Countdown + EventInfo implementados. ✅
 * Épicos 4-5: placeholders aguardando implementação.
 */
export function HomePage() {
  return (
    <S.Page>
      {/* ✅ ÉPICO 2 — Hero Section */}
      <HeroSection />

      {/* ✅ ÉPICO 2 — Gallery */}
      <Gallery images={galleryImages} />

      {/* ✅ ÉPICO 3 — Countdown */}
      <Countdown />

      {/* ✅ ÉPICO 3 — Logística */}
      <EventInfo />

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
