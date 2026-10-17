import { paymentMethods } from '../../config/checkout'
import { socialNetworks } from '../../config/social'
import { PaymentInfo } from '../common/PaymentInfo'
import { FaqSection } from './FaqSection'
import { useSiteContent } from '../../features/content/SiteContentContext'

export function StoreInfoSections() {
  const { payments, how, social } = useSiteContent()
  return (
    <>
      <section id="pagos" className="info-section wrap section-pad" aria-labelledby="paymentsTitle">
        <div className="section-heading">
          <div><div className="section-kicker">{payments.kicker}</div><h2 id="paymentsTitle">{payments.title} <em>{payments.accent}</em></h2>{payments.text && <p>{payments.text}</p>}</div>
        </div>
        <div className="payments-grid">
          {paymentMethods.map((method) => <PaymentInfo method={method} key={method.id} />)}
        </div>
        {payments.footnote && <p className="info-footnote">{payments.footnote}</p>}
      </section>

      <section id="ayuda" className="info-section how-section" aria-labelledby="howTitle">
        <div className="wrap section-pad">
          <div className="section-heading">
            <div><div className="section-kicker">{how.kicker}</div><h2 id="howTitle">{how.title} <em>{how.accent}</em></h2></div>
          </div>
          <ol className="how-steps">
            {how.steps.map((step, index) => (
              <li key={index}><span className="how-number">{String(index + 1).padStart(2, '0')}</span><h3>{step.title}</h3><p>{step.text}</p></li>
            ))}
          </ol>
        </div>
      </section>

      <FaqSection />

      <section id="redes" className="info-section wrap section-pad" aria-labelledby="socialTitle">
        <div className="section-heading">
          <div><div className="section-kicker">{social.kicker}</div><h2 id="socialTitle">{social.title} <em>{social.accent}</em></h2></div>
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
