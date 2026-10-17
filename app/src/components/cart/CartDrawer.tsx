import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  advisors,
  checkoutNotes,
  deliveryOptions,
  paymentMethods,
  type DeliveryOption,
  type PaymentMethod,
  type PaymentMethodId,
} from '../../config/checkout'
import { useCart } from '../../features/cart/CartContext'
import type { CartItem } from '../../types/product'
import { formatPrice } from '../../utils/currency'
import { trackEvent } from '../../services/analytics'
import { PaymentInfo } from '../common/PaymentInfo'
import { PriceDisplay } from '../common/PriceDisplay'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
}

type Stage = 1 | 2 | 3

interface CheckoutForm {
  name: string
  phone: string
  delivery: DeliveryOption
  location: string
  details: string
  payment: PaymentMethodId
}

const emptyForm: CheckoutForm = {
  name: '',
  phone: '',
  delivery: 'shipping',
  location: '',
  details: '',
  payment: 'yape',
}

const stages: Array<{ id: Stage; label: string }> = [
  { id: 1, label: '1. Carrito' },
  { id: 2, label: '2. Entrega y pago' },
  { id: 3, label: '3. Confirmar' },
]

function validate(form: CheckoutForm) {
  const errors: Partial<Record<keyof CheckoutForm, string>> = {}
  const name = form.name.trim()
  if (name.length < 2) errors.name = 'Escribe tu nombre y apellido.'
  else if (name.length > 120) errors.name = 'El nombre es demasiado largo.'
  const digits = form.phone.replace(/\D/g, '')
  if (digits.length < 9 || digits.length > 15) errors.phone = 'Escribe un número de contacto válido (9 dígitos).'
  if (form.delivery === 'shipping' && form.location.trim().length < 3) errors.location = 'Indica tu distrito o provincia.'
  return errors
}

