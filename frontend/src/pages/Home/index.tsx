import { HeroSection } from '@/components/HeroSection'
import { Gallery } from '@/components/Gallery'
import { Countdown } from '@/components/Countdown'
import { EventInfo } from '@/components/EventInfo'
import { GiftList } from '@/components/GiftList'
import { RsvpForm } from '@/components/RsvpForm'
import { MessageBoard } from '@/components/MessageBoard'
import { galleryImages } from '@/data/gallery'
import * as S from './styles'

/**
 * HomePage — Site one-page.
 * Épico 2: HeroSection + Gallery implementados. ✅
 * Épico 3: Countdown + EventInfo implementados. ✅
 * Épico 4: GiftList implementado. ✅
 * Épico 5: RsvpForm + MessageBoard implementados. ✅
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

      {/* ✅ ÉPICO 4 — Lista de Presentes */}
      <GiftList />

      {/* ✅ ÉPICO 5 — RSVP */}
      <RsvpForm />

      {/* ✅ ÉPICO 5 — Mural de Recados */}
      <MessageBoard />
    </S.Page>
  )
}
