import styled from 'styled-components'
import { media } from '@/utils/breakpoints'

export const Footer = styled.footer`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.surface};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  text-align: center;

  ${media.tablet} {
    padding: ${({ theme }) => theme.spacing.xl};
  }
`

export const Monogram = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.serif};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.regular};
  font-style: italic;
  color: ${({ theme }) => theme.colors.primary};
  letter-spacing: 0.06em;
  margin: 0;
`

export const FooterDate = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.muted};
  text-transform: uppercase;
  letter-spacing: 3px;
  margin: 0;
`

export const FooterCopy = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.serif};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.muted};
  margin: 0;

  span {
    color: ${({ theme }) => theme.colors.secondary};
  }
`
