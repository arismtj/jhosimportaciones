import { useEffect, useRef, useState } from 'react'
import { products } from '../../data/products'
import { useCart } from '../../features/cart/CartContext'
import { formatPrice } from '../../utils/currency'
import { PriceDisplay } from '../common/PriceDisplay'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, count, subtotal, hasPriceRange, increase, decrease, remove } = useCart()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    document.body.classList.toggle('drawer-open', open)
    if (open) closeButtonRef.current?.focus()
    return () => document.body.classList.remove('drawer-open')
  }, [open])

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && open) onClose() }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose, open])

  const prepareOrder = async () => {
    const lines = ['¡Hola! Quiero consultar un pedido en JHOS Importaciones:', '']
    items.forEach((item, index) => {
      const product = products.find((candidate) => candidate.id === item.id)
      if (!product) return
      lines.push(`${index + 1}. ${product.name} — ${item.quantity} x ${formatPrice(product.price)} = ${formatPrice(product.price * item.quantity)}`)
      if (item.notes) lines.push(`   Personalización: ${item.notes}`)
    })
    lines.push('', `${hasPriceRange ? 'Subtotal desde' : 'Subtotal estimado'}: ${formatPrice(subtotal)}`, 'Por favor, confirmen precio final, disponibilidad, entrega y forma de pago.')
    const message = lines.join('\n')
    const phone = (import.meta.env.VITE_WHATSAPP_NUMBER ?? '').replace(/\D/g, '')
    if (/^\d{10,15}$/.test(phone)) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
      setNotice('Se abrió WhatsApp. Revisa tu pedido antes de enviarlo.')
      return
    }
    try {
      await navigator.clipboard.writeText(message)
      setNotice('Pedido copiado. Puedes enviarlo a JHOS Importaciones como invitado.')
    } catch {
      setNotice('Configura el número comercial para habilitar el envío por WhatsApp.')
    }
  }

  if (!open) return null

  return (
    <>
      <button className="overlay show" type="button" onClick={onClose} aria-label="Cerrar carrito" />
      <aside className="cart-drawer open" role="dialog" aria-modal="true" aria-labelledby="cartTitle" aria-hidden="false">
        <div className="drawer-header"><div><span className="section-kicker">TU SELECCIÓN</span><h2 id="cartTitle">Mi carrito <span>({count})</span></h2></div><button ref={closeButtonRef} type="button" className="close-button" onClick={onClose} aria-label="Cerrar carrito">×</button></div>
        <div className="drawer-body">
          {!items.length ? <div className="cart-empty"><div>🛍️</div><strong>Tu carrito está esperando</strong><p>Agrega tus detalles favoritos para comenzar tu pedido.</p></div> : items.map((item, index) => {
            const product = products.find((candidate) => candidate.id === item.id)
            if (!product) return null
            return <div className="cart-item" key={`${item.id}-${item.notes}`}><div className={`cart-item-thumb tint-${product.tint}`}><span aria-hidden="true">{product.emoji}</span></div><div className="cart-item-main"><strong>{product.name}</strong>{item.notes && <small>Nota: {item.notes}</small>}<div className="quantity"><button type="button" onClick={() => decrease(index)} aria-label="Quitar una unidad">−</button><span>{item.quantity}</span><button type="button" onClick={() => increase(index)} aria-label="Añadir una unidad">+</button><button type="button" className="item-remove" onClick={() => remove(index)}>Eliminar</button></div></div><PriceDisplay className="cart-item-price" value={product.price * item.quantity} mode={product.priceMode} /></div>
          })}
        </div>
        <div className="drawer-footer"><div className="cart-subtotal"><span>Subtotal estimado</span><PriceDisplay className="cart-subtotal-price" value={subtotal} mode={hasPriceRange ? 'from' : 'fixed'} /></div><p className="cart-notice">Los precios están sujetos a confirmación. Confirma el monto final y la disponibilidad antes de pagar.</p><button type="button" className="btn btn-primary cart-checkout" disabled={!items.length} onClick={() => void prepareOrder()}>Preparar pedido <span aria-hidden="true">→</span></button><small>La compra como invitado está habilitada; no necesitas iniciar sesión.</small>{notice && <p className="checkout-feedback" role="status">{notice}</p>}</div>
      </aside>
    </>
  )
}
