import styled from 'styled-components'
import { media } from '@/utils/breakpoints'

export const Page = styled.div`
  width: 100%;
`

/**
 * Minimal-height placeholder shown by <Suspense> while a lazy section loads.
 * Shows a subtle pulse so the user knows content is coming (important during
 * Render free-tier cold starts which can take up to 30 s).
 */
export const SectionPlaceholder = styled.div`
  min-height: 200px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.background};

  &::after {
    content: '';
    display: block;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 3px solid ${({ theme }) => theme.colors.primaryLight};
    border-top-color: ${({ theme }) => theme.colors.primary};
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`

export const SectionTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamily.serif};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.regular};
  color: ${({ theme }) => theme.colors.text.primary};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  ${media.tablet} {
    font-size: ${({ theme }) => theme.typography.fontSize.xxl};
  }
`

export const SectionSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
`

export const PlaceholderSection = styled.section<{ $bg?: string }>`
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  background-color: ${({ $bg, theme }) => $bg ?? theme.colors.background};
  padding: ${({ theme }) => theme.spacing.xxl} ${({ theme }) => theme.spacing.md};
  text-align: center;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
`

export const PlaceholderLabel = styled.span`
  display: inline-block;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.muted};
  text-transform: uppercase;
  letter-spacing: 2px;
  background-color: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primaryHover};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.pill};
`
