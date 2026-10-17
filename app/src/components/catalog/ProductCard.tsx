import { categoryLabels } from '../../data/products'
import type { Product } from '../../types/product'
import { PriceDisplay } from '../common/PriceDisplay'

interface ProductCardProps {
  product: Product
  onAdd: (product: Product) => void
  onView: (product: Product) => void
}

export function ProductCard({ product, onAdd, onView }: ProductCardProps) {
  return (
    <article className="product-card">
      <div className={`product-visual tint-${product.tint}`}>
        {product.badge && <span className="product-badge">{product.badge}</span>}
        {product.image ? <img src={product.image} alt={product.name} loading="lazy" /> : <span className="product-emoji" aria-hidden="true">{product.emoji}</span>}
      </div>
      <div className="product-info">
        <div className="product-category">{categoryLabels[product.category]}</div>
        <h3>{product.name}</h3>
        <PriceDisplay className="product-price" value={product.price} mode={product.priceMode} />
        <div className="product-card-actions">
          <button type="button" className="product-detail-btn" onClick={() => onView(product)}>Ver detalles</button>
          <button type="button" className="quick-add" onClick={() => onAdd(product)} aria-label={`Agregar ${product.name} al carrito`}>+</button>
        </div>
      </div>
    </article>
  )
}
