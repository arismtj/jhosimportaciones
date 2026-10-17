import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

/** Enlace que sirve para rutas internas, anclas (#seccion) y enlaces externos. */
export function SmartLink({ href, className, children, onClick }: { href: string; className?: string; children: ReactNode; onClick?: () => void }) {
  if (/^(https?:|mailto:|tel:)/.test(href)) return <a href={href} className={className} target="_blank" rel="noopener noreferrer" onClick={onClick}>{children}</a>
  if (href.includes('#')) return <a href={href} className={className} onClick={onClick}>{children}</a>
  return <Link to={href} className={className} onClick={onClick}>{children}</Link>
}
