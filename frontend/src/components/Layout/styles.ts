import styled from 'styled-components'
import { media } from '@/utils/breakpoints'

export const Wrapper = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.md};

  ${media.tablet} {
    padding: 0 ${({ theme }) => theme.spacing.lg};
  }
`

export const Section = styled.section<{ $bg?: string }>`
  width: 100%;
  background-color: ${({ $bg, theme }) => $bg ?? theme.colors.background};
  padding: ${({ theme }) => theme.spacing.xl} 0;

  ${media.tablet} {
    padding: ${({ theme }) => theme.spacing.xxl} 0;
  }
`
