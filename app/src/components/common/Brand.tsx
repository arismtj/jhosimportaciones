import { Link } from 'react-router-dom'

export function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <Link className={`brand${footer ? ' footer-brand' : ''}`} to="/" aria-label="JHOS Importaciones, ir al inicio">
      <span className="brand-symbol" aria-hidden="true">✿</span>
      <span className="brand-name"><strong>JHOS</strong><small>IMPORTACIONES</small></span>
    </Link>
  )
}
