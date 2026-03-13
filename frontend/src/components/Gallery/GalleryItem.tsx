import type { GalleryImage } from '@/data/gallery'
import * as S from './styles'

interface GalleryItemProps {
  image: GalleryImage
  onClick: () => void
  index: number
}

export function GalleryItem({ image, onClick, index }: GalleryItemProps) {
  return (
    <S.ItemWrapper
      onClick={onClick}
      aria-label={`Abrir ${image.alt}`}
      type="button"
    >
      <img
        src={image.webpSrc ?? image.src}
        alt={image.alt}
        loading="lazy"
        decoding="async"
        /**
         * PERF: explicit intrinsic dimensions let the browser reserve space
         * before the image loads, preventing Cumulative Layout Shift (CLS).
         * The grid cells use aspect-ratio:3/4 in CSS, so these values must
         * match that ratio.
         *
         * PERF: `sizes` tells the browser how wide the <img> will be rendered
         * at each viewport breakpoint, matching the CSS grid layout:
         *   – mobile  (<768px)  → 2-col grid → ~50vw each
         *   – tablet  (<1200px) → 3-col grid → ~33vw each
         *   – desktop (≥1200px) → 4-col grid → ~25vw each
         * The browser uses this to pick the smallest adequate source from its
         * cache (or the single src here, since we serve static WebP files).
         */
        width={600}
        height={800}
        sizes="(max-width: 767px) 50vw, (max-width: 1199px) 33vw, 25vw"
      />
      <S.ItemOverlay className="overlay" />
      <S.ItemIndex>{String(index + 1).padStart(2, '0')}</S.ItemIndex>
    </S.ItemWrapper>
  )
}
