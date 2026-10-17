import type { Tables } from '../../types/database'
import { requireSupabase } from './client'

export type CatalogCategory = Pick<Tables<'categories'>, 'id' | 'parent_id' | 'slug' | 'name'>
export type CatalogImage = Pick<
  Tables<'product_images'>,
  'id' | 'storage_path' | 'source_url' | 'alt_text' | 'sort_order' | 'is_primary'
>
export type CatalogVariant = Pick<
  Tables<'product_variants'>,
  'id' | 'sku' | 'name' | 'options' | 'price_adjustment' | 'stock_quantity' | 'availability'
>

export type CatalogProduct = Tables<'products'> & {
  category: CatalogCategory
  images: CatalogImage[]
  variants: CatalogVariant[]
}

export interface CatalogFilters {
  categoryId?: string
  search?: string
  featured?: boolean
  limit?: number
  offset?: number
}

const catalogSelection = `
  *,
  category:categories!products_category_id_fkey(id, parent_id, slug, name),
  images:product_images(id, storage_path, source_url, alt_text, sort_order, is_primary),
  variants:product_variants(id, sku, name, options, price_adjustment, stock_quantity, availability)
`

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`)
}

export async function getCatalog(filters: CatalogFilters = {}): Promise<CatalogProduct[]> {
  const client = requireSupabase()
  const limit = Math.min(Math.max(filters.limit ?? 48, 1), 100)
  const offset = Math.max(filters.offset ?? 0, 0)

  let query = client
    .from('products')
    .select(catalogSelection)
    .eq('published', true)
    .order('featured', { ascending: false })
    .order('name', { ascending: true })
    .order('sort_order', { ascending: true, referencedTable: 'product_images' })
    .range(offset, offset + limit - 1)

  if (filters.categoryId) query = query.eq('category_id', filters.categoryId)
  if (filters.featured !== undefined) query = query.eq('featured', filters.featured)

  const normalizedSearch = filters.search?.trim()
  if (normalizedSearch) {
    query = query.ilike('name', `%${escapeLikePattern(normalizedSearch)}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data as unknown as CatalogProduct[]
}

export async function getProductBySlug(slug: string): Promise<CatalogProduct | null> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('products')
    .select(catalogSelection)
    .eq('slug', slug)
    .eq('published', true)
    .order('sort_order', { ascending: true, referencedTable: 'product_images' })
    .maybeSingle()

  if (error) throw error
  return data as unknown as CatalogProduct | null
}

export async function getCategories(): Promise<Tables<'categories'>[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('categories')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

export function getProductImageUrl(image: CatalogImage): string | null {
  if (image.storage_path) {
    return requireSupabase().storage.from('product-images').getPublicUrl(image.storage_path).data.publicUrl
  }

  return image.source_url
}
