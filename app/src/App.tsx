import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { AccountPage } from './pages/AccountPage'
import { AdminPage } from './pages/AdminPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { NotFoundPage } from './pages/NotFoundPage'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/iniciar-sesion" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/mi-cuenta" element={<AccountPage />} />
      </Route>
      <Route element={<ProtectedRoute requiredRole="admin" />}>
        <Route path="/administracion" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
