import { useEffect, useRef, useState } from 'react'

/**
 * Triggers a CSS class-based fade-in when the element enters the viewport.
 *
 * Usage:
 *   const { ref, isVisible } = useScrollFadeIn()
 *   <Section ref={ref} $visible={isVisible} />
 *
 * The styled component should define:
 *   opacity: ${({ $visible }) => ($visible ? 1 : 0)};
 *   transform: translateY(${({ $visible }) => ($visible ? 0 : '28px')});
 *   transition: opacity 0.6s ease, transform 0.6s ease;
 */
export function useScrollFadeIn(threshold = 0.05) {
  const ref = useRef<HTMLElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // If reduced-motion is preferred, skip animation entirely
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        threshold,
        // Trigger 80px before the element enters the viewport.
        // This fixes the case where the element is mounted already
        // inside (or very near) the viewport — especially on mobile
        // after navigating via anchor links (#presentes etc.).
        rootMargin: '0px 0px -0px 0px',
      },
    )

    observer.observe(el)

    // Fallback: if the element is already in the viewport at mount time
    // (e.g. user navigated directly to #presentes), the observer callback
    // may not fire on some mobile browsers. Check synchronously via
    // getBoundingClientRect and resolve immediately.
    const rect = el.getBoundingClientRect()
    const inViewport =
      rect.top < window.innerHeight && rect.bottom > 0

    if (inViewport) {
      setIsVisible(true)
      observer.disconnect()
      return
    }

    return () => observer.disconnect()
  }, [threshold])

  return { ref, isVisible }
}
