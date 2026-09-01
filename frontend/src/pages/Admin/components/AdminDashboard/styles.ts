import styled from 'styled-components'

import { media } from '@/utils/breakpoints'

export const Page = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.background};

  ${media.tablet} {
    padding: ${({ theme }) => theme.spacing.xl};
  }
`

export const Header = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
`

export const Titles = styled.div`
  display: flex;
  flex-direction: column;
`

export const Title = styled.h1`
  margin: 0;
  font-family: ${({ theme }) => theme.typography.fontFamily.serif};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.regular};
  color: ${({ theme }) => theme.colors.text.primary};

  ${media.tablet} {
    font-size: ${({ theme }) => theme.typography.fontSize.xl};
  }
`

export const Subtitle = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.text.muted};
  text-transform: uppercase;
  letter-spacing: 2px;
`

export const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`
