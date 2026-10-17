import type { Database } from '../../types/database'
import { requireSupabase } from './client'

type ProductRow = Database['public']['Tables']['products']['Row']
export type PromotionRow = Database['public']['Tables']['promotions']['Row']

export interface AdminImage {
  id?: string
  storage_path: string | null
  source_url: string | null
  /** Foto nueva aún no subida */
  file?: File
  preview: string
}

export type AdminProduct = Pick<ProductRow,
  'id' | 'slug' | 'name' | 'description' | 'price' | 'price_mode' | 'price_max' | 'availability' |
  'published' | 'featured' | 'price_verified' | 'customizable' | 'category_id' | 'updated_at'
> & { images: Array<{ id: string; storage_path: string | null; source_url: string | null; sort_order: number; is_primary: boolean }> }

export interface ProductDraft {
  id?: string
  slug?: string
  name: string
  description: string
  category_id: string
  price: number
  price_mode: 'fixed' | 'from'
  price_max: number | null
  availability: 'in_stock' | 'out_of_stock' | 'made_to_order'
  published: boolean
  featured: boolean
  price_verified: boolean
  customizable: boolean
}

const PRODUCT_BUCKET = 'product-images'
const PROMO_BUCKET = 'promo-media'

export function publicUrl(bucket: string, path: string) {
  return requireSupabase().storage.from(bucket).getPublicUrl(path).data.publicUrl
}

export function imageUrl(image: { storage_path: string | null; source_url: string | null }) {
  if (image.storage_path) return publicUrl(PRODUCT_BUCKET, image.storage_path)
  return image.source_url ?? ''
}

function slugify(value: string) {
  const base = value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'producto'
  return `${base}-${Math.random().toString(36).slice(2, 8)}`
}

function friendly(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : typeof error === 'object' && error && 'message' in error ? String((error as { message: unknown }).message) : ''
  if (/row-level security|permission denied|42501/i.test(message)) return 'Tu cuenta no tiene permiso para hacer esto.'
  if (/mime|type/i.test(message) && /not supported|invalid/i.test(message)) return 'Ese tipo de archivo no está permitido. Usa JPG, PNG o MP4.'
  if (/exceeded|too large|size/i.test(message)) return 'El archivo es demasiado pesado.'
  return message ? `${fallback} (${message})` : fallback
}

export async function listAdminProducts(): Promise<AdminProduct[]> {
  const { data, error } = await requireSupabase()
    .from('products')
    .select('id, slug, name, description, price, price_mode, price_max, availability, published, featured, price_verified, customizable, category_id, updated_at, images:product_images(id, storage_path, source_url, sort_order, is_primary)')
    .order('updated_at', { ascending: false })
    .limit(2000)
  if (error) throw new Error(friendly(error, 'No pudimos cargar los productos.'))
  return data as unknown as AdminProduct[]
}

