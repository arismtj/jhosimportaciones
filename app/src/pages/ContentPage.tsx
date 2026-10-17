import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { advisors } from '../config/checkout'
import { StoreLayout } from '../components/layout/StoreLayout'
import { getPageBySlug, pageImageUrl, type ContentPage as Page } from '../services/supabase/pages'
import { useSeo } from '../seo/useSeo'

export function ContentPage() {
  const { slug = '' } = useParams()
  const [page, setPage] = useState<Page | null | undefined>(undefined)

  useEffect(() => {
    let active = true
    setPage(undefined)
    getPageBySlug(slug).then((data) => { if (active) setPage(data) }).catch(() => { if (active) setPage(null) })
    return () => { active = false }
  }, [slug])

  useSeo(page ? {
    title: `${page.title} | JHOS Importaciones`,
    description: page.body.replace(/\s+/g, ' ').slice(0, 155) || `${page.title} en JHOS Importaciones.`,
    path: `/pagina/${page.slug}`,
    image: page.image_url ? pageImageUrl(page.image_url) : undefined,
  } : null)

  const message = page ? encodeURIComponent(`¡Hola! Vi la página «${page.title}» de JHOS Importaciones y quiero más información.`) : ''

  return (
    <StoreLayout className="content-page">
      {page === undefined ? <div className="wrap section-pad"><p>Cargando…</p></div> : page === null ? (
        <div className="wrap section-pad empty-state"><span>♡</span><h1>Página no encontrada</h1><p>Puede que se haya movido o ya no esté disponible.</p><Link className="btn btn-primary" to="/">Volver a la tienda</Link></div>
      ) : (
        <article className="wrap section-pad content-article">
          <h1>{page.title}</h1>
          {page.image_url && <img className="content-image" src={pageImageUrl(page.image_url)} alt={page.title} />}
          {page.body.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          <div className="content-cta">
            <span>¿Tienes dudas? Escríbenos:</span>
            <div className="promo-actions">
              {advisors.map((advisor, index) => (
                <a key={advisor.whatsapp} className={`btn btn-whatsapp${index ? ' alt' : ''}`} href={`https://wa.me/${advisor.whatsapp}?text=${message}`} target="_blank" rel="noopener noreferrer">WhatsApp {advisor.label} <span aria-hidden="true">↗</span></a>
              ))}
            </div>
          </div>
        </article>
      )}
    </StoreLayout>
  )
}
