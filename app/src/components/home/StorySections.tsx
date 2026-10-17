import { useSiteContent } from '../../features/content/SiteContentContext'

export function StorySections() {
  const { personalize, about } = useSiteContent()
  return (
    <>
      <section className="personalize-section wrap" aria-labelledby="personalizeTitle">
        <div className="personalize-art"><span>✦</span><span>♡</span><span>✿</span></div>
        <div className="personalize-copy"><div className="section-kicker">{personalize.kicker}</div><h2 id="personalizeTitle">{personalize.title} <em>{personalize.accent}</em></h2><p>{personalize.text}</p>{personalize.button && <a className="btn btn-light" href="#catalogo">{personalize.button} <span aria-hidden="true">→</span></a>}</div>
      </section>
      <section id="nosotros" className="about-section wrap section-pad">
        <div className="about-stamp" aria-hidden="true"><span>JHOS</span><small>regalos con corazón</small><span>♡</span></div>
        <div className="about-copy"><div className="section-kicker">{about.kicker}</div><h2>{about.title} <em>{about.accent}</em></h2><p>{about.text}</p>{about.note && <p className="about-note">{about.note}</p>}</div>
      </section>
    </>
  )
}
