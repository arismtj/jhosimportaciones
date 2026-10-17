export type CategoryId = 'sublimados' | 'romanticos' | 'peluches' | 'hogar'
export type ProductTint = 'peach' | 'pink' | 'sand' | 'lavender' | 'mint' | 'rose' | 'butter' | 'sky'
export type PriceMode = 'fixed' | 'from'

export interface Product {
  id: string
  name: string
  category: CategoryId
  price: number
  priceMode?: PriceMode
  priceMax?: number | null
  priceVerified?: boolean
  description: string
  emoji: string
  tint: ProductTint
  badge?: string
  image?: string
}

export interface CartItem {
  id: string
  notes: string
  quantity: number
}
