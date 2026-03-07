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
        /* Hint ao browser para pré-calcular o layout antes do load */
        width={600}
        height={800}
      />
      <S.ItemOverlay className="overlay" />
      <S.ItemIndex>{String(index + 1).padStart(2, '0')}</S.ItemIndex>
    </S.ItemWrapper>
  )
}
