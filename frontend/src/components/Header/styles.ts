import styled, { css, keyframes } from 'styled-components'
import { media } from '@/utils/breakpoints'

// ── Animações ─────────────────────────────────────────────────────────────────

const slideIn = keyframes`
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
`

const slideOut = keyframes`
  from { transform: translateX(0); }
  to   { transform: translateX(100%); }
`

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`

const fadeOut = keyframes`
  from { opacity: 1; }
  to   { opacity: 0; }
`

// ── Header ────────────────────────────────────────────────────────────────────

export const Wrapper = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 ${({ theme }) => theme.spacing.lg};
  background: rgba(30, 38, 32, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(122, 171, 142, 0.15);
  transition: background ${({ theme }) => theme.transitions.normal};

  ${media.tablet} {
    padding: 0 ${({ theme }) => theme.spacing.xl};
  }
`

export const Nav = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
`

export const Logo = styled.a`
  font-family: ${({ theme }) => theme.typography.fontFamily.serif};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.regular};
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;
  letter-spacing: 0.03em;
  cursor: pointer;

  span {
    color: ${({ theme }) => theme.colors.text.inverse};
    opacity: 0.7;
    margin: 0 6px;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.primaryHover};
  }
`

// ── Desktop nav links ─────────────────────────────────────────────────────────

export const DesktopLinks = styled.ul`
  display: none;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: ${({ theme }) => theme.spacing.xl};

  ${media.tablet} {
    display: flex;
  }
`

export const NavItem = styled.li``

export const NavLink = styled.a`
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 4px 0;
  position: relative;
  transition: color ${({ theme }) => theme.transitions.fast};

  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 1px;
    background: ${({ theme }) => theme.colors.primary};
    transition: width ${({ theme }) => theme.transitions.normal};
  }

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    &::after { width: 100%; }
  }
`

// ── Hamburger button ──────────────────────────────────────────────────────────

export const HamburgerButton = styled.button<{ $open: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  ${media.tablet} {
    display: none;
  }

  span {
    display: block;
    width: 22px;
    height: 2px;
    background: ${({ theme }) => theme.colors.primary};
    border-radius: 2px;
    transform-origin: center;
    transition:
      transform ${({ theme }) => theme.transitions.normal},
      opacity ${({ theme }) => theme.transitions.fast};

    &:nth-child(1) {
      ${({ $open }) => $open && css`transform: translateY(7px) rotate(45deg);`}
    }
    &:nth-child(2) {
      ${({ $open }) => $open && css`opacity: 0; transform: scaleX(0);`}
    }
    &:nth-child(3) {
      ${({ $open }) => $open && css`transform: translateY(-7px) rotate(-45deg);`}
    }
  }
`

// ── Mobile drawer ─────────────────────────────────────────────────────────────

export const Overlay = styled.div<{ $visible: boolean; $closing: boolean }>`
  display: ${({ $visible }) => ($visible ? 'block' : 'none')};
  position: fixed;
  inset: 0;
  z-index: 101;
  background: rgba(0, 0, 0, 0.55);
  animation: ${({ $closing }) => ($closing ? fadeOut : fadeIn)} 250ms ease forwards;

  ${media.tablet} {
    display: none;
  }
`

export const Drawer = styled.aside<{ $visible: boolean; $closing: boolean }>`
  display: ${({ $visible }) => ($visible ? 'flex' : 'none')};
  flex-direction: column;
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 102;
  width: min(300px, 85vw);
  background: #1e2620;
  border-left: 1px solid rgba(122, 171, 142, 0.2);
  padding: 80px ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.xl};
  animation: ${({ $closing }) => ($closing ? slideOut : slideIn)} 280ms cubic-bezier(0.4, 0, 0.2, 1) forwards;

  ${media.tablet} {
    display: none;
  }
`

export const DrawerLinks = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`

export const DrawerLink = styled.a`
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  display: block;
  transition:
    color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};

  &:hover, &:focus-visible {
    color: ${({ theme }) => theme.colors.primary};
    background: rgba(122, 171, 142, 0.08);
    outline: none;
  }
`

export const DrawerDivider = styled.hr`
  border: none;
  border-top: 1px solid rgba(122, 171, 142, 0.15);
  margin: ${({ theme }) => theme.spacing.md} 0;
`

export const DrawerLogo = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.serif};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.primary};
  letter-spacing: 0.08em;
  margin-top: auto;
  padding-top: ${({ theme }) => theme.spacing.lg};
  opacity: 0.6;
  text-align: center;
`
