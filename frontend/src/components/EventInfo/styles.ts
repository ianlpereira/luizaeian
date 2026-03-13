import styled from 'styled-components'
import { media } from '@/utils/breakpoints'

export const Section = styled.section<{ $visible?: boolean }>`
  background: ${({ theme }) => theme.colors.surfaceAlt};
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.md};
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transform: translateY(${({ $visible }) => ($visible ? '0' : '28px')});
  transition: opacity 0.6s ease, transform 0.6s ease;

  ${media.tablet} {
    padding: ${({ theme }) => theme.spacing.section} ${({ theme }) => theme.spacing.xl};
  }
`

export const Inner = styled.div`
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xl};
`

export const SectionTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamily.serif};
  font-size: clamp(${({ theme }) => theme.typography.fontSize.xl}, 5vw, ${({ theme }) => theme.typography.fontSize.xxl});
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

export const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme.spacing.lg};

  ${media.tablet} {
    grid-template-columns: repeat(2, 1fr);
  }
`

export const DressCode = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: fit-content;
`
