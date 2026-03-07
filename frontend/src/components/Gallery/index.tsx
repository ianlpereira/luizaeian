import { useState } from 'react'
import { GalleryItem } from './GalleryItem'
import { Lightbox } from '@/components/Lightbox'
import type { GalleryImage } from '@/data/gallery'
import * as S from './styles'

interface GalleryProps {
  images: GalleryImage[]
}

export function Gallery({ images }: GalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  return (
    <S.Section id="galeria">
      <S.Header>
        <S.SectionLabel>Pré-Wedding</S.SectionLabel>
        <S.Title>Nossa História</S.Title>
        <S.Subtitle>Momentos especiais que guardaremos para sempre</S.Subtitle>
      </S.Header>

      <S.Grid>
        {images.map((image, index) => (
          <GalleryItem
            key={image.id}
            image={image}
            index={index}
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
    </S.Section>
  )
}
