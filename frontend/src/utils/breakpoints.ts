import { theme } from '@/styles/theme'

/**
 * RESP-01 — Helpers de media query mobile-first para Styled Components.
 * Uso: `${media.tablet} { font-size: 20px; }`
 */
export const media = {
  /** Phones maiores (≥ 414px) */
  phoneLg: `@media (min-width: ${theme.breakpoints.md})`,
  /** Tablet portrait (≥ 768px) */
  tablet: `@media (min-width: ${theme.breakpoints.lg})`,
  /** Desktop (≥ 1024px) */
  desktop: `@media (min-width: ${theme.breakpoints.xl})`,
  /** Wide desktop (≥ 1440px) */
  wide: `@media (min-width: ${theme.breakpoints.xxl})`,
  /** Apenas mobile (< 768px) */
  mobileOnly: `@media (max-width: calc(${theme.breakpoints.lg} - 1px))`,
} as const
