import { formatPrice } from '../../utils/currency'

interface PriceDisplayProps {
  value: number
  mode?: 'fixed' | 'from'
  className?: string
}

export function PriceDisplay({ value, mode = 'fixed', className }: PriceDisplayProps) {
  return (
    <span className={className}>
      {mode === 'from' && <small className="price-prefix">Desde</small>}
      {mode === 'from' ? ' ' : ''}{formatPrice(value)}
    </span>
  )
}
