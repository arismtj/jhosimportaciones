import { Brand } from '../common/Brand'

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-main">
        <div><Brand footer /><p>Regalos que se sienten, detalles que se recuerdan.</p></div>
        <div className="footer-links"><strong>Explora</strong><a href="/#categorias">Categorías</a><a href="/#catalogo">Productos</a><a href="/#nosotros">Sobre nosotros</a></div>
        <div className="footer-links"><strong>Información</strong><span>Precios sujetos a confirmación</span><span>Pedidos sujetos a disponibilidad</span><span>Perú 🇵🇪</span></div>
      </div>
      <div className="wrap footer-bottom"><span>© {new Date().getFullYear()} JHOS Importaciones.</span><span>Hecho con ♡ para cada ocasión</span></div>
    </footer>
  )
}
