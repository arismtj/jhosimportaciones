import { useSiteContent } from '../../features/content/SiteContentContext'

export function Benefits() {
  const { benefits } = useSiteContent()
  if (!benefits.items.length) return null
  return (
    <section className="benefits" aria-label="Características de nuestra tienda">
      <div className="wrap benefits-inner">
        {benefits.items.map((item, index) => (
          <div className="benefit" key={index}><span className="benefit-icon">{item.icon}</span><span><strong>{item.title}</strong><small>{item.text}</small></span></div>
        ))}
      </div>
    </section>
  )
}
