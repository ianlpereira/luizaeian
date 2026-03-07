import styled from 'styled-components'
import { media } from '@/utils/breakpoints'

export const Section = styled.section`
  background-color: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.xxl} 0;
`

export const Header = styled.div`
  text-align: center;
  padding: 0 ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

export const SectionLabel = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.primary};
  text-transform: uppercase;
  letter-spacing: 4px;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

export const Title = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamily.serif};
  font-size: clamp(
    ${({ theme }) => theme.typography.fontSize.xl},
    5vw,
    ${({ theme }) => theme.typography.fontSize.xxl}
  );
  font-weight: ${({ theme }) => theme.typography.fontWeight.regular};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

export const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  max-width: 420px;
  margin: 0 auto;
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`

export const Grid = styled.div`
  display: grid;
  /* mobile: 2 colunas */
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing.xs};
  padding: 0 ${({ theme }) => theme.spacing.xs};

  /* tablet: 3 colunas */
  ${media.tablet} {
    grid-template-columns: repeat(3, 1fr);
    gap: ${({ theme }) => theme.spacing.sm};
    padding: 0 ${({ theme }) => theme.spacing.lg};
  }

  /* desktop: 4 colunas */
  ${media.desktop} {
    grid-template-columns: repeat(4, 1fr);
  }
`

export const ItemWrapper = styled.button`
  position: relative;
  /* aspect-ratio fixo: evita CLS (Cumulative Layout Shift) */
  aspect-ratio: 3 / 4;
  overflow: hidden;
  border: none;
  padding: 0;
  cursor: pointer;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  background-color: ${({ theme }) => theme.colors.border};
  display: block;
  width: 100%;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform ${({ theme }) => theme.transitions.slow};
    display: block;
  }

  &:hover img,
  &:focus-visible img {
    transform: scale(1.07);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`

export const ItemOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0);
  transition: background ${({ theme }) => theme.transitions.normal};
  pointer-events: none;

  ${ItemWrapper}:hover & {
    background: rgba(0, 0, 0, 0.2);
  }
`

export const ItemIndex = styled.span`
  position: absolute;
  bottom: ${({ theme }) => theme.spacing.sm};
  right: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 1px;
  opacity: 0;
  transition: opacity ${({ theme }) => theme.transitions.fast};
  pointer-events: none;

  ${ItemWrapper}:hover & {
    opacity: 1;
  }
`
