import styled, { keyframes } from 'styled-components'
import { media } from '@/utils/breakpoints'

/* ── skeleton shimmer ─────────────────────────────────────────────────────── */
const shimmer = keyframes`
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
`

/* ── card ─────────────────────────────────────────────────────────────────── */
export const Card = styled.article`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: ${({ theme }) => theme.shadows.md};
  transition:
    transform ${({ theme }) => theme.transitions.normal},
    box-shadow ${({ theme }) => theme.transitions.normal};

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`

export const CardBody = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  flex: 1;
`

export const Header = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`

export const Icon = styled.span`
  font-size: 28px;
  line-height: 1;
`

export const Title = styled.h3`
  font-family: ${({ theme }) => theme.typography.fontFamily.serif};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`

export const Venue = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.primary};
  margin: 0;
`

export const Address = styled.address`
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-style: normal;
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin: 0;
`

export const TimeRow = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`

/* ── map container ────────────────────────────────────────────────────────── */
export const MapContainer = styled.div`
  width: 100%;
  height: 220px;
  overflow: hidden;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};

  iframe {
    display: block;
    width: 100%;
    height: 100%;
  }
`

export const MapSkeleton = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.surfaceAlt} 25%,
    ${({ theme }) => theme.colors.borderLight} 50%,
    ${({ theme }) => theme.colors.surfaceAlt} 75%
  );
  background-size: 800px 100%;
  animation: ${shimmer} 1.4s ease-in-out infinite;
`

/* ── action buttons ───────────────────────────────────────────────────────── */
export const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  flex-wrap: wrap;
`

const BaseButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  text-decoration: none;
  transition: all ${({ theme }) => theme.transitions.fast};
  flex: 1;
  justify-content: center;
  min-width: 120px;

  ${media.tablet} {
    flex: 0 1 auto;
  }
`

export const MapsButton = styled(BaseButton)`
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text.inverse};

  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
  }
`

export const WazeButton = styled(BaseButton)`
  background: ${({ theme }) => theme.colors.surfaceAlt};
  color: ${({ theme }) => theme.colors.text.primary};
  border: 1px solid ${({ theme }) => theme.colors.border};

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }
`
