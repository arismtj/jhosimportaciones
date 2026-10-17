import { useState } from 'react'
import { CartDrawer } from '../components/cart/CartDrawer'
import { CatalogSection, type CatalogFilter } from '../components/catalog/CatalogSection'
import { Benefits } from '../components/home/Benefits'
import { CategoryGrid } from '../components/home/CategoryGrid'
import { Hero } from '../components/home/Hero'
import { StorySections } from '../components/home/StorySections'
import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'

export function HomePage() {
  const [filter, setFilter] = useState<CatalogFilter>('todos')
  const [cartOpen, setCartOpen] = useState(false)

  return (
    <>
      <Header onOpenCart={() => setCartOpen(true)} />
      <main id="inicio">
        <Hero />
        <Benefits />
        <CategoryGrid onSelect={setFilter} />
        <CatalogSection filter={filter} onFilterChange={setFilter} onProductAdded={() => setCartOpen(true)} />
        <StorySections />
      </main>
      <Footer />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
