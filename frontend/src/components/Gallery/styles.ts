import styled from 'styled-components'
import { media } from '@/utils/breakpoints'

export const Section = styled.section<{ $visible?: boolean }>`
  background-color: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.xxl} 0;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transform: translateY(${({ $visible }) => ($visible ? '0' : '28px')});
  transition: opacity 0.6s ease, transform 0.6s ease;
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
  font-style: italic;
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  /* Rosê-gold underline using the secondary palette */
  text-decoration: underline;
  text-decoration-color: ${({ theme }) => theme.colors.secondaryLight};
  text-decoration-thickness: 2px;
  text-underline-offset: 6px;
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
  display: flex;
  align-items: center;
  justify-content: center;

  ${ItemWrapper}:hover & {
    background: rgba(0, 0, 0, 0.38);
  }
`

export const ExpandIcon = styled.span`
  opacity: 0;
  transform: scale(0.7);
  transition:
    opacity ${({ theme }) => theme.transitions.normal},
    transform ${({ theme }) => theme.transitions.normal};
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;

  svg {
    width: 28px;
    height: 28px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
  }

  ${media.tablet} {
    svg {
      width: 32px;
      height: 32px;
    }
  }

  ${ItemWrapper}:hover & {
    opacity: 1;
    transform: scale(1);
  }
`
