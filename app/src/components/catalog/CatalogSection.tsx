import { useMemo, useState } from 'react'
import { products } from '../../data/products'
import { useCart } from '../../features/cart/CartContext'
import type { CategoryId, Product } from '../../types/product'
import { ProductCard } from './ProductCard'
import { ProductDialog } from './ProductDialog'

export type CatalogFilter = CategoryId | 'todos'
type SortOption = 'featured' | 'priceAsc' | 'priceDesc' | 'name'

interface CatalogSectionProps {
  filter: CatalogFilter
  onFilterChange: (filter: CatalogFilter) => void
  onProductAdded: () => void
}

const filterOptions: Array<{ id: CatalogFilter; label: string }> = [
  { id: 'todos', label: 'Todos' },
  { id: 'sublimados', label: 'Sublimados' },
  { id: 'romanticos', label: 'Románticos' },
  { id: 'peluches', label: 'Peluches' },
  { id: 'hogar', label: 'Hogar' },
]

export function CatalogSection({ filter, onFilterChange, onProductAdded }: CatalogSectionProps) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('featured')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const { addItem } = useCart()

  const visibleProducts = useMemo(() => {
    const term = search.toLocaleLowerCase('es').trim()
    const result = products.filter((product) => {
      const matchesCategory = filter === 'todos' || product.category === filter
      const searchable = `${product.name} ${product.description}`.toLocaleLowerCase('es')
      return matchesCategory && searchable.includes(term)
    })
    if (sort === 'priceAsc') result.sort((a, b) => a.price - b.price)
    if (sort === 'priceDesc') result.sort((a, b) => b.price - a.price)
    if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name, 'es'))
    return result
  }, [filter, search, sort])

  const addProduct = (product: Product, notes = '') => {
    addItem(product.id, notes)
    setSelectedProduct(null)
    onProductAdded()
  }

  const reset = () => {
    setSearch('')
    onFilterChange('todos')
  }

  return (
    <section id="catalogo" className="catalog-section section-pad" aria-labelledby="catalogTitle">
      <div className="wrap">
        <div className="section-heading catalog-heading">
          <div><div className="section-kicker">ESCOGIDOS PARA TI</div><h2 id="catalogTitle">Nuestro <em>catálogo</em></h2><p>Descubre una selección para regalar, celebrar y disfrutar.</p></div>
          <span className="demo-pill">Catálogo de demostración · precios referenciales</span>
        </div>
        <div className="catalog-toolbar">
          <div className="filter-scroll" role="group" aria-label="Filtrar por categoría">
            {filterOptions.map((option) => <button type="button" className={`filter-chip${filter === option.id ? ' active' : ''}`} aria-pressed={filter === option.id} onClick={() => onFilterChange(option.id)} key={option.id}>{option.label}</button>)}
          </div>
          <label className="search-wrap"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 5 5"/></svg><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar un regalo..." aria-label="Buscar productos" /></label>
        </div>
        <div className="catalog-meta">
          <span aria-live="polite">{visibleProducts.length} producto{visibleProducts.length === 1 ? '' : 's'} encontrado{visibleProducts.length === 1 ? '' : 's'}</span>
          <label className="sort-label">Ordenar por <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)}><option value="featured">Destacados</option><option value="priceAsc">Precio: menor a mayor</option><option value="priceDesc">Precio: mayor a menor</option><option value="name">Nombre</option></select></label>
        </div>
        {visibleProducts.length ? (
          <div className="products-grid">{visibleProducts.map((product) => <ProductCard product={product} onAdd={(item) => addProduct(item)} onView={setSelectedProduct} key={product.id} />)}</div>
        ) : (
          <div className="empty-state"><span>♡</span><h3>No encontramos productos</h3><p>Prueba con otra palabra o categoría.</p><button className="btn btn-primary" type="button" onClick={reset}>Ver todos los productos</button></div>
        )}
      </div>
      <ProductDialog product={selectedProduct} onClose={() => setSelectedProduct(null)} onAdd={addProduct} />
    </section>
  )
}