function buildMessage(items: CartItem[], subtotal: number, hasPriceRange: boolean, form: CheckoutForm, method: PaymentMethod) {
  const delivery = deliveryOptions.find((option) => option.id === form.delivery)?.label ?? ''
  const lines = ['¡Hola! Quiero hacer un pedido en JHOS Importaciones:', '']
  items.forEach((item, index) => {
    const { product } = item
    const prefix = product.priceMode === 'from' ? 'desde ' : ''
    lines.push(`${index + 1}. ${product.name} × ${item.quantity} — ${prefix}${formatPrice(product.price * item.quantity)}`)
    if (item.notes) lines.push(`   Personalización: ${item.notes}`)
  })
  lines.push(
    '',
    `Subtotal referencial: ${hasPriceRange ? 'desde ' : ''}${formatPrice(subtotal)} · envío por confirmar`,
    '',
    `Nombre: ${form.name.trim()}`,
    `Contacto: ${form.phone.trim()}`,
    `Entrega: ${delivery}${form.delivery === 'shipping' ? ` — ${form.location.trim()}` : ''}`,
    `Pago: ${method.label}`,
  )
  if (form.details.trim()) lines.push(`Detalles: ${form.details.trim()}`)
  lines.push('', 'Por favor, confírmenme el precio final, la disponibilidad y la entrega.')
  return lines.join('\n')
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, count, subtotal, hasPriceRange, increase, decrease, remove, clear } = useCart()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState<Stage>(1)
  const [form, setForm] = useState<CheckoutForm>(emptyForm)
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutForm, string>>>({})
  const [sentTo, setSentTo] = useState('')

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

  useEffect(() => {
    if (!items.length) setStage(1)
  }, [items.length])

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 })
  }, [stage])

  const update = <K extends keyof CheckoutForm>(field: K, value: CheckoutForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const goToStage = (next: Stage) => {
    if (next > 1 && !items.length) return
    if (next === 3) {
      const found = validate(form)
      setErrors(found)
      if (Object.keys(found).length) {
        setStage(2)
        return
      }
    }
    setSentTo('')
    if (next === 2 && stage === 1) trackEvent('begin_checkout', { value: subtotal, currency: 'PEN' })
    setStage(next)
  }

  const submitDetails = (event: FormEvent) => {
    event.preventDefault()
    goToStage(3)
  }

  const method = paymentMethods.find((candidate) => candidate.id === form.payment) ?? paymentMethods[0]!
  const message = buildMessage(items, subtotal, hasPriceRange, form, method)

  const finish = () => {
    clear()
    setForm((current) => ({ ...emptyForm, name: current.name, phone: current.phone }))
    setSentTo('')
    setStage(1)
    onClose()
  }

  if (!open) return null

  return (
    <>
      <button className="overlay show" type="button" onClick={onClose} aria-label="Cerrar carrito" />
      <aside className="cart-drawer open" role="dialog" aria-modal="true" aria-labelledby="cartTitle" aria-hidden="false">
        <div className="drawer-header"><div><span className="section-kicker">TU SELECCIÓN</span><h2 id="cartTitle">Mi carrito <span>({count})</span></h2></div><button ref={closeButtonRef} type="button" className="close-button" onClick={onClose} aria-label="Cerrar carrito">×</button></div>
        {items.length > 0 && (
          <nav className="checkout-steps" aria-label="Pasos del pedido">
            {stages.map((step) => (
              <button type="button" key={step.id} className={stage === step.id ? 'active' : ''} aria-current={stage === step.id ? 'step' : undefined} onClick={() => goToStage(step.id)}>{step.label}</button>
            ))}
          </nav>
        )}

        <div className="drawer-body" ref={bodyRef}>
          {stage === 1 && (!items.length ? <div className="cart-empty"><div>🛍️</div><strong>Tu carrito está esperando</strong><p>Agrega tus detalles favoritos para comenzar tu pedido.</p></div> : items.map((item, index) => {
            const product = item.product
            return <div className="cart-item" key={`${product.id}-${item.notes}`}><div className={`cart-item-thumb tint-${product.tint}`}>{product.image ? <img src={product.image} alt="" /> : <span aria-hidden="true">{product.emoji}</span>}</div><div className="cart-item-main"><strong>{product.name}</strong>{item.notes && <small>Nota: {item.notes}</small>}<div className="quantity"><button type="button" onClick={() => decrease(index)} aria-label="Quitar una unidad">−</button><span>{item.quantity}</span><button type="button" onClick={() => increase(index)} aria-label="Añadir una unidad">+</button><button type="button" className="item-remove" onClick={() => remove(index)}>Eliminar</button></div></div><PriceDisplay className="cart-item-price" value={product.price * item.quantity} mode={product.priceMode} /></div>
          }))}

          {stage === 2 && (
            <form id="checkoutForm" className="checkout-form" onSubmit={submitDetails} noValidate>
              <label className="field">
                <span>Tu nombre <em aria-hidden="true">*</em></span>
                <input value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="Nombre y apellido" autoComplete="name" maxLength={120} aria-invalid={Boolean(errors.name)} required />
                {errors.name && <small className="field-error">{errors.name}</small>}
              </label>
              <label className="field">
                <span>Número de contacto <em aria-hidden="true">*</em></span>
                <input value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="Ej. 987654321" inputMode="tel" autoComplete="tel" maxLength={20} aria-invalid={Boolean(errors.phone)} required />
                {errors.phone && <small className="field-error">{errors.phone}</small>}
              </label>
              <label className="field">
                <span>¿Cómo quieres recibirlo?</span>
                <select value={form.delivery} onChange={(event) => update('delivery', event.target.value as DeliveryOption)}>
                  {deliveryOptions.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}
                </select>
              </label>
              {form.delivery === 'shipping' ? (
                <label className="field">
                  <span>Distrito o provincia <em aria-hidden="true">*</em></span>
                  <input value={form.location} onChange={(event) => update('location', event.target.value)} placeholder="Ej. Chorrillos, Lima" autoComplete="address-level2" maxLength={120} aria-invalid={Boolean(errors.location)} required />
                  {errors.location ? <small className="field-error">{errors.location}</small> : <small className="field-hint">La dirección exacta o agencia se coordina por WhatsApp. {checkoutNotes.shipping}</small>}
                </label>
              ) : (
                <p className="field-hint pickup-note">Punto de recojo: {checkoutNotes.pickup} El día y la hora se coordinan por WhatsApp.</p>
              )}
              <label className="field">
                <span>Personalización y detalles</span>
                <textarea value={form.details} onChange={(event) => update('details', event.target.value)} rows={3} maxLength={500} placeholder="Nombres, colores, talla, modelo o idea para tu regalo…" />
                <small className="field-hint">{checkoutNotes.preparation}</small>
              </label>
              <fieldset className="payment-choices">
                <legend>¿Cómo prefieres pagar?</legend>
                {paymentMethods.map((option) => (
                  <label className={`payment-choice${form.payment === option.id ? ' selected' : ''}`} key={option.id}>
                    <input type="radio" name="payment" value={option.id} checked={form.payment === option.id} onChange={() => update('payment', option.id)} />
                    <span>{option.label}</span>
                  </label>
                ))}
              </fieldset>
            </form>
          )}

          {stage === 3 && (
            <div className="checkout-review">
              <span className="review-badge">Listo para consultar</span>
              <h3>Revisa y confirma con tu asesor.</h3>
              <div className="review-lines">
                {items.map((item) => (
                  <div className="review-line" key={`${item.product.id}-${item.notes}`}>
                    <span>{item.product.name} × {item.quantity}{item.notes && <small>Nota: {item.notes}</small>}</span>
                    <PriceDisplay value={item.product.price * item.quantity} mode={item.product.priceMode} />
                  </div>
                ))}
              </div>
              <p className="review-total">Subtotal referencial: {hasPriceRange ? 'desde ' : ''}{formatPrice(subtotal)} · envío por confirmar</p>
              <dl className="review-customer">
                <div><dt>Nombre</dt><dd>{form.name.trim()}</dd></div>
                <div><dt>Contacto</dt><dd>{form.phone.trim()}</dd></div>
                <div><dt>Entrega</dt><dd>{form.delivery === 'shipping' ? `Envío · ${form.location.trim()}` : 'Recojo en Chorrillos'}</dd></div>
              </dl>
              <PaymentInfo method={method} />
              <p className="review-notice">Tu pedido quedará confirmado cuando el asesor valide disponibilidad, importe final y entrega. El comprobante se revisa por WhatsApp.</p>
            </div>
          )}
        </div>

        <div className="drawer-footer">
          {stage === 1 && (
            <>
              <div className="cart-subtotal"><span>Subtotal estimado</span><PriceDisplay className="cart-subtotal-price" value={subtotal} mode={hasPriceRange ? 'from' : 'fixed'} /></div>
              <p className="cart-notice">Los precios están sujetos a confirmación. Confirma el monto final y la disponibilidad antes de pagar.</p>
              <button type="button" className="btn btn-primary cart-checkout" disabled={!items.length} onClick={() => goToStage(2)}>Preparar pedido <span aria-hidden="true">→</span></button>
              <small>La compra como invitado está habilitada; no necesitas iniciar sesión.</small>
            </>
          )}
          {stage === 2 && (
            <div className="checkout-actions">
              <button type="button" className="btn btn-outline" onClick={() => goToStage(1)}>← Volver</button>
              <button type="submit" form="checkoutForm" className="btn btn-primary">Revisar pedido <span aria-hidden="true">→</span></button>
            </div>
          )}
          {stage === 3 && (
            <>
              <div className="whatsapp-actions">
                {advisors.map((advisor, index) => (
                  <a key={advisor.whatsapp} className={`btn btn-whatsapp${index ? ' alt' : ''}`} href={`https://wa.me/${advisor.whatsapp}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" onClick={() => { setSentTo(advisor.label); trackEvent('generate_lead', { value: subtotal, currency: 'PEN', advisor: advisor.label }) }}>Continuar en WhatsApp · {advisor.label} <span aria-hidden="true">↗</span></a>
                ))}
              </div>
              <p className="whatsapp-hint">Se abrirá WhatsApp con tu pedido ya escrito. <strong>Toca «Enviar» en WhatsApp</strong> para que el asesor lo reciba. Elige solo uno de los dos asesores.</p>
              {sentTo ? (
                <p className="checkout-feedback" role="status">Abrimos WhatsApp con tu pedido para el {sentTo}. ¿Ya tocaste «Enviar» en WhatsApp? Si es así, <button type="button" className="link-button" onClick={finish}>vacía el carrito y termina</button>.</p>
              ) : (
                <button type="button" className="link-button edit-order" onClick={() => goToStage(2)}>← Editar datos</button>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  )
}
