import styled, { keyframes } from 'styled-components'
import { media } from '@/utils/breakpoints'

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`

const scaleIn = keyframes`
  from { transform: scale(0.95); opacity: 0; }
  to   { transform: scale(1);    opacity: 1; }
`

export const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${fadeIn} 200ms ease;
  /* Acessibilidade: impede interação com o fundo */
  overscroll-behavior: contain;
`

export const ImageContainer = styled.div`
  position: relative;
  max-width: min(90vw, 900px);
  max-height: 90dvh;
  animation: ${scaleIn} 200ms ease;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    max-width: 100%;
    max-height: 90dvh;
    object-fit: contain;
    border-radius: ${({ theme }) => theme.borderRadius.sm};
    user-select: none;
    -webkit-user-drag: none;
    display: block;
  }
`

export const Counter = styled.span`
  position: absolute;
  bottom: -${({ theme }) => theme.spacing.xl};
  left: 50%;
  transform: translateX(-50%);
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 2px;
  white-space: nowrap;

  ${media.tablet} {
    bottom: -${({ theme }) => theme.spacing.lg};
  }
`

export const CloseButton = styled.button`
  position: fixed;
  top: ${({ theme }) => theme.spacing.md};
  right: ${({ theme }) => theme.spacing.md};
  z-index: 1001;
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.borderRadius.round};
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 24px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`

export const NavButton = styled.button<{ $direction: 'prev' | 'next' }>`
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  ${({ $direction }) => ($direction === 'prev' ? 'left: 12px;' : 'right: 12px;')}
  z-index: 1001;
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.borderRadius.round};
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 28px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background ${({ theme }) => theme.transitions.fast};

  /* Em mobile pequeno esconde as setas — swipe é o input principal */
  display: none;

  ${media.tablet} {
    display: flex;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`
