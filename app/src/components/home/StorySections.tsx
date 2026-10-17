export function StorySections() {
  return (
    <>
      <section className="personalize-section wrap" aria-labelledby="personalizeTitle">
        <div className="personalize-art"><span>✦</span><span>♡</span><span>✿</span></div>
        <div className="personalize-copy"><div className="section-kicker">TÚ LO IMAGINAS, NOSOTROS TE AYUDAMOS</div><h2 id="personalizeTitle">¿Tienes una idea <em>especial?</em></h2><p>Cuéntanos qué quieres personalizar: una taza con su nombre, un detalle romántico o un regalo único para alguien importante.</p><a className="btn btn-light" href="#catalogo">Inspírate en el catálogo <span aria-hidden="true">→</span></a></div>
      </section>
      <section id="nosotros" className="about-section wrap section-pad">
        <div className="about-stamp" aria-hidden="true"><span>JHOS</span><small>regalos con corazón</small><span>♡</span></div>
        <div className="about-copy"><div className="section-kicker">CONÓCENOS</div><h2>Pequeños detalles, <em>grandes sonrisas.</em></h2><p>En <strong>JHOS Importaciones</strong> reunimos regalos, detalles personalizados, peluches y productos para el hogar. Queremos ayudarte a encontrar algo bonito para cada ocasión.</p><p className="about-note">Consulta con nosotros la disponibilidad, personalización y entrega de tu producto favorito.</p></div>
      </section>
    </>
  )
}
