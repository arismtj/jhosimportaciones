import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth, type UserRole } from './AuthContext'

export function ProtectedRoute({ requiredRole }: { requiredRole?: UserRole }) {
  const { loading, user, role } = useAuth()
  const location = useLocation()

  if (loading) return <div className="route-status">Verificando acceso…</div>
  if (!user) return <Navigate to="/iniciar-sesion" replace state={{ from: location.pathname }} />
  if (requiredRole && role !== requiredRole) return <Navigate to="/mi-cuenta" replace />

  return <Outlet />
}
