import styled, { keyframes } from 'styled-components'
import { media } from '@/utils/breakpoints'

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
`

export const Section = styled.section`
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.md};

  ${media.tablet} {
    padding: ${({ theme }) => theme.spacing.xxl} ${({ theme }) => theme.spacing.xl};
  }
`

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  animation: ${fadeUp} 0.6s ease both;
`

export const Eyebrow = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.primary};
  text-transform: uppercase;
  letter-spacing: 4px;
  margin: 0;
`

export const Label = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.serif};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.regular};
  font-style: italic;
  color: ${({ theme }) => theme.colors.text.secondary};
  letter-spacing: 0.04em;
  margin: 0;
`

export const Track = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};

  ${media.tablet} {
    gap: ${({ theme }) => theme.spacing.lg};
  }
`

export const Block = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  min-width: 64px;

  ${media.tablet} {
    min-width: 80px;
  }
`

export const Number = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamily.serif};
  font-size: clamp(32px, 8vw, 56px);
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
  line-height: 1;
  /* Evita salto de layout quando o número muda de 2 para 1 dígito */
  min-width: 2ch;
  text-align: center;
`

export const Unit = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.muted};
  letter-spacing: 0.08em;
  text-transform: uppercase;
`

export const Separator = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamily.serif};
  font-size: clamp(28px, 6vw, 44px);
  color: ${({ theme }) => theme.colors.primaryLight};
  line-height: 1;
  align-self: flex-start;
  padding-top: 4px;
  /* Pulsa suavemente para indicar que é um contador ao vivo */
  animation: ${pulse} 1s ease-in-out infinite;
`

export const OverMessage = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.serif};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  color: ${({ theme }) => theme.colors.primary};
  text-align: center;
  margin: 0;
`
