import { useEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'
import { useCart } from '../../features/cart/CartContext'
import { useSiteContent } from '../../features/content/SiteContentContext'
import { Brand } from '../common/Brand'
import { SmartLink } from '../common/SmartLink'

interface HeaderProps {
  onOpenCart?: () => void
  compact?: boolean
  storeNav?: ReactNode
}

export function Header({ onOpenCart, compact = false, storeNav }: HeaderProps) {
  const { count } = useCart()
  const { user, displayName } = useAuth()
  const headerRef = useRef<HTMLElement>(null)
  const site = useSiteContent()

  useEffect(() => {
    const header = headerRef.current
    if (!header) return
    const sync = () => document.documentElement.style.setProperty('--sticky-offset', `${Math.ceil(header.getBoundingClientRect().height)}px`)
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(header)
    return () => observer.disconnect()
  }, [])

  const accountLabel = user ? displayName.split(' ')[0] || 'Mi cuenta' : 'Ingresar'

  return (
    <>
      {!compact && site.announcement.text.trim() && <div className="announcement"><span>✦</span> {site.announcement.text} <span>✦</span></div>}
      <header className="site-header" ref={headerRef}>
        <div className="wrap header-inner">
          <Brand />
          {!compact && (
            <nav className="main-nav" aria-label="Navegación principal">
              {site.navigation.header.map((item) => <SmartLink key={`${item.label}${item.href}`} href={item.href}>{item.label}</SmartLink>)}
            </nav>
          )}
          <div className="header-actions">
            <Link className="account-link" to={user ? '/mi-cuenta' : '/iniciar-sesion'}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></svg>
              <span>{accountLabel}</span>
            </Link>
            {onOpenCart && (
              <button className="cart-button" type="button" onClick={onOpenCart} aria-label="Abrir carrito de compras">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h9.5a2 2 0 0 0 2-1.6L22 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="19" cy="20" r="1"/></svg>
                <span>Carrito</span><span className="cart-count">{count}</span>
              </button>
            )}
          </div>
        </div>
        {storeNav}
      </header>
    </>
  )
}
