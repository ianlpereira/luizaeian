import styled, { keyframes } from 'styled-components'
import { media } from '@/utils/breakpoints'

const shimmer = keyframes`
  0%   { background-position: -600px 0; }
  100% { background-position:  600px 0; }
`

// ── Card ──────────────────────────────────────────────────────────────────────

export const Card = styled.article<{ 'aria-disabled'?: boolean }>`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  transition:
    transform ${({ theme }) => theme.transitions.normal},
    box-shadow ${({ theme }) => theme.transitions.normal};
  opacity: ${({ 'aria-disabled': disabled }) => (disabled ? 0.6 : 1)};

  &:hover {
    transform: ${({ 'aria-disabled': disabled }) => (disabled ? 'none' : 'translateY(-4px)')};
    box-shadow: ${({ theme, 'aria-disabled': disabled }) =>
      disabled ? theme.shadows.sm : theme.shadows.golden};
  }
`

// ── Image ─────────────────────────────────────────────────────────────────────

export const ImageWrapper = styled.div`
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surfaceAlt};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform ${({ theme }) => theme.transitions.slow};
  }

  ${Card}:hover & img {
    transform: scale(1.06);
  }
`

export const SoldOutBadge = styled.span`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  color: ${({ theme }) => theme.colors.text.inverse};
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  letter-spacing: 0.08em;
  text-transform: uppercase;
`

// ── Body ──────────────────────────────────────────────────────────────────────

export const Body = styled.div`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.sm};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  flex: 1;

  ${media.phoneLg} {
    padding: ${({ theme }) => theme.spacing.md};
  }
`

export const Category = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.primary};
  text-transform: uppercase;
  letter-spacing: 0.1em;
`

export const Title = styled.h3`
  font-family: ${({ theme }) => theme.typography.fontFamily.serif};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};

  ${media.phoneLg} {
    font-size: ${({ theme }) => theme.typography.fontSize.md};
  }
`

export const Price = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 ${({ theme }) => theme.spacing.sm};

  ${media.phoneLg} {
    font-size: ${({ theme }) => theme.typography.fontSize.lg};
  }
`

export const Button = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text.inverse};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};
  margin-top: auto;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primaryHover};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.text.muted};
    cursor: not-allowed;
  }
`

// ── Skeleton ──────────────────────────────────────────────────────────────────

export const SkeletonCard = styled.div`
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  overflow: hidden;
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.surfaceAlt} 25%,
    ${({ theme }) => theme.colors.borderLight} 50%,
    ${({ theme }) => theme.colors.surfaceAlt} 75%
  );
  background-size: 1200px 100%;
  animation: ${shimmer} 1.6s ease-in-out infinite;
  aspect-ratio: 4 / 5;

  ${media.tablet} {
    aspect-ratio: unset;
    height: 320px;
  }
`
