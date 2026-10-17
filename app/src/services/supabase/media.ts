import { requireSupabase } from './client'

/** URL pública de un archivo del bucket promo-media (o la URL tal cual si ya es completa). */
export function promoMediaPublicUrl(path: string) {
  return /^https?:\/\//.test(path) ? path : requireSupabase().storage.from('promo-media').getPublicUrl(path).data.publicUrl
}
