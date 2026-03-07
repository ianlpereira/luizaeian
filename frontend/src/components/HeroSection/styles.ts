import styled from 'styled-components'
import { media } from '@/utils/breakpoints'

export const Wrapper = styled.section`
  position: relative;
  height: 100dvh;
  min-height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: #1a1a1a; /* fallback enquanto imagem carrega */
`

export const BackgroundImage = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  /* PERF-01: fetchpriority passado via prop, sem lazy — é o LCP */
`

export const Overlay = styled.div`
  position: absolute;
  inset: 0;
  /* ratio 4.5:1 WCAG AA garantido com este overlay sobre foto média */
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.35) 0%,
    rgba(0, 0, 0, 0.55) 60%,
    rgba(0, 0, 0, 0.70) 100%
  );
`

export const Content = styled.div`
  position: relative;
  z-index: 1;
  text-align: center;
  padding: ${({ theme }) => theme.spacing.lg};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`

export const Eyebrow = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.primary};
  text-transform: uppercase;
  letter-spacing: 4px;
`

export const Title = styled.h1`
  font-family: ${({ theme }) => theme.typography.fontFamily.serif};
  /* clamp garante legibilidade de 360px a 1440px */
  font-size: clamp(
    ${({ theme }) => theme.typography.fontSize.xl},
    8vw,
    ${({ theme }) => theme.typography.fontSize.hero}
  );
  color: ${({ theme }) => theme.colors.text.inverse};
  font-weight: ${({ theme }) => theme.typography.fontWeight.regular};
  font-style: italic;
  letter-spacing: 0.02em;
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
`

export const Subtitle = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: rgba(255, 255, 255, 0.75);
  letter-spacing: 3px;
  text-transform: uppercase;
  font-weight: ${({ theme }) => theme.typography.fontWeight.light};

  ${media.tablet} {
    font-size: ${({ theme }) => theme.typography.fontSize.md};
  }
`

export const Divider = styled.span`
  display: block;
  width: 40px;
  height: 1px;
  background-color: ${({ theme }) => theme.colors.primary};
  margin: ${({ theme }) => theme.spacing.sm} auto;
`

export const DateBadge = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: rgba(255, 255, 255, 0.65);
  letter-spacing: 1px;
`

export const ScrollButton = styled.button`
  position: absolute;
  bottom: ${({ theme }) => theme.spacing.xl};
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.borderRadius.round};
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: transparent;
  color: ${({ theme }) => theme.colors.text.inverse};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};
  animation: bounce 2s ease-in-out infinite;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: rgba(201, 169, 110, 0.15);
  }

  @keyframes bounce {
    0%, 100% { transform: translateX(-50%) translateY(0); }
    50% { transform: translateX(-50%) translateY(6px); }
  }
`
