export type ProductTint = 'peach' | 'pink' | 'sand' | 'lavender' | 'mint' | 'rose' | 'butter' | 'sky'
export type PriceMode = 'fixed' | 'from'
export type ProductAvailability = 'in_stock' | 'out_of_stock' | 'made_to_order'

export interface Product {
  id: string
  externalId: string | null
  slug: string
  name: string
  categoryId: string
  categorySlug: string
  categoryName: string
  familySlug: string
  familyName: string
  price: number
  priceMode?: PriceMode
  priceMax?: number | null
  priceVerified?: boolean
  availability: ProductAvailability
  description: string
  emoji: string
  tint: ProductTint
  badge?: string
  image?: string
}

export interface CartItem {
  product: Product
  notes: string
  quantity: number
}
