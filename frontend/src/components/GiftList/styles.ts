import styled, { keyframes } from 'styled-components'
import { media } from '@/utils/breakpoints'

const shimmer = keyframes`
  0%   { background-position: -600px 0; }
  100% { background-position:  600px 0; }
`

export const Section = styled.section<{ $visible?: boolean }>`
  background: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.md};
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transform: translateY(${({ $visible }) => ($visible ? '0' : '28px')});
  transition: opacity 0.6s ease, transform 0.6s ease;

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
  font-weight: ${({ theme }) => theme.typography.fontWeight.regular};
  font-style: italic;
  color: ${({ theme }) => theme.colors.text.primary};
  text-align: center;
  margin: 0;

  &::after {
    content: '';
    display: block;
    width: 40px;
    height: 2px;
    background: ${({ theme }) => theme.colors.secondary};
    border-radius: 2px;
    margin: ${({ theme }) => theme.spacing.sm} auto 0;
    opacity: 0.7;
  }
`

export const SectionSubtitle = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center;
  margin: 0;
`

// ── Category filter ───────────────────────────────────────────────────────────

export const CategoryRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`

export const CategoryChip = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  border: 1.5px solid ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.border};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.surface};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.text.inverse : theme.colors.text.secondary};
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  white-space: nowrap;
  transition:
    background 200ms ease,
    border-color 200ms ease,
    color 200ms ease,
    transform 150ms ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ $active, theme }) =>
      $active ? theme.colors.text.inverse : theme.colors.primary};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  ${media.tablet} {
    font-size: ${({ theme }) => theme.typography.fontSize.md};
    padding: 8px ${({ theme }) => theme.spacing.lg};
  }
`

// ── Filter bar ────────────────────────────────────────────────────────────────

export const FilterBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  width: fit-content;
  margin: 0 auto;
`

export const FilterLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.muted};
`

export const SortSelect = styled.select`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  background: transparent;
  cursor: pointer;
  outline: none;

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
    border-radius: ${({ theme }) => theme.borderRadius.sm};
  }
`

// ── Grid ──────────────────────────────────────────────────────────────────────

export const Grid = styled.div`
  display: grid;
  /* Mobile pequeno (< 414px): 1 coluna para evitar cards espremidos */
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.md};

  /* Phones maiores (≥ 414px): 2 colunas já cabem bem */
  ${media.phoneLg} {
    grid-template-columns: repeat(2, 1fr);
  }

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

// ── Pagination ────────────────────────────────────────────────────────────────

export const PaginationRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs};
  flex-wrap: wrap;
`

export const PaginationButton = styled.button<{ $active?: boolean; $nav?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: ${({ $nav }) => ($nav ? '36px' : '36px')};
  height: 36px;
  padding: 0 ${({ $nav }) => ($nav ? '10px' : '0')};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  border: 1.5px solid ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.border};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.surface};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.text.inverse : theme.colors.text.secondary};
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition:
    background 200ms ease,
    border-color 200ms ease,
    color 200ms ease,
    transform 150ms ease;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ $active, theme }) =>
      $active ? theme.colors.text.inverse : theme.colors.primary};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.35;
    cursor: default;
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }
`

export const PaginationEllipsis = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.muted};
  user-select: none;
`
