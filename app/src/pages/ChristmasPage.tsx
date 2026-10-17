import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { categoryPath, collectionJsonLd, content, productPath } from '../../shared/seo.mjs'
import { ProductCard } from '../components/catalog/ProductCard'
import { StoreLayout, useCartUi } from '../components/layout/StoreLayout'
import { advisors } from '../config/checkout'
import { whatsappLink } from '../config/whatsapp'
import { useCart } from '../features/cart/CartContext'
import { useCategories } from '../features/catalog/useCategories'
import { SITE_URL, useSeo } from '../seo/useSeo'
import { getCatalog } from '../services/supabase/catalog'
import type { Product } from '../types/product'

const ideas = [
  { slug: 'detalles-boxes-y-regalos', title: 'Boxes de regalo', text: 'Cajas armadas con dulces, peluches y detalles, listas para sorprender.' },
  { slug: 'sublimacion-tazas-y-tomatodos', title: 'Tazas personalizadas', text: 'Con su foto, nombre o una frase navideña. También por cantidad para empresas.' },
  { slug: 'sublimacion-cuadros-y-fotorocas', title: 'Cuadros con fotos', text: 'Sus mejores recuerdos del año en un cuadro o fotoroca.' },
  { slug: 'importaciones-perfumes-y-accesorios', title: 'Perfumes y accesorios', text: 'Regalos listos para entregar: perfumes, relojes y packs.' },
  { slug: 'detalles-hot-wheels', title: 'Para los más pequeños', text: 'Hot Wheels y detalles para niños y coleccionistas.' },
  { slug: 'importaciones-hogar', title: 'Para la casa', text: 'Vajilla, utensilios y artículos para la cena navideña.' },
]

function ChristmasView() {
  const text = content.pages['regalos-navidad']!
  const navigate = useNavigate()
  const { categories, loaded } = useCategories()
  const { addItem } = useCart()
  const { openCart } = useCartUi()
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    if (!loaded) return
    const ids = categories.filter((item) => ['detalles-boxes-y-regalos', 'sublimacion-tazas-y-tomatodos'].includes(item.slug)).map((item) => item.id)
    if (!ids.length) return
    getCatalog({ categoryIds: ids, pageSize: 8 }, categories).then((result) => setProducts(result.products)).catch(() => setProducts([]))
  }, [loaded, categories])

  useSeo({
    title: text.title,
    description: text.description,
    path: '/regalos-navidad',
    jsonLd: collectionJsonLd({ name: text.h1 ?? text.title, description: text.description, path: '/regalos-navidad', products }, SITE_URL),
  })

  const message = '¡Hola! Vengo de la web de JHOS Importaciones. Quiero ideas de regalos para Navidad.'

  return (
    <>
      <section className="promotions-hero christmas-hero">
        <div className="wrap">
          <div className="section-kicker">NAVIDAD EN JHOS 🎄</div>
          <h1>{text.h1}</h1>
          {(text.intro ?? []).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <div className="christmas-actions">
            {advisors.map((advisor, index) => <a key={advisor.whatsapp} className={`btn btn-whatsapp${index ? ' alt' : ''}`} href={whatsappLink(advisor.whatsapp, message)} target="_blank" rel="noopener noreferrer">Pedir ideas por WhatsApp · {advisor.label} <span aria-hidden="true">↗</span></a>)}
          </div>
        </div>
      </section>
      <section className="wrap section-pad" aria-labelledby="ideasTitle">
        <div className="section-heading"><div><div className="section-kicker">IDEAS PARA CADA PERSONA</div><h2 id="ideasTitle">Encuentra el regalo <em>perfecto</em></h2></div></div>
        <div className="christmas-ideas">
          {ideas.map((idea) => <Link key={idea.slug} to={categoryPath(idea.slug)} className="christmas-idea"><h3>{idea.title}</h3><p>{idea.text}</p><span>Ver productos →</span></Link>)}
        </div>
      </section>
      {products.length > 0 && (
        <section className="wrap section-pad related-products" aria-labelledby="christmasProducts">
          <div className="section-heading"><div><div className="section-kicker">LISTOS PARA REGALAR</div><h2 id="christmasProducts">Favoritos para <em>estas fiestas</em></h2></div></div>
          <div className="products-grid">{products.map((item) => <ProductCard key={item.id} product={item} onAdd={(value) => { addItem(value); openCart() }} onView={(value) => navigate(productPath(value.slug))} />)}</div>
        </section>
      )}
    </>
  )
}

export function ChristmasPage() {
  return <StoreLayout className="christmas-page"><ChristmasView /></StoreLayout>
}
