export interface Promotion {
  id: string
  title: string
  text: string
  /** Video o imagen de la promoción */
  media?: string
  /** Fechas en hora de Perú, formato AAAA-MM-DD (inclusive) */
  start: string
  end: string
}

const REFERENCE_MEDIA = 'https://jhos-importaciones-tienda.wigglyemu17.chatgpt.site/api/promo-media/'

/** Promociones tomadas de la tienda de referencia. Solo se muestran las vigentes. */
export const promotions: Promotion[] = [
  {
    id: 'caja-halloween',
    title: 'Caja Halloween',
    text: 'Caja sorpresa de Halloween: incluye sorpresas, 1 squishy, caramelos y chocolates a montón.',
    media: `${REFERENCE_MEDIA}3e005e85-f3da-4f13-a3ce-146955698d3f.mp4`,
    start: '2026-10-16',
    end: '2026-10-31',
  },
  {
    id: 'caja-exclusiva',
    title: 'Caja exclusiva',
    text: 'Caja negra exclusiva para todo tipo de ocasión.',
    media: `${REFERENCE_MEDIA}d2eb09e0-a696-44a0-b0ae-9709933508b3.mp4`,
    start: '2026-10-16',
    end: '2026-12-15',
  },
  {
    id: 'regalos-mensuales',
    title: 'Regalos mensuales',
    text: '¿Quieres participar? Es muy fácil: síguenos en todas nuestras redes sociales, dale like a esta publicación, etiqueta a dos amigos en los comentarios y comparte.\nPremios:\n1. Parlantes RGB\n2. Reloj smartwatch\n3. Audífono inalámbrico\n4. Vale de compra de S/150 en productos JHOS',
    media: `${REFERENCE_MEDIA}ab88ce6d-7997-45e5-89d4-470d51118709.mp4`,
    start: '2026-10-01',
    end: '2026-10-31',
  },
  {
    id: 'regalos-semanales',
    title: 'Regalos semanales',
    text: '¿Quieres participar? Es muy fácil: síguenos en todas nuestras redes sociales, dale like a esta publicación, etiqueta a dos amigos en los comentarios y comparte.',
    media: `${REFERENCE_MEDIA}8623c9fd-ff91-413f-a302-eb28f5c1aa98.mp4`,
    start: '2026-10-12',
    end: '2026-10-18',
  },
  {
    id: 'compra-y-gana',
    title: '¡Compra y gana!',
    text: '¿Quieres llevarlo? Compra desde S/100 en JHOS y participa con un ticket: a más tickets, más opciones. ¡No te quedes sin vivir la experiencia!\n1. Redmi 14C\n2. Smartwatch\n3. Tablet de 10"\n4. Freidora de aire\n5. TV de 43 pulgadas\n6. Caja sorpresa',
    media: `${REFERENCE_MEDIA}7526f6a5-b468-48e5-bd24-3848a8f2fa4c.mp4`,
    start: '2026-10-16',
    end: '2026-12-15',
  },
]

export function todayInPeru() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date())
}

export function activePromotions(today = todayInPeru()) {
  return promotions.filter((promotion) => promotion.start <= today && today <= promotion.end)
}

export function formatPeruDate(value: string) {
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}
