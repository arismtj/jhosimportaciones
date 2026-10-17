import type { CatalogFilter } from '../catalog/CatalogSection'

const categories: Array<{ id: CatalogFilter; emoji: string; title: string; subtitle: string }> = [
  { id: 'importaciones', emoji: '🛍️', title: 'Importaciones', subtitle: 'Hogar, ropa y accesorios' },
  { id: 'detalles', emoji: '💝', title: 'Detalles', subtitle: 'Regalos para cada ocasión' },
  { id: 'sublimacion', emoji: '☕', title: 'Sublimación', subtitle: 'Recuerdos personalizados' },
]

export function CategoryGrid({ onSelect }: { onSelect: (category: CatalogFilter) => void }) {
  const select = (category: CatalogFilter) => {
    onSelect(category)
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="categorias" className="categories-section wrap section-pad" aria-labelledby="categoriesTitle">
      <div className="section-heading">
        <div><div className="section-kicker">ENCUENTRA TU FAVORITO</div><h2 id="categoriesTitle">Algo especial para <em>cada ocasión</em></h2></div>
        <a className="section-link" href="#catalogo">Ver todos los productos <span aria-hidden="true">↗</span></a>
      </div>
      <div className="category-grid">
        {categories.map((category) => (
          <button type="button" className={`category-card category-card-${category.id}`} onClick={() => select(category.id)} key={category.id}>
            <span className="category-emoji" aria-hidden="true">{category.emoji}</span>
            <span className="category-meta"><strong>{category.title}</strong><small>{category.subtitle} <span>↗</span></small></span>
          </button>
        ))}
      </div>
    </section>
  )
}
