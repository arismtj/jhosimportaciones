import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { breadcrumbJsonLd, categoryPath, collectionJsonLd, content, productPath } from '../../shared/seo.mjs'
import { ProductCard } from '../components/catalog/ProductCard'
import { StoreLayout, useCartUi } from '../components/layout/StoreLayout'
import { useCart } from '../features/cart/CartContext'
import { useCategories } from '../features/catalog/useCategories'
import { SITE_URL, useSeo } from '../seo/useSeo'
import { trackEvent } from '../services/analytics'
import { getCatalog } from '../services/supabase/catalog'
import type { Product } from '../types/product'

const PAGE_SIZE = 24

function CategoryView() {
  const { slug = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('pagina')) || 1)
  const navigate = useNavigate()
  const { categories, families, subcategoriesOf, loaded, error } = useCategories()
  const { addItem } = useCart()
  const { openCart } = useCartUi()
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const category = categories.find((item) => item.slug === slug)
  const family = category?.parent_id ? families.find((item) => item.id === category.parent_id) : category
  const subcategories = family ? subcategoriesOf(family.id) : []
  const text = content.categories[slug]
  const heading = text?.h1 ?? category?.name ?? 'Categoría'

  useEffect(() => {
    if (!loaded || !category) {
      if (loaded) setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    const ids = category.parent_id ? [category.id] : categories.filter((item) => item.parent_id === category.id).map((item) => item.id)
    getCatalog({ categoryIds: ids, page, pageSize: PAGE_SIZE }, categories)
      .then((result) => { if (active) { setProducts(result.products); setTotal(result.total) } })
      .catch(() => { if (active) { setProducts([]); setTotal(0) } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [loaded, category, categories, page])

  const path = `${categoryPath(slug)}${page > 1 ? `?pagina=${page}` : ''}`
  useSeo(category
    ? {
        title: page > 1 ? `${text?.title ?? category.name} · página ${page}` : text?.title ?? `${category.name} | JHOS Importaciones`,
        description: text?.description ?? `${category.name} en JHOS Importaciones. Envíos a Lima y provincias; pide por WhatsApp.`,
        path,
        jsonLd: [
          collectionJsonLd({ name: heading, description: text?.description ?? category.name, path, products }, SITE_URL),
          breadcrumbJsonLd([
            { name: 'Inicio', path: '/' },
            ...(family && family.id !== category.id ? [{ name: family.name, path: categoryPath(family.slug) }] : []),
            { name: category.name, path: categoryPath(category.slug) },
          ], SITE_URL),
        ],
      }
    : loaded ? { title: 'Categoría no encontrada | JHOS Importaciones', noindex: true } : null)

  const add = (item: Product) => {
    addItem(item)
    trackEvent('add_to_cart', { item_name: item.name, value: item.price, currency: 'PEN' })
    openCart()
  }

  if (loaded && !category) {
    return <div className="wrap product-page-status"><h1>{error ? 'No pudimos cargar las categorías' : 'Categoría no encontrada'}</h1><Link className="btn btn-primary" to="/#catalogo">Ver el catálogo</Link></div>
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const goToPage = (next: number) => {
    setParams(next > 1 ? { pagina: String(next) } : {})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <nav className="wrap breadcrumbs" aria-label="Ruta de navegación">
        <Link to="/">Inicio</Link><span aria-hidden="true">/</span>
        {family && category && family.id !== category.id && <><Link to={categoryPath(family.slug)}>{family.name}</Link><span aria-hidden="true">/</span></>}
        <span aria-current="page">{category?.name ?? '…'}</span>
      </nav>
      <section className="wrap category-hero">
        <div className="section-kicker">{family && category && family.id !== category.id ? family.name.toUpperCase() : 'CATEGORÍA'}</div>
        <h1>{heading}</h1>
        {(text?.intro ?? []).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        {subcategories.length > 0 && (
          <div className="subcategory-chips" role="navigation" aria-label="Subcategorías">
            {family && <Link className={`subcategory-chip${family.slug === slug ? ' active' : ''}`} to={categoryPath(family.slug)}>Todo {family.name}</Link>}
            {subcategories.map((sub) => <Link key={sub.id} className={`subcategory-chip${sub.slug === slug ? ' active' : ''}`} to={categoryPath(sub.slug)}>{sub.name}</Link>)}
          </div>
        )}
      </section>
      <section className="wrap category-products" aria-label={`Productos de ${heading}`}>
        <p className="catalog-meta" aria-live="polite">{loading ? 'Cargando productos…' : `${total} producto${total === 1 ? '' : 's'}`}</p>
        {loading ? <div className="catalog-loading" role="status"><span className="catalog-spinner" aria-hidden="true" />Cargando productos…</div> : (
          <div className="products-grid">
            {products.map((item) => <ProductCard key={item.id} product={item} onAdd={add} onView={(value) => navigate(productPath(value.slug))} />)}
          </div>
        )}
        {pageCount > 1 && (
          <nav className="catalog-pagination" aria-label="Paginación">
            <button type="button" disabled={page === 1} onClick={() => goToPage(page - 1)}>← Anterior</button>
            <span>Página {page} de {pageCount}</span>
            <button type="button" disabled={page === pageCount} onClick={() => goToPage(page + 1)}>Siguiente →</button>
          </nav>
        )}
      </section>
    </>
  )
}

export function CategoryPage() {
  return <StoreLayout className="category-page-main"><CategoryView /></StoreLayout>
}
