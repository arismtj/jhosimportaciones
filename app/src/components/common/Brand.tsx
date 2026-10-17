import type { MouseEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

export function Brand({ footer = false }: { footer?: boolean }) {
  const { pathname, hash } = useLocation()
  const navigate = useNavigate()

  // En la portada, el logo vuelve arriba del todo (y limpia #seccion de la URL)
  const goHome = (event: MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== '/' || event.metaKey || event.ctrlKey) return
    event.preventDefault()
    if (hash) navigate('/', { replace: true })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <Link className={`brand${footer ? ' footer-brand' : ''}`} to="/" onClick={goHome} aria-label="JHOS Importaciones, ir al inicio">
      <picture>
        <source srcSet="/brand-logo.webp" type="image/webp" />
        <img className="brand-logo" src="/brand-logo.png" alt="" width="56" height="56" aria-hidden="true" decoding="async" />
      </picture>
      <span className="brand-name"><strong>JHOS</strong><small>IMPORTACIONES</small></span>
    </Link>
  )
}
