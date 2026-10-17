export interface SeoProduct {
  slug: string
  name: string
  description: string
  price: number
  priceMode?: 'fixed' | 'from'
  priceMax?: number | null
  availability: 'in_stock' | 'out_of_stock' | 'made_to_order'
  image?: string
  externalId?: string | null
  categoryName: string
  familyName: string
}

export interface SiteInfo {
  name: string
  url: string
  locale: string
  legalName: string
  ruc: string
  email: string
  telephone: string
  phones: string[]
  address: { streetAddress: string; addressLocality: string; addressRegion: string; addressCountry: string }
  logo: string
  ogImage: string
  sameAs: string[]
}

export interface SeoText { title: string; description: string; h1?: string; intro?: string[] }

export const site: SiteInfo
export const content: {
  home: SeoText
  pages: Record<string, SeoText>
  categories: Record<string, SeoText>
}
export type JsonLd = Record<string, unknown>
export function absoluteUrl(path?: string, base?: string): string
export function clip(text: string, max: number): string
export function productPath(slug: string): string
export function categoryPath(slug: string): string
export function productTitle(product: SeoProduct): string
export function productDescription(product: SeoProduct): string
export function formatSoles(value: number): string
export function storeJsonLd(base?: string): JsonLd[]
export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>, base?: string): JsonLd
export function productJsonLd(product: SeoProduct, images?: string[], base?: string): JsonLd
export function collectionJsonLd(input: { name: string; description: string; path: string; products: Array<{ slug: string; name: string }> }, base?: string): JsonLd
