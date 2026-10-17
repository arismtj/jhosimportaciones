import { Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'
import { useCart } from '../../features/cart/CartContext'
import { Brand } from '../common/Brand'

interface HeaderProps {
  onOpenCart?: () => void
  compact?: boolean
}

export function Header({ onOpenCart, compact = false }: HeaderProps) {
  const { count } = useCart()
  const { user } = useAuth()

  return (
    <>
      {!compact && <div className="announcement"><span>✦</span> Regalos con intención, detalles que enamoran <span>✦</span></div>}
      <header className="site-header">
        <div className="wrap header-inner">
          <Brand />
          {!compact && (
            <nav className="main-nav" aria-label="Navegación principal">
              <a href="#inicio">Inicio</a>
              <a href="#catalogo">Tienda</a>
              <a href="#categorias">Categorías</a>
              <a href="#nosotros">Nosotros</a>
            </nav>
          )}
          <div className="header-actions">
            <Link className="account-link" to={user ? '/mi-cuenta' : '/iniciar-sesion'}>
              {user ? 'Mi cuenta' : 'Ingresar'}
            </Link>
            {onOpenCart && (
              <button className="cart-button" type="button" onClick={onOpenCart} aria-label="Abrir carrito de compras">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h9.5a2 2 0 0 0 2-1.6L22 8H6"/><circle cx="10" cy="20" r="1"/><circle cx="19" cy="20" r="1"/></svg>
                <span>Carrito</span><span className="cart-count">{count}</span>
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  )
}
