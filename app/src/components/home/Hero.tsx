export function Hero() {
  return (
    <section className="hero wrap" aria-labelledby="heroTitle">
      <div className="hero-copy">
        <div className="eyebrow"><span>♥</span> PARA CADA MOMENTO ESPECIAL</div>
        <h1 id="heroTitle">El detalle perfecto <em>nace del corazón.</em></h1>
        <p>Detalles sublimados, regalos románticos, peluches y cositas lindas para el hogar. Encuentra ese regalo que dice más que mil palabras.</p>
        <div className="hero-actions">
          <a className="btn btn-primary" href="#catalogo">Explorar productos <span aria-hidden="true">→</span></a>
          <a className="btn btn-text" href="#categorias">Ver categorías <span aria-hidden="true">↗</span></a>
        </div>
        <div className="hero-foot"><span className="hero-foot-icon">✧</span> Personaliza tus ideas con nosotros</div>
      </div>
      <div className="hero-art" role="img" aria-label="Ilustración decorativa de una caja de regalo, corazones y flores">
        <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
        <span className="deco deco-star">✦</span><span className="deco deco-heart">♥</span><span className="deco deco-flower">✿</span>
        <div className="gift-shadow" />
        <div className="gift-box"><div className="gift-lid" /><div className="gift-ribbon-v" /><div className="gift-ribbon-h" /><div className="gift-knot">♡</div></div>
        <div className="hero-note"><span>♥</span> hecho para sorprender</div>
      </div>
      <div className="hero-marker">01 / 04</div>
    </section>
  )
}
