import { advisors } from '../../config/checkout'
import { faq } from '../../config/faq'
import { defaultGreeting, whatsappLink } from '../../config/whatsapp'

export function FaqSection() {
  return (
    <section id="preguntas" className="faq-section wrap section-pad" aria-labelledby="faqTitle">
      <div className="faq-heading">
        <div className="section-kicker">ANTES DE ELEGIR</div>
        <h2 id="faqTitle">Resolvemos <em>tus dudas</em></h2>
        <p>Lo que más nos preguntan sobre pedidos, envíos y pagos.</p>
      </div>
      <div className="faq-grid">
        {faq.map((item, index) => (
          <details className="faq-item" key={item.id} open={index === 0}>
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
