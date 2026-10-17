import { useState } from 'react'
import { CartDrawer } from '../components/cart/CartDrawer'
import { CatalogSection, type CatalogFilter } from '../components/catalog/CatalogSection'
import { Benefits } from '../components/home/Benefits'
import { CategoryGrid } from '../components/home/CategoryGrid'
import { Hero } from '../components/home/Hero'
import { StorySections } from '../components/home/StorySections'
import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { StoreNav } from '../components/layout/StoreNav'
import { StoreInfoSections } from '../components/store/StoreInfoSections'
import { content, storeJsonLd } from '../../shared/seo.mjs'
import { SITE_URL, useSeo } from '../seo/useSeo'

export function HomePage() {
  const [filter, setFilter] = useState<CatalogFilter>('todos')
  const [cartOpen, setCartOpen] = useState(false)
  useSeo({ title: content.home.title, description: content.home.description, path: '/', jsonLd: storeJsonLd(SITE_URL) })

  return (
    <>
      <Header onOpenCart={() => setCartOpen(true)} storeNav={<StoreNav filter={filter} onSelect={setFilter} />} />
      <main id="inicio">
        <Hero />
        <Benefits />
        <CategoryGrid onSelect={setFilter} />
        <CatalogSection filter={filter} onFilterChange={setFilter} onProductAdded={() => setCartOpen(true)} />
        <StoreInfoSections />
        <StorySections />
      </main>
      <Footer />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}
