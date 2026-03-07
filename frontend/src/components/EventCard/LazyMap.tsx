import { useEffect, useRef, useState } from 'react'
import * as S from './styles'

interface LazyMapProps {
  embedUrl: string
  title: string
}

/**
 * Carrega o iframe do Google Maps somente quando o elemento
 * entra na viewport (IntersectionObserver, rootMargin 200px).
 * Exibe um skeleton animado enquanto aguarda.
 */
export function LazyMap({ embedUrl, title }: LazyMapProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <S.MapContainer ref={ref}>
      {isVisible ? (
        <iframe
          src={embedUrl}
          title={title}
          width="100%"
          height="220"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <S.MapSkeleton aria-label="Carregando mapa…" />
      )}
    </S.MapContainer>
  )
}
