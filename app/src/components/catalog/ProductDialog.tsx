import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../../types/product'
import { PriceDisplay } from '../common/PriceDisplay'

interface ProductDialogProps {
  product: Product | null
  onClose: () => void
  onAdd: (product: Product, notes: string) => void
}

export function ProductDialog({ product, onClose, onAdd }: ProductDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const dialog = dialogRef.current
    if (product && dialog && !dialog.open) {
      setNotes('')
      dialog.showModal()
    }
    if (!product && dialog?.open) dialog.close()
  }, [product])

  if (!product) return <dialog ref={dialogRef} />
  const unavailable = product.availability === 'out_of_stock'

  return (
    <dialog
      ref={dialogRef}
      className="product-dialog"
      aria-labelledby="dialogTitle"
      onClose={onClose}
      onCancel={onClose}
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}
    >
      <div className="dialog-inner">
        <button className="close-button dialog-close" type="button" onClick={onClose} aria-label="Cerrar detalles">×</button>
        <div className={`dialog-visual tint-${product.tint}`}>
          {product.image ? <img src={product.image} alt={product.name} /> : <span aria-hidden="true">{product.emoji}</span>}
        </div>
        <div className="dialog-content">
          <div className="section-kicker">{product.familyName} · {product.categoryName}</div>
          <h2 id="dialogTitle">{product.name}</h2>
          <p>{product.description}</p>
          <PriceDisplay className="dialog-price" value={product.price} mode={product.priceMode} />
          <p className="price-confirmation">Precio sujeto a confirmación antes de realizar el pedido. <Link to={`/producto/${product.slug}`} onClick={onClose}>Ver ficha completa →</Link></p>
          <label className="notes-label" htmlFor="productNotes">Personalización o indicaciones <small>(opcional)</small></label>
          <textarea id="productNotes" rows={3} maxLength={250} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ej.: nombre, frase, color o dedicatoria..." />
          <button type="button" className="btn btn-primary dialog-add" disabled={unavailable} onClick={() => onAdd(product, notes)}>{unavailable ? 'Producto agotado' : 'Añadir al carrito'} <span aria-hidden="true">→</span></button>
        </div>
      </div>
    </dialog>
  )
}
