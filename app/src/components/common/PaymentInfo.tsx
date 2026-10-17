import { useState } from 'react'
import type { PaymentMethod } from '../../config/checkout'

export function PaymentInfo({ method }: { method: PaymentMethod }) {
  const [copied, setCopied] = useState('')
  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(value)
      window.setTimeout(() => setCopied(''), 1800)
    } catch {
      setCopied('')
    }
  }
  return (
    <div className="payment-info">
      <span className={`pay-logo pay-${method.id}`}>{method.id === 'transfer' ? 'Transferencia' : method.label}</span>
      {method.phone && <div className="payment-row"><span>Número de cobro</span><strong>{method.phone}</strong><button type="button" className="copy-chip" onClick={() => void copy(method.phone!)}>{copied === method.phone ? 'Copiado' : 'Copiar'}</button></div>}
      <div className="payment-row"><span>Titular</span><strong>{method.holder}</strong></div>
      {method.bank && <div className="payment-row"><span>Banco</span><strong>{method.bank}</strong></div>}
      {method.account && <div className="payment-row"><span>Cuenta / CCI</span><strong>{method.account}</strong><button type="button" className="copy-chip" onClick={() => void copy(method.account!)}>{copied === method.account ? 'Copiado' : 'Copiar'}</button></div>}
      <p>{method.instructions}</p>
    </div>
  )
}
