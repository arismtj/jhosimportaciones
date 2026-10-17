import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { useAuth } from '../features/auth/AuthContext'

export function AccountPage() {
  const { user, role, signOut } = useAuth()
  return <><Header compact /><main className="dashboard-page wrap"><div className="section-kicker">MI CUENTA</div><h1>Hola, qué gusto tenerte aquí.</h1><p>Sesión iniciada como <strong>{user?.email}</strong>.</p><div className="dashboard-card"><h2>Panel del cliente</h2><p>Esta área queda preparada para direcciones, favoritos e historial de pedidos.</p><span className="role-badge">Rol: {role === 'admin' ? 'Administrador' : 'Cliente'}</span></div><button className="btn btn-primary" type="button" onClick={() => void signOut()}>Cerrar sesión</button></main><Footer /></>
}
