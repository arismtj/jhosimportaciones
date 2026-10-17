import { Link } from 'react-router-dom'
import type { Product } from '../../types/product'
import { PriceDisplay } from '../common/PriceDisplay'

interface ProductCardProps {
  product: Product
  onAdd: (product: Product) => void
  onView: (product: Product) => void
}

export function ProductCard({ product, onAdd, onView }: ProductCardProps) {
  const unavailable = product.availability === 'out_of_stock'
  return (
    <article className="product-card">
      <div className={`product-visual tint-${product.tint}`}>
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <Link to={`/producto/${product.slug}`} className="product-visual-link" tabIndex={-1} aria-hidden="true">
          {product.image ? <img src={product.image} alt="" loading="lazy" decoding="async" width="320" height="320" /> : <span className="product-emoji">{product.emoji}</span>}
        </Link>
      </div>
      <div className="product-info">
        <div className="product-category">{product.familyName} · {product.categoryName}</div>
        <h3><Link to={`/producto/${product.slug}`}>{product.name}</Link></h3>
        <PriceDisplay className="product-price" value={product.price} mode={product.priceMode} />
        <div className="product-card-actions">
          <button type="button" className="product-detail-btn" onClick={() => onView(product)}>Ver detalles</button>
          <button type="button" className="quick-add" disabled={unavailable} onClick={() => onAdd(product)} aria-label={unavailable ? `${product.name} agotado` : `Agregar ${product.name} al carrito`}>+</button>
        </div>
      </div>
    </article>
  )
}
