import { Link } from 'react-router-dom'
import { business } from '../../config/business'
import { advisors } from '../../config/checkout'
import { socialNetworks } from '../../config/social'
import { defaultGreeting, whatsappLink } from '../../config/whatsapp'
import { Brand } from '../common/Brand'

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-main footer-grid">
        <div className="footer-brand">
          <Brand footer />
          <p>Personalizamos momentos, creamos emociones. Regalos, importaciones y detalles hechos a tu manera.</p>
          <div className="footer-social" aria-label="Redes sociales">
            {socialNetworks.map((network) => (
              <a key={network.id} className={`footer-social-${network.id}`} href={network.links[0]!.href} target="_blank" rel="noopener noreferrer" aria-label={network.name} title={network.name}>{network.icon}</a>
            ))}
          </div>
        </div>

        <div className="footer-links footer-contact">
          <strong>Hablemos</strong>
          {advisors.map((advisor) => (
            <a key={advisor.whatsapp} className="footer-whatsapp" href={whatsappLink(advisor.whatsapp, defaultGreeting)} target="_blank" rel="noopener noreferrer">
              <span className="footer-whatsapp-dot" aria-hidden="true" />
              <span><small>WhatsApp</small>{advisor.label}</span>
              <span aria-hidden="true">↗</span>
            </a>
          ))}
          <a href={`mailto:${business.email}`}>{business.email}</a>
          <span>{business.hours}</span>
        </div>

        <div className="footer-links">
          <strong>Visítanos</strong>
          <a href={business.mapsUrl} target="_blank" rel="noopener noreferrer">{business.address} <span aria-hidden="true">↗</span></a>
          <span>Recojo: {business.pickup}</span>
          <span>{business.coverage}</span>
        </div>

        <div className="footer-links">
          <strong>Explora</strong>
          <Link to="/categoria/importaciones">Importaciones</Link>
          <Link to="/categoria/detalles">Detalles y regalos</Link>
          <Link to="/categoria/sublimacion">Personalizados</Link>
          <Link to="/regalos-navidad">Regalos de Navidad</Link>
          <Link to="/promociones">Promociones</Link>
          <a href="/#pagos">Medios de pago</a>
          <a href="/#preguntas">Preguntas frecuentes</a>
        </div>
      </div>
      <div className="wrap footer-bottom">
        <span>© {new Date().getFullYear()} {business.legalName} · RUC {business.ruc}</span>
        <span className="footer-credit">Diseño y desarrollo web: <a href={whatsappLink('51960483416', '¡Hola Aris! Vi la web de JHOS Importaciones y quiero una página web para mi negocio.')} target="_blank" rel="noopener noreferrer">Aris Tinoco · +51 960 483 416</a></span>
      </div>
    </footer>
  )
}
