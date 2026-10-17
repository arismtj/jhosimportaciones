import type { Tables } from '../../types/database'
import { isSupabaseConfigured, requireSupabase } from './client'

export type MenuPage = Pick<Tables<'pages'>, 'id' | 'slug' | 'title' | 'menu_id' | 'sort_order'>
export type ContentPage = Tables<'pages'>

let cache: Promise<MenuPage[]> | null = null

/** Páginas publicadas para el menú de la tienda (se piden una sola vez). */
export function getMenuPages(force = false): Promise<MenuPage[]> {
  if (!isSupabaseConfigured) return Promise.resolve([])
  if (!cache || force) {
    cache = Promise.resolve(
      requireSupabase().from('pages').select('id, slug, title, menu_id, sort_order').eq('published', true).order('sort_order').order('title'),
    ).then(({ data, error }) => {
      if (error) throw error
      return data
    }).catch(() => {
      cache = null
      return []
    })
  }
  return cache
}

export function resetMenuPages() {
  cache = null
}

export async function getPageBySlug(slug: string): Promise<ContentPage | null> {
  const { data, error } = await requireSupabase().from('pages').select('*').eq('slug', slug).eq('published', true).maybeSingle()
  if (error) throw error
  return data
}

export function pageImageUrl(path: string) {
  return /^https?:\/\//.test(path) ? path : requireSupabase().storage.from('promo-media').getPublicUrl(path).data.publicUrl
}
