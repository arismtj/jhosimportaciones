import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { WhatsAppButton } from './components/common/WhatsAppButton'
import { ProtectedRoute } from './features/auth/ProtectedRoute'
import { HomePage } from './pages/HomePage'
import { Seo } from './seo/useSeo'

const AccountPage = lazy(() => import('./pages/AccountPage').then((module) => ({ default: module.AccountPage })))
const AdminPage = lazy(() => import('./pages/AdminPage').then((module) => ({ default: module.AdminPage })))
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })))
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((module) => ({ default: module.RegisterPage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })))
const PromotionsPage = lazy(() => import('./pages/PromotionsPage').then((module) => ({ default: module.PromotionsPage })))
const ProductPage = lazy(() => import('./pages/ProductPage').then((module) => ({ default: module.ProductPage })))
const CategoryPage = lazy(() => import('./pages/CategoryPage').then((module) => ({ default: module.CategoryPage })))
const ChristmasPage = lazy(() => import('./pages/ChristmasPage').then((module) => ({ default: module.ChristmasPage })))

function PageLoading() {
  return <div className="page-loading" role="status"><span className="catalog-spinner" aria-hidden="true" /><span className="sr-only">Cargando…</span></div>
}

export function App() {
  return (
    <>
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/producto/:slug" element={<ProductPage />} />
          <Route path="/categoria/:slug" element={<CategoryPage />} />
          <Route path="/promociones" element={<PromotionsPage />} />
          <Route path="/regalos-navidad" element={<ChristmasPage />} />
          <Route path="/iniciar-sesion" element={<Seo title="Iniciar sesión | JHOS Importaciones" noindex><LoginPage /></Seo>} />
          <Route path="/registro" element={<Seo title="Crear cuenta | JHOS Importaciones" noindex><RegisterPage /></Seo>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/mi-cuenta" element={<Seo title="Mi cuenta | JHOS Importaciones" noindex><AccountPage /></Seo>} />
          </Route>
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/administracion" element={<Seo title="Administración | JHOS Importaciones" noindex><AdminPage /></Seo>} />
          </Route>
          <Route path="*" element={<Seo title="Página no encontrada | JHOS Importaciones" noindex><NotFoundPage /></Seo>} />
        </Routes>
      </Suspense>
      <WhatsAppButton />
    </>
  )
}
