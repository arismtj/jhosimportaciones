import { Link } from 'react-router-dom'
import { useCategories } from '../../features/catalog/useCategories'
import { useSiteContent } from '../../features/content/SiteContentContext'

const defaults: Record<string, { emoji: string; subtitle: string }> = {
  importaciones: { emoji: '🛍️', subtitle: 'Hogar, ropa y accesorios' },
  detalles: { emoji: '💝', subtitle: 'Regalos para cada ocasión' },
  sublimacion: { emoji: '☕', subtitle: 'Recuerdos personalizados' },
}
const fallbackEmoji = ['🎁', '✨', '🌸', '🎀', '💐', '🧸']

export function CategoryGrid() {
  const { families } = useCategories()
  const { categories } = useSiteContent()

  return (
    <section id="categorias" className="categories-section wrap section-pad" aria-labelledby="categoriesTitle">
      <div className="section-heading">
        <div><div className="section-kicker">{categories.kicker}</div><h2 id="categoriesTitle">{categories.title} <em>{categories.accent}</em></h2></div>
        <a className="section-link" href="#catalogo">{categories.linkLabel} <span aria-hidden="true">↗</span></a>
      </div>
      <div className="category-grid">
        {families.map((family, index) => {
          const preset = defaults[family.slug]
          const [emoji, ...rest] = (family.description ?? '').trim().split(' ')
          const hasEmoji = Boolean(emoji && /\p{Extended_Pictographic}/u.test(emoji))
          const subtitle = family.description ? (hasEmoji ? rest.join(' ') : family.description) : preset?.subtitle ?? 'Ver productos'
          return (
            <Link to={`/categoria/${family.slug}`} className={`category-card category-card-${preset ? family.slug : `extra-${index % 3}`}`} key={family.id}>
              <span className="category-emoji" aria-hidden="true">{hasEmoji ? emoji : preset?.emoji ?? fallbackEmoji[index % fallbackEmoji.length]}</span>
              <span className="category-meta"><strong>{family.name}</strong><small>{subtitle} <span>↗</span></small></span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
