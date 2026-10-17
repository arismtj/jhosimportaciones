import { activePromotions, todayInPeru, type Promotion } from '../../config/promotions'
import { isSupabaseConfigured } from './client'
import { listAdminPromotions, promoMediaUrl } from './admin'

/** Promociones vigentes desde la base de datos; si falla, usa las del archivo de configuración. */
export async function getActivePromotions(): Promise<Promotion[]> {
  if (!isSupabaseConfigured) return activePromotions()
  try {
    const today = todayInPeru()
    const rows = await listAdminPromotions()
    return rows
      .filter((row) => row.active && row.starts_on <= today && today <= row.ends_on)
      .map((row) => ({ id: row.id, title: row.title, text: row.body, media: promoMediaUrl(row.media_url) || undefined, mediaType: row.media_type ?? undefined, start: row.starts_on, end: row.ends_on }))
  } catch {
    return activePromotions()
  }
}
