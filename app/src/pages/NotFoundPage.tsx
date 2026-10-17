import { Link } from 'react-router-dom'
import { Header } from '../components/layout/Header'

export function NotFoundPage() {
  return <><Header compact /><main className="not-found"><span>♡</span><h1>Página no encontrada</h1><p>El detalle que buscabas no está aquí.</p><Link className="btn btn-primary" to="/">Volver a la tienda</Link></main></>
}
