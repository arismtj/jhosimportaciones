import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MenuAdmin } from '../components/admin/MenuAdmin'
import { PromotionsAdmin } from '../components/admin/PromotionsAdmin'
import { ProductsAdmin } from '../components/admin/ProductsAdmin'
import { TeamAdmin } from '../components/admin/TeamAdmin'
import { signInWithGoogle } from '../features/auth/authActions'
import { useAuth } from '../features/auth/AuthContext'

type Tab = 'products' | 'menu' | 'promotions' | 'team'

function AdminLogin({ message, onSignOut }: { message?: string; onSignOut?: () => void }) {
  const [error, setError] = useState('')
  const login = async () => {
    setError('')
    try { await signInWithGoogle('/administracion') } catch (caught) { setError(caught instanceof Error ? caught.message : 'No se pudo iniciar sesión.') }
  }
  return (
    <main className="admin-login">
      <div className="admin-login-card">
        <img src="/brand-logo.webp" alt="" width="72" height="72" />
        <h1>Panel de JHOS</h1>
        {message ? <p>{message}</p> : <p>Entra con tu cuenta de Google para administrar productos y promociones.</p>}
        {onSignOut ? <button type="button" className="btn btn-outline" onClick={onSignOut}>Cerrar sesión y usar otra cuenta</button>
          : <button type="button" className="btn btn-primary admin-google" onClick={() => void login()}>Entrar con Google</button>}
        {error && <p className="admin-error">{error}</p>}
        <Link to="/" className="admin-login-back">← Volver a la tienda</Link>
      </div>
    </main>
  )
}

export function AdminPage() {
  const { loading, user, role, email, displayName, signOut, configured } = useAuth()
  const [tab, setTab] = useState<Tab>('products')
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!toast) return
    const timeout = window.setTimeout(() => setToast(''), 4000)
    return () => window.clearTimeout(timeout)
  }, [toast])

  if (!configured) return <AdminLogin message="La tienda no está conectada a la base de datos." />
  if (loading) return <main className="admin-login"><p>Verificando acceso…</p></main>
  if (!user) return <AdminLogin />
  if (role !== 'admin') return <AdminLogin message={`La cuenta ${email} no tiene permiso de administración. Pide acceso a quien administra la tienda.`} onSignOut={() => void signOut()} />

  return (
    <div className="admin-app">
      <header className="admin-top">
        <Link to="/" className="admin-brand"><img src="/brand-logo.webp" alt="" width="36" height="36" /><span>Panel JHOS</span></Link>
        <nav className="admin-tabs" aria-label="Secciones del panel">
          {([['products', '🛍️ Productos'], ['menu', '🧭 Menú y páginas'], ['promotions', '✨ Promociones'], ['team', '👥 Equipo']] as const).map(([id, label]) => (
            <button type="button" key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>
          ))}
        </nav>
        <div className="admin-user">
          <span>Hola, {displayName.split(' ')[0]}</span>
          <Link to="/" target="_blank">Ver tienda ↗</Link>
          <button type="button" className="link-button" onClick={() => void signOut()}>Salir</button>
        </div>
      </header>
      <main className="admin-main">
        {tab === 'products' && <ProductsAdmin notify={setToast} />}
        {tab === 'menu' && <MenuAdmin notify={setToast} />}
        {tab === 'promotions' && <PromotionsAdmin notify={setToast} />}
        {tab === 'team' && <TeamAdmin notify={setToast} myEmail={email} />}
      </main>
      {toast && <div className="admin-toast" role="status">{toast}</div>}
    </div>
  )
}
