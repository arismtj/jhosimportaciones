import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { useAuth } from '../features/auth/AuthContext'

export function AccountPage() {
  const { displayName, email, role, signOut } = useAuth()
  const navigate = useNavigate()
  const [signOutError, setSignOutError] = useState('')
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSignOutError('')
    setSigningOut(true)
    try {
      await signOut()
      navigate('/', { replace: true })
    } catch (caught) {
      setSignOutError(caught instanceof Error ? caught.message : 'No se pudo cerrar la sesión.')
      setSigningOut(false)
    }
  }

  return (
    <>
      <Header compact />
      <main className="dashboard-page wrap">
        <div className="section-kicker">MI CUENTA</div>
        <h1>Hola, {displayName}.</h1>
        <p>Tu sesión de JHOS Importaciones está activa.</p>
        <div className="dashboard-card account-summary">
          <div className="account-avatar" aria-hidden="true">{displayName.charAt(0).toUpperCase()}</div>
          <div><span>Nombre</span><strong>{displayName}</strong></div>
          <div><span>Correo</span><strong>{email}</strong></div>
          <span className="role-badge">Rol: {role === 'admin' ? 'Administrador' : 'Cliente'}</span>
        </div>
        <div className="dashboard-card"><h2>Panel del cliente</h2><p>Esta área queda preparada para direcciones, favoritos e historial de pedidos.</p></div>
        {signOutError && <p className="form-error" role="alert">{signOutError}</p>}
        <button className="btn btn-primary" type="button" disabled={signingOut} onClick={() => void handleSignOut()}>{signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}</button>
      </main>
      <Footer />
    </>
  )
}
