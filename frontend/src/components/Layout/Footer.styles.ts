import styled from 'styled-components'
import { media } from '@/utils/breakpoints'

export const Footer = styled.footer`
  width: 100%;
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.surface};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  font-family: ${({ theme }) => theme.typography.fontFamily.serif};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.muted};

  ${media.tablet} {
    padding: ${({ theme }) => theme.spacing.xl};
  }

  span {
    color: ${({ theme }) => theme.colors.primary};
  }
`
