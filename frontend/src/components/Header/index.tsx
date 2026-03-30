import { useCallback, useEffect, useRef, useState } from 'react'
import * as S from './styles'

interface NavEntry {
  label: string
  href: string
}

const NAV_LINKS: NavEntry[] = [
  { label: 'Data',      href: '#contagem'  },
  { label: 'Local',     href: '#local'     },
  { label: 'Presentes', href: '#presentes' },
  { label: 'Confirmar', href: '#rsvp'      },
  { label: 'Recados',   href: '#mural'     },
  { label: 'Galeria',   href: '#galeria'   },
]

export function Header() {
  const [open, setOpen]       = useState(false)
  const [closing, setClosing] = useState(false)
  const drawerRef             = useRef<HTMLElement>(null)
  const hamburgerRef          = useRef<HTMLButtonElement>(null)

  // Fecha com animação de saída
  const close = useCallback(() => {
    setClosing(true)
    setTimeout(() => {
      setOpen(false)
      setClosing(false)
    }, 280)
  }, [])

  // Fecha o drawer ao pressionar Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close()
        hamburgerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, close])

  // Trava o scroll da página enquanto o drawer estiver aberto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleNavClick = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    const id = href.replace('#', '')
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    if (open) close()
  }

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (open) close()
  }

  return (
    <>
      <S.Wrapper>
        <S.Nav>
          <S.Logo href="#" onClick={handleLogoClick} aria-label="Voltar ao topo">
            Luiza <span>&</span> Ian
          </S.Logo>

          {/* Desktop links */}
          <S.DesktopLinks role="list">
            {NAV_LINKS.map(({ label, href }) => (
              <S.NavItem key={href} role="listitem">
                <S.NavLink href={href} onClick={handleNavClick(href)}>
                  {label}
                </S.NavLink>
              </S.NavItem>
            ))}
          </S.DesktopLinks>

          {/* Hamburger (mobile only) */}
          <S.HamburgerButton
            ref={hamburgerRef}
            $open={open}
            onClick={() => (open ? close() : setOpen(true))}
            aria-expanded={open}
            aria-controls="mobile-drawer"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </S.HamburgerButton>
        </S.Nav>
      </S.Wrapper>

      {/* Overlay escuro por trás do drawer */}
      <S.Overlay
        $visible={open}
        $closing={closing}
        onClick={close}
        aria-hidden="true"
      />

      {/* Mobile drawer */}
      <S.Drawer
        id="mobile-drawer"
        ref={drawerRef}
        $visible={open}
        $closing={closing}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
      >
        <S.DrawerLinks role="list">
          {NAV_LINKS.map(({ label, href }) => (
            <li key={href} role="listitem">
              <S.DrawerLink href={href} onClick={handleNavClick(href)}>
                {label}
              </S.DrawerLink>
            </li>
          ))}
        </S.DrawerLinks>

        <S.DrawerDivider />
        <S.DrawerLogo>Luiza &amp; Ian — 2026</S.DrawerLogo>
      </S.Drawer>
    </>
  )
}
