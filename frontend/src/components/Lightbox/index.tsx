import { useEffect, useCallback, useState, useRef } from 'react'
import type { GalleryImage } from '@/data/gallery'
import * as S from './styles'

interface LightboxProps {
  images: GalleryImage[]
  initialIndex: number
  onClose: () => void
}

export function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
  const [current, setCurrent] = useState(initialIndex)

  // Swipe touch tracking
  const touchStartX = useRef<number | null>(null)

  const prev = useCallback(
    () => setCurrent(i => (i - 1 + images.length) % images.length),
    [images.length],
  )
  const next = useCallback(
    () => setCurrent(i => (i + 1) % images.length),
    [images.length],
  )

  // Keyboard navigation + body overflow lock
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [prev, next, onClose])

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) < 40) return // mínimo de 40px para contar como swipe
    if (delta > 0) prev()
    else next()
    touchStartX.current = null
  }

  const image = images[current]

  return (
    <S.Backdrop onClick={onClose}>
      <S.ImageContainer
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={image.src}
          alt={image.alt}
          draggable={false}
        />
        <S.Counter>
          {current + 1} / {images.length}
        </S.Counter>
      </S.ImageContainer>

      {images.length > 1 && (
        <>
          <S.NavButton
            $direction="prev"
            onClick={e => { e.stopPropagation(); prev() }}
            aria-label="Foto anterior"
          >
            ‹
          </S.NavButton>
          <S.NavButton
            $direction="next"
            onClick={e => { e.stopPropagation(); next() }}
            aria-label="Próxima foto"
          >
            ›
          </S.NavButton>
        </>
      )}

      <S.CloseButton onClick={onClose} aria-label="Fechar lightbox">
        ×
      </S.CloseButton>
    </S.Backdrop>
  )
}
