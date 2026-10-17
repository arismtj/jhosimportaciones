import type { CategoryId } from '../../types/product'

const categories: Array<{ id: CategoryId; emoji: string; title: string; subtitle: string }> = [
  { id: 'sublimados', emoji: '☕', title: 'Detalles sublimados', subtitle: 'Un recuerdo a tu estilo' },
  { id: 'romanticos', emoji: '💝', title: 'Detalles románticos', subtitle: 'Haz latir su corazón' },
  { id: 'peluches', emoji: '🧸', title: 'Peluches', subtitle: 'Abrazos en forma de regalo' },
  { id: 'hogar', emoji: '🍽️', title: 'Hogar y utensilios', subtitle: 'Detalles para cada día' },
]

export function CategoryGrid({ onSelect }: { onSelect: (category: CategoryId) => void }) {
  const select = (category: CategoryId) => {
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
