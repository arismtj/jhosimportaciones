import type { Tables } from '../../types/database'
import type { PriceMode, Product, ProductTint } from '../../types/product'
import { requireSupabase } from './client'

export type CatalogCategory = Pick<Tables<'categories'>, 'id' | 'parent_id' | 'slug' | 'name'> & { description?: string | null }
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
  categoryIds?: string[]
  search?: string
  sort?: 'featured' | 'priceAsc' | 'priceDesc' | 'name'
  page?: number
  pageSize?: number
}

export interface CatalogPage {
  products: Product[]
  total: number
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

const productTints: ProductTint[] = ['peach', 'pink', 'sand', 'lavender', 'mint', 'rose', 'butter', 'sky']

function tintForProduct(id: string): ProductTint {
  let hash = 0
  for (const character of id) hash = ((hash << 5) - hash + character.charCodeAt(0)) | 0
  return productTints[Math.abs(hash) % productTints.length]!
}

function badgeForAvailability(availability: CatalogProduct['availability']) {
  if (availability === 'out_of_stock') return 'Agotado'
  if (availability === 'made_to_order') return 'Bajo pedido'
  return undefined
}

export function sortedImages(product: Pick<CatalogProduct, 'images'>) {
  return [...product.images].sort((left, right) => {
    if (left.is_primary !== right.is_primary) return left.is_primary ? -1 : 1
    return left.sort_order - right.sort_order
  })
}

/** Convierte una fila de Supabase al modelo que usa la tienda. */
export function toProduct(product: CatalogProduct, categories: CatalogCategory[] = []): Product {
  const categoryMap = new Map(categories.map((category) => [category.id, category]))
  const family = product.category.parent_id ? categoryMap.get(product.category.parent_id) : product.category
  const primaryImage = sortedImages(product)[0]

  return {
    id: product.id,
    externalId: product.external_id,
    slug: product.slug,
    name: product.name,
    categoryId: product.category.id,
    categorySlug: product.category.slug,
    categoryName: product.category.name,
    familySlug: family?.slug ?? product.category.slug,
    familyName: family?.name ?? product.category.name,
    price: Number(product.price),
    priceMode: product.price_mode as PriceMode,
    priceMax: product.price_max === null ? null : Number(product.price_max),
    priceVerified: product.price_verified,
    availability: product.availability,
    description: product.description,
    emoji: '🎁',
    tint: tintForProduct(product.id),
    badge: badgeForAvailability(product.availability),
    image: primaryImage ? getProductImageUrl(primaryImage) ?? undefined : undefined,
  }
}

export async function getCatalog(
  filters: CatalogFilters = {},
  categories: CatalogCategory[] = [],
): Promise<CatalogPage> {
  const client = requireSupabase()
  const pageSize = Math.min(Math.max(filters.pageSize ?? 24, 1), 48)
  const page = Math.max(filters.page ?? 1, 1)
  const offset = (page - 1) * pageSize

  let query = client
    .from('products')
    .select(catalogSelection, { count: 'exact' })
    .eq('published', true)
    .order('sort_order', { ascending: true, referencedTable: 'product_images' })
    .range(offset, offset + pageSize - 1)

  if (filters.categoryIds?.length) query = query.in('category_id', filters.categoryIds)

  const normalizedSearch = filters.search?.trim()
  if (normalizedSearch) {
    const pattern = `%${escapeLikePattern(normalizedSearch)}%`
    query = query.or(`name.ilike.${pattern},description.ilike.${pattern}`)
  }

  if (filters.sort === 'priceAsc') query = query.order('price', { ascending: true }).order('name')
  else if (filters.sort === 'priceDesc') query = query.order('price', { ascending: false }).order('name')
  else if (filters.sort === 'name') query = query.order('name', { ascending: true })
  else query = query.order('featured', { ascending: false }).order('name', { ascending: true })

  const { data, error, count } = await query
  if (error) throw error

  const products = (data as unknown as CatalogProduct[]).map((product) => toProduct(product, categories))

  return { products, total: count ?? 0 }
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

export interface ProductPageData {
  product: Product
  images: string[]
  related: Product[]
}

export async function getProductPage(slug: string, categories: CatalogCategory[]): Promise<ProductPageData | null> {
  const row = await getProductBySlug(slug)
  if (!row) return null
  const images = sortedImages(row).map((image) => getProductImageUrl(image)).filter((url): url is string => Boolean(url))
  const related = await getCatalog({ categoryIds: [row.category.id], pageSize: 9 }, categories)
  return {
    product: toProduct(row, categories),
    images,
    related: related.products.filter((item) => item.id !== row.id).slice(0, 8),
  }
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
