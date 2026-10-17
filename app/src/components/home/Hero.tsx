import { useSiteContent } from '../../features/content/SiteContentContext'
import { promoMediaPublicUrl } from '../../services/supabase/media'

export function Hero() {
  const { hero } = useSiteContent()
  return (
    <section className="hero wrap" aria-labelledby="heroTitle">
      <div className="hero-copy">
        {hero.eyebrow && <div className="eyebrow"><span>♥</span> {hero.eyebrow}</div>}
        <h1 id="heroTitle">{hero.title} {hero.accent && <em>{hero.accent}</em>}</h1>
        {hero.text && <p>{hero.text}</p>}
        <div className="hero-actions">
          {hero.primaryLabel && <a className="btn btn-primary" href="#catalogo">{hero.primaryLabel} <span aria-hidden="true">→</span></a>}
          {hero.secondaryLabel && <a className="btn btn-text" href="#categorias">{hero.secondaryLabel} <span aria-hidden="true">↗</span></a>}
        </div>
        {hero.foot && <div className="hero-foot"><span className="hero-foot-icon">✧</span> {hero.foot}</div>}
      </div>
      {hero.image ? (
        <div className="hero-art hero-photo"><img src={promoMediaPublicUrl(hero.image)} alt="" />{hero.note && <div className="hero-note"><span>♥</span> {hero.note}</div>}</div>
      ) : (
        <div className="hero-art" role="img" aria-label="Ilustración decorativa de una caja de regalo, corazones y flores">
          <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
          <span className="deco deco-star">✦</span><span className="deco deco-heart">♥</span><span className="deco deco-flower">✿</span>
          <div className="gift-shadow" />
          <div className="gift-box"><div className="gift-lid" /><div className="gift-ribbon-v" /><div className="gift-ribbon-h" /><div className="gift-knot">♡</div></div>
          {hero.note && <div className="hero-note"><span>♥</span> {hero.note}</div>}
        </div>
      )}
      <div className="hero-marker">01 / 04</div>
    </section>
  )
}
