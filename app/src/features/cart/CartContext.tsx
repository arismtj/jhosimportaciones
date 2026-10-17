import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CartItem, Product } from '../../types/product'

const STORAGE_KEY = 'jhos_cart_v3'

interface CartContextValue {
  items: CartItem[]
  count: number
  subtotal: number
  hasPriceRange: boolean
  addItem: (product: Product, notes?: string) => void
  increase: (index: number) => void
  decrease: (index: number) => void
  remove: (index: number) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function restoreCart(): CartItem[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(stored)) return []
    return stored
      .filter((item): item is CartItem => {
        if (!item || typeof item !== 'object') return false
        const candidate = item as Partial<CartItem>
        return Boolean(
          candidate.product &&
            typeof candidate.product === 'object' &&
            typeof candidate.product.id === 'string' &&
            typeof candidate.product.name === 'string' &&
            Number.isFinite(candidate.product.price) &&
            typeof candidate.notes === 'string' &&
            Number.isInteger(candidate.quantity) &&
            Number(candidate.quantity) > 0 &&
            Number(candidate.quantity) <= 99,
        )
      })
      .slice(0, 100)
      .map((item) => ({ ...item, notes: item.notes.slice(0, 250) }))
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(restoreCart)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((total, item) => total + item.quantity, 0)
    const subtotal = items.reduce((total, item) => total + item.product.price * item.quantity, 0)
    const hasPriceRange = items.some((item) => item.product.priceMode === 'from')

    return {
      items,
      count,
      subtotal,
      hasPriceRange,
      addItem: (product, notes = '') => {
        const normalizedNotes = notes.trim().slice(0, 250)
        if (product.availability === 'out_of_stock') return
        setItems((current) => {
          const index = current.findIndex((item) => item.product.id === product.id && item.notes === normalizedNotes)
          if (index < 0) return [...current, { product, notes: normalizedNotes, quantity: 1 }]
          return current.map((item, itemIndex) =>
            itemIndex === index ? { ...item, quantity: Math.min(99, item.quantity + 1) } : item,
          )
        })
      },
      increase: (index) =>
        setItems((current) =>
          current.map((item, itemIndex) =>
            itemIndex === index ? { ...item, quantity: Math.min(99, item.quantity + 1) } : item,
          ),
        ),
      decrease: (index) =>
        setItems((current) =>
          current.flatMap((item, itemIndex) => {
            if (itemIndex !== index) return [item]
            return item.quantity > 1 ? [{ ...item, quantity: item.quantity - 1 }] : []
          }),
        ),
      remove: (index) => setItems((current) => current.filter((_item, itemIndex) => itemIndex !== index)),
      clear: () => setItems([]),
    }
  }, [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart debe usarse dentro de CartProvider')
  return context
}
