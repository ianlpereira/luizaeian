import styled, { keyframes } from 'styled-components'
import { media } from '@/utils/breakpoints'

const shimmer = keyframes`
  0%   { background-position: -600px 0; }
  100% { background-position:  600px 0; }
`

export const Section = styled.section`
  background: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.md};

  ${media.tablet} {
    padding: ${({ theme }) => theme.spacing.section} ${({ theme }) => theme.spacing.xl};
  }
`

export const Inner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};
`

export const SectionTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamily.serif};
  font-size: clamp(
    ${({ theme }) => theme.typography.fontSize.xl},
    5vw,
    ${({ theme }) => theme.typography.fontSize.xxl}
  );
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  text-align: center;
  margin: 0;
`

export const SectionSubtitle = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center;
  margin: -${({ theme }) => theme.spacing.md} 0 0;
`

// ── Filter bar ────────────────────────────────────────────────────────────────

export const FilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`

export const FilterLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.muted};
`

export const SortSelect = styled.select`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  background: ${({ theme }) => theme.colors.surface};
  cursor: pointer;
  outline: none;
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`

// ── Grid ──────────────────────────────────────────────────────────────────────

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing.md};

  ${media.tablet} {
    grid-template-columns: repeat(3, 1fr);
  }

  ${media.desktop} {
    grid-template-columns: repeat(4, 1fr);
  }
`

// ── Skeleton card ─────────────────────────────────────────────────────────────

export const SkeletonCard = styled.div`
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.surfaceAlt} 25%,
    ${({ theme }) => theme.colors.borderLight} 50%,
    ${({ theme }) => theme.colors.surfaceAlt} 75%
  );
  background-size: 1200px 100%;
  animation: ${shimmer} 1.6s ease-in-out infinite;
  aspect-ratio: 4 / 5;
`

// ── Empty / error states ──────────────────────────────────────────────────────

export const StateMessage = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.text.muted};
  text-align: center;
  grid-column: 1 / -1;
  padding: ${({ theme }) => theme.spacing.xl} 0;
`
