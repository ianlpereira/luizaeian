import type { GalleryImage } from '@/data/gallery'
import * as S from './styles'

interface GalleryItemProps {
  image: GalleryImage
  onClick: () => void
  index: number
}

const ExpandSvg = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </svg>
)

export function GalleryItem({ image, onClick }: GalleryItemProps) {
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
        width={600}
        height={800}
        sizes="(max-width: 767px) 50vw, (max-width: 1199px) 33vw, 25vw"
      />
      <S.ItemOverlay />
      <S.ExpandIcon>
        <ExpandSvg />
      </S.ExpandIcon>
    </S.ItemWrapper>
  )
}
