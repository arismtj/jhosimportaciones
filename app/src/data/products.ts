import type { CategoryId, Product } from '../types/product'

export const categoryLabels: Record<CategoryId, string> = {
  sublimados: 'Detalles sublimados',
  romanticos: 'Detalles románticos',
  peluches: 'Peluches',
  hogar: 'Hogar y utensilios',
}

export const products: Product[] = [
  { id: 'taza-personalizada', name: 'Taza personalizada', category: 'sublimados', price: 29.9, description: 'Un detalle con nombre, fotografía o dedicatoria para regalar un recuerdo especial.', emoji: '☕', tint: 'peach', badge: 'Personalizable' },
  { id: 'box-romantico', name: 'Box sorpresa romántico', category: 'romanticos', price: 79.9, description: 'Una sorpresa pensada para expresar cariño en cumpleaños, aniversarios y fechas especiales.', emoji: '💝', tint: 'pink', badge: 'Para regalar' },
  { id: 'oso-peluche', name: 'Osito de peluche', category: 'peluches', price: 59.9, description: 'Un abrazo muy suave para sorprender a alguien especial.', emoji: '🧸', tint: 'sand', badge: 'Favorito' },
  { id: 'termo-sublimado', name: 'Termo personalizado', category: 'sublimados', price: 49.9, description: 'Un termo con un diseño especial, ideal como regalo útil y personalizado.', emoji: '🥤', tint: 'lavender', badge: 'Personalizable' },
  { id: 'set-utensilios', name: 'Set de utensilios de cocina', category: 'hogar', price: 39.9, description: 'Accesorios útiles para renovar pequeños rincones de la cocina.', emoji: '🍴', tint: 'mint', badge: 'Para el hogar' },
  { id: 'flores-romanticas', name: 'Detalle floral romántico', category: 'romanticos', price: 64.9, description: 'Un detalle floral para celebrar el amor, la amistad o un momento importante.', emoji: '💐', tint: 'rose', badge: 'Para regalar' },
  { id: 'llavero-personalizado', name: 'Llavero personalizado', category: 'sublimados', price: 16.9, description: 'Un recuerdo pequeño y especial para llevar todos los días.', emoji: '🔑', tint: 'butter', badge: 'Personalizable' },
  { id: 'taza-hogar', name: 'Taza decorativa', category: 'hogar', price: 24.9, description: 'Una taza bonita para acompañar el desayuno, el café y los momentos de descanso.', emoji: '🍵', tint: 'sky', badge: 'Para el hogar' },
]
