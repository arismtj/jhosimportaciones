import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCategories } from '../../features/catalog/useCategories'
import { deleteProduct, imageUrl, listAdminProducts, setProductField, type AdminProduct } from '../../services/supabase/admin'
import { formatPrice } from '../../utils/currency'
import { ProductEditor } from './ProductEditor'

type Filter = 'all' | 'hidden' | 'out' | 'featured'
const PAGE = 30

export function ProductsAdmin({ notify }: { notify: (message: string) => void }) {
  const { categories, families, subcategoriesOf } = useCategories()
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [limit, setLimit] = useState(PAGE)
  const [editing, setEditing] = useState<AdminProduct | null | 'new'>(null)

  const load = () => {
    setLoading(true)
    listAdminProducts().then((data) => { setProducts(data); setError('') }).catch((caught: Error) => setError(caught.message)).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const categoryName = useMemo(() => new Map(categories.map((item) => [item.id, item.name])), [categories])
  const visible = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('es')
    const familyIds = category ? new Set([category, ...categories.filter((item) => item.parent_id === category).map((item) => item.id)]) : null
    return products.filter((product) =>
      (!term || product.name.toLocaleLowerCase('es').includes(term)) &&
      (!familyIds || familyIds.has(product.category_id)) &&
      (filter === 'all' || (filter === 'hidden' && !product.published) || (filter === 'out' && product.availability === 'out_of_stock') || (filter === 'featured' && product.featured)))
  }, [products, search, category, filter, categories])

  const quick = async (product: AdminProduct, values: Parameters<typeof setProductField>[1], message: string) => {
    try {
      await setProductField(product.id, values)
      setProducts((current) => current.map((item) => (item.id === product.id ? { ...item, ...values } : item)))
      notify(message)
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : 'No se pudo actualizar.')
    }
  }

  const remove = async (product: AdminProduct) => {
    if (!window.confirm(`¿Eliminar «${product.name}» para siempre?\n\nSi solo quieres que no se vea, usa «Ocultar».`)) return
    try {
      await deleteProduct(product)
      setProducts((current) => current.filter((item) => item.id !== product.id))
      notify('Producto eliminado.')
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : 'No se pudo eliminar.')
    }
  }

  return (
    <section aria-labelledby="productsTitle">
      <div className="admin-section-head">
        <div><h2 id="productsTitle">Mis productos</h2><p>{products.length} productos · {products.filter((item) => !item.published).length} ocultos</p></div>
        <button type="button" className="btn btn-primary admin-new" onClick={() => setEditing('new')}>＋ Nuevo producto</button>
      </div>

      <div className="admin-filters">
        <input type="search" value={search} onChange={(event) => { setSearch(event.target.value); setLimit(PAGE) }} placeholder="🔍 Buscar por nombre…" aria-label="Buscar productos" />
        <select value={category} onChange={(event) => { setCategory(event.target.value); setLimit(PAGE) }} aria-label="Filtrar por categoría">
          <option value="">Todas las categorías</option>
          {families.map((family) => (
            <optgroup key={family.id} label={family.name}>
              <option value={family.id}>Todo {family.name}</option>
              {subcategoriesOf(family.id).map((sub) => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
            </optgroup>
          ))}
        </select>
        <div className="admin-chips" role="group" aria-label="Filtros">
          {([['all', 'Todos'], ['hidden', 'Ocultos'], ['out', 'Agotados'], ['featured', 'Destacados']] as const).map(([id, label]) => (
            <button type="button" key={id} className={filter === id ? 'active' : ''} onClick={() => { setFilter(id); setLimit(PAGE) }}>{label}</button>
          ))}
        </div>
      </div>

      {error && <p className="admin-error" role="alert">{error} <button type="button" className="link-button" onClick={load}>Reintentar</button></p>}
      {loading ? <p className="admin-empty">Cargando productos…</p> : !visible.length ? <p className="admin-empty">No hay productos con ese filtro.</p> : (
        <ul className="admin-list">
          {visible.slice(0, limit).map((product) => {
            const cover = [...product.images].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)[0]
            return (
              <li key={product.id} className={!product.published ? 'is-hidden' : ''}>
                <button type="button" className="admin-item-main" onClick={() => setEditing(product)}>
                  {cover ? <img src={imageUrl(cover)} alt="" loading="lazy" /> : <span className="admin-noimg">📦</span>}
                  <span className="admin-item-text">
                    <strong>{product.name}</strong>
                    <small>{categoryName.get(product.category_id) ?? 'Sin categoría'} · {product.price_mode === 'from' ? 'desde ' : ''}{formatPrice(Number(product.price))}</small>
                    <span className="admin-badges">
                      {!product.published && <em className="b-hidden">Oculto</em>}
                      {product.availability === 'out_of_stock' && <em className="b-out">Agotado</em>}
                      {product.availability === 'made_to_order' && <em>Bajo pedido</em>}
                      {product.featured && <em className="b-star">★ Destacado</em>}
                    </span>
                  </span>
                </button>
                <div className="admin-item-actions">
                  <button type="button" onClick={() => setEditing(product)}>✏️ Editar</button>
                  <button type="button" onClick={() => void quick(product, { published: !product.published }, product.published ? 'Producto oculto.' : 'Producto visible en la tienda.')}>{product.published ? '🙈 Ocultar' : '👁️ Mostrar'}</button>
                  <button type="button" onClick={() => void quick(product, { availability: product.availability === 'out_of_stock' ? 'in_stock' : 'out_of_stock' }, product.availability === 'out_of_stock' ? 'Marcado como disponible.' : 'Marcado como agotado.')}>{product.availability === 'out_of_stock' ? '✅ Disponible' : '⛔ Agotado'}</button>
                  {product.published && <Link to={`/producto/${product.slug}`} target="_blank">🔗 Ver</Link>}
                  <button type="button" className="danger" onClick={() => void remove(product)}>🗑️</button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {visible.length > limit && <button type="button" className="btn btn-outline admin-more" onClick={() => setLimit((value) => value + PAGE)}>Ver más productos ({visible.length - limit})</button>}

      {editing && (
        <ProductEditor
          product={editing === 'new' ? null : editing}
          families={families}
          subcategoriesOf={subcategoriesOf}
          onClose={() => setEditing(null)}
          onSaved={(message) => { setEditing(null); notify(message); load() }}
        />
      )}
    </section>
  )
}
