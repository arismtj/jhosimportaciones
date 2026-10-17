import { useEffect, useMemo, useState } from 'react'
import { useCart } from '../../features/cart/CartContext'
import { useCategories } from '../../features/catalog/useCategories'
import { getCatalog } from '../../services/supabase/catalog'
import { trackEvent } from '../../services/analytics'
import type { Product } from '../../types/product'
import { ProductCard } from './ProductCard'
import { ProductDialog } from './ProductDialog'

export type CatalogFilter = 'todos' | string
type SortOption = 'featured' | 'priceAsc' | 'priceDesc' | 'name'

interface CatalogSectionProps {
  filter: CatalogFilter
  onFilterChange: (filter: CatalogFilter) => void
  onProductAdded: () => void
}

const PAGE_SIZE = 24

export function CatalogSection({ filter, onFilterChange, onProductAdded }: CatalogSectionProps) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('featured')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestVersion, setRequestVersion] = useState(0)
  const { addItem } = useCart()
  const { categories, families, subcategoriesOf, loaded: categoriesLoaded, error: categoriesError, reload: reloadCategories } = useCategories()

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(timeout)
  }, [search])

  const categoryIds = useMemo(() => {
    if (filter === 'todos') return undefined
    const selected = categories.find((category) => category.slug === filter)
    if (!selected) return []
    if (selected.parent_id) return [selected.id]
    return categories.filter((category) => category.parent_id === selected.id).map((category) => category.id)
  }, [categories, filter])

  useEffect(() => {
    if (!categoriesLoaded) return
    if (!categories.length || (filter !== 'todos' && !categoryIds?.length)) {
      setProducts([])
      setTotal(0)
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    setError('')
    getCatalog({ categoryIds, search: debouncedSearch, sort, page, pageSize: PAGE_SIZE }, categories)
      .then((result) => {
        if (!active) return
        setProducts(result.products)
        setTotal(result.total)
      })
      .catch((reason: unknown) => {
        if (!active) return
        setProducts([])
        setTotal(0)
        setError(reason instanceof Error ? reason.message : 'No se pudo consultar el catálogo.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [categories, categoriesLoaded, categoryIds, debouncedSearch, page, requestVersion, sort, filter])

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const selectedCategory = categories.find((category) => category.slug === filter)
  const activeFamily = selectedCategory?.parent_id
    ? families.find((family) => family.id === selectedCategory.parent_id)
    : families.find((family) => family.slug === filter)
  const visibleSubcategories = activeFamily ? subcategoriesOf(activeFamily.id) : []
  const shownError = error || categoriesError

  const changeFilter = (nextFilter: CatalogFilter) => {
    setPage(1)
    onFilterChange(nextFilter)
  }

  const addProduct = (product: Product, notes = '') => {
    addItem(product, notes)
    trackEvent('add_to_cart', { item_name: product.name, value: product.price, currency: 'PEN' })
    setSelectedProduct(null)
    onProductAdded()
  }

  const reset = () => {
    setSearch('')
    setPage(1)
    onFilterChange('todos')
  }

  const retry = () => {
    setError('')
    setLoading(true)
    if (categoriesError) reloadCategories()
    setRequestVersion((current) => current + 1)
  }

  useEffect(() => {
    setPage(1)
  }, [filter])

  useEffect(() => {
    if (categoriesError) setLoading(false)
  }, [categoriesError])

  return (
    <section id="catalogo" className="catalog-section section-pad" aria-labelledby="catalogTitle">
      <div className="wrap">
        <div className="section-heading catalog-heading">
          <div><div className="section-kicker">ESCOGIDOS PARA TI</div><h2 id="catalogTitle">Nuestro <em>catálogo</em></h2><p>Descubre productos reales para regalar, celebrar y disfrutar.</p></div>
          <span className="demo-pill">Catálogo actualizado · precios sujetos a confirmación</span>
        </div>
        <div className="catalog-toolbar">
          <div className="filter-scroll" role="group" aria-label="Filtrar por familia">
            <button type="button" className={`filter-chip${filter === 'todos' ? ' active' : ''}`} aria-pressed={filter === 'todos'} onClick={() => changeFilter('todos')}>Todos</button>
            {families.map((family) => <button type="button" className={`filter-chip${activeFamily?.id === family.id ? ' active' : ''}`} aria-pressed={activeFamily?.id === family.id} onClick={() => changeFilter(family.slug)} key={family.id}>{family.name}</button>)}
          </div>
          <label className="search-wrap"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 5 5"/></svg><input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Buscar un producto..." aria-label="Buscar productos" /></label>
        </div>
        {activeFamily && visibleSubcategories.length > 0 && (
          <div className="subcategory-chips" role="group" aria-label={`Subcategorías de ${activeFamily.name}`}>
            <button type="button" className={`subcategory-chip${filter === activeFamily.slug ? ' active' : ''}`} aria-pressed={filter === activeFamily.slug} onClick={() => changeFilter(activeFamily.slug)}>Todos</button>
            {visibleSubcategories.map((sub) => <button type="button" className={`subcategory-chip${filter === sub.slug ? ' active' : ''}`} aria-pressed={filter === sub.slug} onClick={() => changeFilter(sub.slug)} key={sub.id}>{sub.name}</button>)}
          </div>
        )}
        <div className="catalog-meta">
          <span aria-live="polite">{loading ? 'Cargando catálogo…' : `${total} producto${total === 1 ? '' : 's'} encontrado${total === 1 ? '' : 's'}`}</span>
          <label className="sort-label">Ordenar por <select value={sort} onChange={(event) => { setSort(event.target.value as SortOption); setPage(1) }}><option value="featured">Destacados</option><option value="priceAsc">Precio: menor a mayor</option><option value="priceDesc">Precio: mayor a menor</option><option value="name">Nombre</option></select></label>
        </div>
        {shownError ? (
          <div className="catalog-error" role="alert"><span aria-hidden="true">!</span><h3>No pudimos cargar el catálogo real</h3><p>{shownError}</p><button className="btn btn-primary" type="button" onClick={retry}>Reintentar</button></div>
        ) : loading ? (
          <div className="catalog-loading" role="status"><span className="catalog-spinner" aria-hidden="true" />Cargando productos reales…</div>
        ) : products.length ? (
          <>
            <div className="products-grid">{products.map((product) => <ProductCard product={product} onAdd={addProduct} onView={setSelectedProduct} key={product.id} />)}</div>
            {pageCount > 1 && <nav className="catalog-pagination" aria-label="Paginación del catálogo"><button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>← Anterior</button><span>Página {page} de {pageCount}</span><button type="button" disabled={page === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Siguiente →</button></nav>}
          </>
        ) : (
          <div className="empty-state"><span>♡</span><h3>No encontramos productos</h3><p>Prueba con otra palabra o categoría.</p><button className="btn btn-primary" type="button" onClick={reset}>Ver todos los productos</button></div>
        )}
      </div>
      <ProductDialog product={selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={addProduct} />
    </section>
  )
}
