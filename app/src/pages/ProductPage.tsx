import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { breadcrumbJsonLd, categoryPath, productDescription, productJsonLd, productPath, productTitle } from '../../shared/seo.mjs'
import { ProductCard } from '../components/catalog/ProductCard'
import { PriceDisplay } from '../components/common/PriceDisplay'
import { StoreLayout, useCartUi } from '../components/layout/StoreLayout'
import { advisors, checkoutNotes } from '../config/checkout'
import { whatsappLink } from '../config/whatsapp'
import { useCart } from '../features/cart/CartContext'
import { useCategories } from '../features/catalog/useCategories'
import { SITE_URL, useSeo } from '../seo/useSeo'
import { getProductPage, type ProductPageData } from '../services/supabase/catalog'
import { trackEvent } from '../services/analytics'
import type { Product } from '../types/product'
import { formatPrice } from '../utils/currency'

function ProductView() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const { categories, loaded } = useCategories()
  const { addItem } = useCart()
  const { openCart } = useCartUi()
  const [data, setData] = useState<ProductPageData | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  const [activeImage, setActiveImage] = useState(0)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!loaded) return
    let active = true
    setState('loading')
    setActiveImage(0)
    setNotes('')
    getProductPage(slug, categories)
      .then((result) => {
        if (!active) return
        setData(result)
        setState(result ? 'ready' : 'missing')
        if (result) trackEvent('view_item', { item_id: result.product.externalId ?? result.product.id, item_name: result.product.name, value: result.product.price, currency: 'PEN' })
      })
      .catch(() => { if (active) setState('error') })
    return () => { active = false }
  }, [slug, loaded, categories])

  const product = data?.product
  useSeo(product
    ? {
        title: productTitle(product),
        description: productDescription(product),
        path: productPath(product.slug),
        image: data?.images[0],
        type: 'product',
        jsonLd: [
          productJsonLd(product, data?.images ?? [], SITE_URL),
          breadcrumbJsonLd([
            { name: 'Inicio', path: '/' },
            { name: product.familyName, path: categoryPath(product.familySlug) },
            { name: product.categoryName, path: categoryPath(product.categorySlug) },
            { name: product.name, path: productPath(product.slug) },
          ], SITE_URL),
        ],
      }
    : state === 'missing'
      ? { title: 'Producto no encontrado | JHOS Importaciones', noindex: true }
      : null)

  const add = (item: Product, itemNotes = '') => {
    addItem(item, itemNotes)
    trackEvent('add_to_cart', { item_name: item.name, value: item.price, currency: 'PEN' })
    openCart()
  }

  if (state === 'loading') return <div className="wrap product-page-status" role="status"><span className="catalog-spinner" aria-hidden="true" />Cargando producto…</div>
  if (state === 'error') return <div className="wrap product-page-status"><h1>No pudimos cargar el producto</h1><p>Revisa tu conexión e inténtalo de nuevo.</p><button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Reintentar</button></div>
  if (!product || !data) return <div className="wrap product-page-status"><h1>Producto no encontrado</h1><p>Puede que ya no esté disponible.</p><Link className="btn btn-primary" to="/#catalogo">Ver el catálogo</Link></div>

  const unavailable = product.availability === 'out_of_stock'
  const images = data.images.length ? data.images : product.image ? [product.image] : []
  const url = `${SITE_URL}${productPath(product.slug)}`
  const consult = `¡Hola! Vengo de la web de JHOS Importaciones. Quiero consultar por: ${product.name} (${product.priceMode === 'from' ? 'desde ' : ''}${formatPrice(product.price)}). ${url}`

  return (
    <>
      <nav className="wrap breadcrumbs" aria-label="Ruta de navegación">
        <Link to="/">Inicio</Link><span aria-hidden="true">/</span>
        <Link to={categoryPath(product.familySlug)}>{product.familyName}</Link><span aria-hidden="true">/</span>
        <Link to={categoryPath(product.categorySlug)}>{product.categoryName}</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <article className="wrap product-page">
        <div className="product-gallery">
          <div className={`product-gallery-main tint-${product.tint}`}>
            {product.badge && <span className="product-badge">{product.badge}</span>}
            {images.length ? <img src={images[activeImage] ?? images[0]} alt={product.name} /> : <span aria-hidden="true">{product.emoji}</span>}
          </div>
          {images.length > 1 && (
            <div className="product-thumbs" role="group" aria-label="Fotos del producto">
              {images.map((image, index) => (
                <button type="button" key={image} className={index === activeImage ? 'active' : ''} onClick={() => setActiveImage(index)} aria-label={`Ver foto ${index + 1}`}><img src={image} alt="" loading="lazy" /></button>
              ))}
            </div>
          )}
        </div>

        <div className="product-summary">
          <div className="section-kicker">{product.familyName} · {product.categoryName}</div>
          <h1>{product.name}</h1>
          <PriceDisplay className="product-page-price" value={product.price} mode={product.priceMode} />
          {product.priceMode === 'from' && product.priceMax ? <p className="price-range">Hasta {formatPrice(product.priceMax)} según modelo o presentación.</p> : null}
          <p className={`stock-pill${unavailable ? ' out' : ''}`}>{unavailable ? 'Agotado por ahora' : product.availability === 'made_to_order' ? 'Bajo pedido' : 'Consulta disponibilidad'}</p>
          {product.description && <p className="product-page-description">{product.description}</p>}
          <label className="notes-label" htmlFor="productPageNotes">Personalización o indicaciones <small>(opcional)</small></label>
          <textarea id="productPageNotes" className="product-page-notes" rows={3} maxLength={250} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ej.: nombre, frase, color o dedicatoria..." />
          <button type="button" className="btn btn-primary product-page-add" disabled={unavailable} onClick={() => add(product, notes)}>{unavailable ? 'Producto agotado' : 'Añadir al carrito'} <span aria-hidden="true">→</span></button>
          <div className="product-page-whatsapp">
            <span>¿Tienes dudas sobre este producto?</span>
            {advisors.map((advisor) => (
              <a key={advisor.whatsapp} href={whatsappLink(advisor.whatsapp, consult)} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('contact_whatsapp', { advisor: advisor.label, item_name: product.name })}>Consultar en WhatsApp · {advisor.label} <span aria-hidden="true">↗</span></a>
            ))}
          </div>
          <ul className="product-page-notes-list">
            <li>🚚 {checkoutNotes.shipping}</li>
            <li>📍 Recojo coordinado: {checkoutNotes.pickup}</li>
            <li>💬 Precio y disponibilidad se confirman con tu asesor antes del pago.</li>
          </ul>
        </div>
      </article>

      {data.related.length > 0 && (
        <section className="wrap related-products" aria-labelledby="relatedTitle">
          <div className="section-heading"><div><div className="section-kicker">TAMBIÉN TE PUEDE GUSTAR</div><h2 id="relatedTitle">Más de <em>{product.categoryName}</em></h2></div><Link className="section-link" to={categoryPath(product.categorySlug)}>Ver todo →</Link></div>
          <div className="products-grid">
            {data.related.map((item) => <ProductCard key={item.id} product={item} onAdd={(value) => add(value)} onView={(value) => navigate(productPath(value.slug))} />)}
          </div>
        </section>
      )}
    </>
  )
}

export function ProductPage() {
  return <StoreLayout className="product-page-main"><ProductView /></StoreLayout>
}
