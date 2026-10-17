import { createContext, useContext, useState, type ReactNode } from 'react'
import { CartDrawer } from '../cart/CartDrawer'
import { Footer } from './Footer'
import { Header } from './Header'
import { StoreNav } from './StoreNav'

const CartUiContext = createContext<{ openCart: () => void }>({ openCart: () => undefined })

export function useCartUi() {
  return useContext(CartUiContext)
}

/** Estructura común de las páginas de la tienda: encabezado, barra, pie y carrito. */
export function StoreLayout({ children, className }: { children: ReactNode; className?: string }) {
  const [cartOpen, setCartOpen] = useState(false)
  return (
    <CartUiContext.Provider value={{ openCart: () => setCartOpen(true) }}>
      <Header onOpenCart={() => setCartOpen(true)} storeNav={<StoreNav />} />
      <main className={className}>{children}</main>
      <Footer />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </CartUiContext.Provider>
  )
}