async function uploadFile(bucket: string, folder: string, file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`
  const { error } = await requireSupabase().storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false, cacheControl: '31536000' })
  if (error) throw new Error(friendly(error, 'No pudimos subir el archivo.'))
  return path
}

/** Guarda el producto y sus fotos (la primera foto es la principal). */
export async function saveProduct(draft: ProductDraft, images: AdminImage[], removed: AdminImage[]) {
  const client = requireSupabase()
  const values = {
    name: draft.name.trim(),
    description: draft.description.trim(),
    category_id: draft.category_id,
    price: draft.price,
    price_mode: draft.price_mode,
    price_max: draft.price_mode === 'from' ? draft.price_max : null,
    availability: draft.availability,
    published: draft.published,
    featured: draft.featured,
    price_verified: draft.price_verified,
    customizable: draft.customizable,
  }

  let id = draft.id
  if (id) {
    const { error } = await client.from('products').update(values).eq('id', id)
    if (error) throw new Error(friendly(error, 'No pudimos guardar el producto.'))
  } else {
    const { data, error } = await client.from('products').insert({ ...values, slug: slugify(values.name) }).select('id').single()
    if (error) throw new Error(friendly(error, 'No pudimos crear el producto.'))
    id = data.id
  }

  const finalImages: Array<{ storage_path: string | null; source_url: string | null }> = []
  for (const image of images) {
    if (image.file) finalImages.push({ storage_path: await uploadFile(PRODUCT_BUCKET, `catalog/${id}`, image.file), source_url: null })
    else finalImages.push({ storage_path: image.storage_path, source_url: image.source_url })
  }

  const { error: deleteError } = await client.from('product_images').delete().eq('product_id', id!)
  if (deleteError) throw new Error(friendly(deleteError, 'No pudimos actualizar las fotos.'))
  if (finalImages.length) {
    const { error: insertError } = await client.from('product_images').insert(finalImages.map((image, index) => ({
      product_id: id!,
      storage_path: image.storage_path,
      source_url: image.source_url,
      alt_text: values.name.slice(0, 240),
      sort_order: index,
      is_primary: index === 0,
    })))
    if (insertError) throw new Error(friendly(insertError, 'No pudimos guardar las fotos.'))
  }

  const orphaned = removed.map((image) => image.storage_path).filter((path): path is string => Boolean(path))
  if (orphaned.length) await client.storage.from(PRODUCT_BUCKET).remove(orphaned)
  return id!
}

export async function setProductField(id: string, values: Partial<Pick<ProductRow, 'published' | 'availability' | 'featured'>>) {
  const { error } = await requireSupabase().from('products').update(values).eq('id', id)
  if (error) throw new Error(friendly(error, 'No pudimos actualizar el producto.'))
}

export async function deleteProduct(product: AdminProduct) {
  const client = requireSupabase()
  const { error } = await client.from('products').delete().eq('id', product.id)
  if (error) throw new Error(friendly(error, 'No pudimos eliminar el producto.'))
  const paths = product.images.map((image) => image.storage_path).filter((path): path is string => Boolean(path))
  if (paths.length) await client.storage.from(PRODUCT_BUCKET).remove(paths)
}

// ---------- Promociones ----------
export function promoMediaUrl(value: string | null) {
  if (!value) return ''
  return /^https?:\/\//.test(value) ? value : publicUrl(PROMO_BUCKET, value)
}

export async function listAdminPromotions(): Promise<PromotionRow[]> {
  const { data, error } = await requireSupabase().from('promotions').select('*').order('sort_order').order('created_at', { ascending: false })
  if (error) throw new Error(friendly(error, 'No pudimos cargar las promociones.'))
  return data
}

export async function savePromotion(promotion: Partial<PromotionRow> & { title: string; ends_on: string }, file?: File | null) {
  const client = requireSupabase()
  const values: Database['public']['Tables']['promotions']['Insert'] = {
    title: promotion.title.trim(),
    body: (promotion.body ?? '').trim(),
    starts_on: promotion.starts_on,
    ends_on: promotion.ends_on,
    active: promotion.active ?? true,
    sort_order: promotion.sort_order ?? 0,
    media_url: promotion.media_url ?? null,
    media_type: promotion.media_type ?? null,
  }
  if (file) {
    values.media_url = await uploadFile(PROMO_BUCKET, 'promos', file)
    values.media_type = file.type.startsWith('video/') ? 'video' : 'image'
  }
  const query = promotion.id
    ? client.from('promotions').update(values).eq('id', promotion.id)
    : client.from('promotions').insert(values)
  const { error } = await query
  if (error) throw new Error(friendly(error, 'No pudimos guardar la promoción.'))
}

export async function deletePromotion(promotion: PromotionRow) {
  const client = requireSupabase()
  const { error } = await client.from('promotions').delete().eq('id', promotion.id)
  if (error) throw new Error(friendly(error, 'No pudimos eliminar la promoción.'))
  if (promotion.media_url && !/^https?:/.test(promotion.media_url)) await client.storage.from(PROMO_BUCKET).remove([promotion.media_url])
}

// ---------- Equipo ----------
export async function listAdmins() {
  const { data, error } = await requireSupabase().rpc('list_admins')
  if (error) throw new Error(friendly(error, 'No pudimos cargar el equipo.'))
  return data
}

export async function grantAdmin(email: string) {
  const { error } = await requireSupabase().rpc('grant_admin', { p_email: email })
  if (error) throw new Error(friendly(error, 'No pudimos dar acceso.'))
}

export async function revokeAdmin(email: string) {
  const { error } = await requireSupabase().rpc('revoke_admin', { p_email: email })
  if (error) throw new Error(friendly(error, 'No pudimos quitar el acceso.'))
}
