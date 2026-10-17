import { Link } from 'react-router-dom'

export function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <Link className={`brand${footer ? ' footer-brand' : ''}`} to="/" aria-label="JHOS Importaciones, ir al inicio">
      <img
        className="brand-logo"
        src="/JHOS_logo_optimizado_menos_1MB.png"
        alt=""
        width="56"
        height="56"
        aria-hidden="true"
      />
      <span className="brand-name"><strong>JHOS</strong><small>IMPORTACIONES</small></span>
    </Link>
  )
}
