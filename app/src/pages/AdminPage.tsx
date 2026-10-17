import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'

export function AdminPage() {
  return <><Header compact /><main className="dashboard-page wrap"><div className="section-kicker">ADMINISTRACIÓN</div><h1>Panel administrativo</h1><div className="dashboard-card"><h2>Acceso restringido</h2><p>Ruta preparada para la gestión futura de productos, inventario y pedidos. El acceso requiere una sesión real con rol <code>admin</code>.</p></div></main><Footer /></>
}
