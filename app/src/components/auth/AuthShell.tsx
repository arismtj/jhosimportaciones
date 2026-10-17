import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '../layout/Header'

interface AuthShellProps {
  eyebrow: string
  title: string
  subtitle: string
  children: ReactNode
  alternateText: string
  alternateLabel: string
  alternateTo: string
}

export function AuthShell({ eyebrow, title, subtitle, children, alternateText, alternateLabel, alternateTo }: AuthShellProps) {
  return (
    <div className="auth-page">
      <Header compact />
      <main className="auth-main">
        <section className="auth-card" aria-labelledby="authTitle">
          <Link className="auth-back" to="/">← Volver a la tienda</Link>
          <div className="section-kicker">{eyebrow}</div>
          <h1 id="authTitle">{title}</h1>
          <p className="auth-subtitle">{subtitle}</p>
          {children}
          <p className="auth-alternate">{alternateText} <Link to={alternateTo}>{alternateLabel}</Link></p>
          <Link className="guest-link" to="/#catalogo">Continuar comprando como invitado →</Link>
        </section>
        <aside className="auth-art" aria-hidden="true"><span>✦</span><div>♡</div><strong>Un detalle especial<br />empieza aquí.</strong><small>JHOS Importaciones</small></aside>
      </main>
    </div>
  )
}
