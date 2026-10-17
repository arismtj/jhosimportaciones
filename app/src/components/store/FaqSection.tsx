import { advisors } from '../../config/checkout'
import { useSiteContent } from '../../features/content/SiteContentContext'
import { defaultGreeting, whatsappLink } from '../../config/whatsapp'

export function FaqSection() {
  const { faq } = useSiteContent()
  return (
    <section id="preguntas" className="faq-section wrap section-pad" aria-labelledby="faqTitle">
      <div className="faq-heading">
        <div className="section-kicker">{faq.kicker}</div>
        <h2 id="faqTitle">{faq.title} <em>{faq.accent}</em></h2>
        {faq.text && <p>{faq.text}</p>}
      </div>
      <div className="faq-grid">
        {faq.items.map((item, index) => (
          <details className="faq-item" key={index} open={index === 0}>
            <summary>{item.question}<span className="faq-icon" aria-hidden="true" /></summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
      <div className="faq-cta">
        <span>¿No encontraste tu respuesta?</span>
        {advisors.map((advisor) => (
          <a key={advisor.whatsapp} href={whatsappLink(advisor.whatsapp, defaultGreeting)} target="_blank" rel="noopener noreferrer">Escribir al {advisor.label} <span aria-hidden="true">↗</span></a>
        ))}
      </div>
    </section>
  )
}
