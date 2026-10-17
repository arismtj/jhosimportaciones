import { paymentMethods } from '../../config/checkout'
import { socialNetworks } from '../../config/social'
import { PaymentInfo } from '../common/PaymentInfo'
import { FaqSection } from './FaqSection'

const steps = [
  { title: 'Elige lo que te gusta', text: 'Busca por familia o subcategoría y añade tus productos al carrito.' },
  { title: 'Revisa tu pedido', text: 'Completa la entrega, la personalización y el medio de pago.' },
  { title: 'Confirma por WhatsApp', text: 'Coordinamos el importe final, el diseño, la preparación y la entrega antes del pago.' },
]

export function StoreInfoSections() {
  return (
    <>
      <section id="pagos" className="info-section wrap section-pad" aria-labelledby="paymentsTitle">
        <div className="section-heading">
          <div><div className="section-kicker">A TU MANERA, TAMBIÉN AL PAGAR</div><h2 id="paymentsTitle">Elige tu <em>medio de pago</em></h2><p>Confirma primero el pedido y el importe final con un asesor. Luego envía tu comprobante por WhatsApp.</p></div>
        </div>
        <div className="payments-grid">
          {paymentMethods.map((method) => <PaymentInfo method={method} key={method.id} />)}
        </div>
        <p className="info-footnote">La elección del medio de pago no realiza ningún cargo automático.</p>
      </section>

      <section id="ayuda" className="info-section how-section" aria-labelledby="howTitle">
        <div className="wrap section-pad">
          <div className="section-heading">
            <div><div className="section-kicker">COMPRA CON ACOMPAÑAMIENTO</div><h2 id="howTitle">De tu carrito <em>a un buen detalle</em></h2></div>
          </div>
          <ol className="how-steps">
            {steps.map((step, index) => (
              <li key={step.title}><span className="how-number">{String(index + 1).padStart(2, '0')}</span><h3>{step.title}</h3><p>{step.text}</p></li>
            ))}
          </ol>
        </div>
      </section>

      <FaqSection />

      <section id="redes" className="info-section wrap section-pad" aria-labelledby="socialTitle">
        <div className="section-heading">
          <div><div className="section-kicker">CONECTA CON JHOS</div><h2 id="socialTitle">Descubre lo que <em>estamos creando</em></h2></div>
        </div>
        <div className="social-grid">
          {socialNetworks.map((network) => (
            <article className={`social-card social-${network.id}`} key={network.id}>
              <span className="social-icon" aria-hidden="true">{network.icon}</span>
              <h3>{network.name}</h3>
              {network.links.map((link) => <a href={link.href} target="_blank" rel="noopener noreferrer" key={link.href}>{link.label} <span aria-hidden="true">↗</span></a>)}
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
