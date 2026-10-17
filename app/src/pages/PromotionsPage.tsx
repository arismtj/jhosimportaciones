import { Link } from 'react-router-dom'
import { advisors } from '../config/checkout'
import { useEffect, useState } from 'react'
import { activePromotions, formatPeruDate, type Promotion } from '../config/promotions'
import { getActivePromotions } from '../services/supabase/promotions'
import { content } from '../../shared/seo.mjs'
import { StoreLayout } from '../components/layout/StoreLayout'
import { useSeo } from '../seo/useSeo'

export function PromotionsPage() {
  const [list, setList] = useState<Promotion[]>(activePromotions)
  useEffect(() => { void getActivePromotions().then(setList) }, [])
  const seo = content.pages.promociones!
  useSeo({ title: seo.title, description: seo.description, path: '/promociones' })

  return (
    <StoreLayout className="promotions-page">
        <section className="promotions-hero">
          <div className="wrap">
            <div className="section-kicker">EXCLUSIVO PARA TI</div>
            <h1>Promociones que <em>te van a encantar.</em></h1>
            <p>Descubre nuestras novedades y oportunidades. Revisa las condiciones de cada promoción y consulta disponibilidad por WhatsApp.</p>
          </div>
        </section>
        <section className="wrap section-pad promotions-list" aria-label="Promociones vigentes">
          {list.length ? list.map((promotion) => {
            const message = encodeURIComponent(`¡Hola! Quiero información sobre la promoción «${promotion.title}» de JHOS Importaciones.`)
            return (
              <article className="promo-card" key={promotion.id}>
                {promotion.media && (
                  (promotion.mediaType ? promotion.mediaType === 'video' : /\.(mp4|webm|mov)$/i.test(promotion.media))
                    ? <video src={promotion.media} controls playsInline preload="metadata" aria-label={`Video de la promoción ${promotion.title}`} />
                    : <img src={promotion.media} alt={promotion.title} loading="lazy" />
                )}
                <div className="promo-body">
                  <h2>{promotion.title}</h2>
                  <p className="promo-text">{promotion.text}</p>
                  <p className="promo-dates">Desde {formatPeruDate(promotion.start)} · Hasta {formatPeruDate(promotion.end)} · Hora de Perú</p>
                  <span className="promo-advisor-label">Elige tu asesor:</span>
                  <div className="promo-actions">
                    {advisors.map((advisor, index) => (
                      <a key={advisor.whatsapp} className={`btn btn-whatsapp${index ? ' alt' : ''}`} href={`https://wa.me/${advisor.whatsapp}?text=${message}`} target="_blank" rel="noopener noreferrer">WhatsApp {advisor.label} <span aria-hidden="true">↗</span></a>
                    ))}
                  </div>
                </div>
              </article>
            )
          }) : (
            <div className="empty-state"><span>✦</span><h3>Pronto tendremos nuevas promociones</h3><p>Mientras tanto, descubre nuestro catálogo.</p><Link className="btn btn-primary" to="/#catalogo">Ver productos</Link></div>
          )}
        </section>
    </StoreLayout>
  )
}
