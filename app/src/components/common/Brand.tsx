import { Link } from 'react-router-dom'

export function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <Link className={`brand${footer ? ' footer-brand' : ''}`} to="/" aria-label="JHOS Importaciones, ir al inicio">
      <picture>
        <source srcSet="/brand-logo.webp" type="image/webp" />
        <img className="brand-logo" src="/brand-logo.png" alt="" width="56" height="56" aria-hidden="true" decoding="async" />
      </picture>
      <span className="brand-name"><strong>JHOS</strong><small>IMPORTACIONES</small></span>
    </Link>
  )
}
