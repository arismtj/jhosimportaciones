const benefits = [
  ['✧', 'Detalles únicos', 'Para momentos especiales'],
  ['♡', 'Con mucho cariño', 'Regalos con significado'],
  ['✿', 'Atención cercana', 'Te ayudamos a elegir'],
  ['✎', 'Personalizables', 'Tu estilo, tu mensaje'],
]

export function Benefits() {
  return (
    <section className="benefits" aria-label="Características de nuestra tienda">
      <div className="wrap benefits-inner">
        {benefits.map(([icon, title, text]) => (
          <div className="benefit" key={title}><span className="benefit-icon">{icon}</span><span><strong>{title}</strong><small>{text}</small></span></div>
        ))}
      </div>
    </section>
  )
}
