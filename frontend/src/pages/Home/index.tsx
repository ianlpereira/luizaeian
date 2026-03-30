import { Suspense, lazy } from "react";
import { HeroSection } from "@/components/HeroSection";
import { galleryImages } from "@/data/gallery";
import * as S from "./styles";

// ── Lazy-loaded below-the-fold sections ──────────────────────────────────────
// Each section is split into its own async chunk. The browser downloads them
// only after painting the hero, dramatically reducing the initial JS payload.
const Gallery = lazy(() =>
  import("@/components/Gallery").then((m) => ({ default: m.Gallery })),
);
const Countdown = lazy(() =>
  import("@/components/Countdown").then((m) => ({ default: m.Countdown })),
);
const EventInfo = lazy(() =>
  import("@/components/EventInfo").then((m) => ({ default: m.EventInfo })),
);
const GiftList = lazy(() =>
  import("@/components/GiftList").then((m) => ({ default: m.GiftList })),
);
const RsvpForm = lazy(() =>
  import("@/components/RsvpForm").then((m) => ({ default: m.RsvpForm })),
);
const MessageBoard = lazy(() =>
  import("@/components/MessageBoard").then((m) => ({
    default: m.MessageBoard,
  })),
);

/**
 * HomePage — Site one-page.
 * Épico 2: HeroSection + Gallery implementados. ✅
 * Épico 3: Countdown + EventInfo implementados. ✅
 * Épico 4: GiftList implementado. ✅
 * Épico 5: RsvpForm + MessageBoard implementados. ✅
 *
 * PERF: Sections below the fold are lazy-loaded (React.lazy + Suspense) so the
 * initial JS bundle only includes HeroSection, cutting Time-to-Interactive.
 */
export function HomePage() {
  return (
    <S.Page>
      {/* ✅ ÉPICO 2 — Hero Section — eager (LCP element lives here) */}
      <HeroSection />

      {/* Everything below is deferred until after the hero is painted */}

      <Suspense fallback={<S.SectionPlaceholder />}>
        {/* ✅ ÉPICO 3 — Countdown */}
        <Countdown />
      </Suspense>

      <Suspense fallback={<S.SectionPlaceholder />}>
        {/* ✅ ÉPICO 3 — Logística */}
        <EventInfo />
      </Suspense>

      <Suspense fallback={<S.SectionPlaceholder />}>
        {/* ✅ ÉPICO 4 — Lista de Presentes */}
        <GiftList />
      </Suspense>

      <Suspense fallback={<S.SectionPlaceholder />}>
        {/* ✅ ÉPICO 5 — RSVP */}
        <RsvpForm />
      </Suspense>

      <Suspense fallback={<S.SectionPlaceholder />}>
        {/* ✅ ÉPICO 5 — Mural de Recados */}
        <MessageBoard />
      </Suspense>

      <Suspense fallback={<S.SectionPlaceholder />}>
        {/* ✅ ÉPICO 2 — Gallery */}
        <Gallery images={galleryImages} />
      </Suspense>
    </S.Page>
  );
}
