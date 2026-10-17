import { business } from './business'
import { faq } from './faq'

/** Textos editables desde el panel (pestaña «Contenido»). Estos son los valores por defecto. */
export interface LinkItem { label: string; href: string }
export interface Heading { kicker: string; title: string; accent: string }

export interface SiteContent {
  announcement: { text: string }
  navigation: { header: LinkItem[]; store: LinkItem[] }
  hero: { eyebrow: string; title: string; accent: string; text: string; primaryLabel: string; secondaryLabel: string; foot: string; note: string; image: string }
  benefits: { items: Array<{ icon: string; title: string; text: string }> }
  categories: Heading & { linkLabel: string }
  payments: Heading & { text: string; footnote: string }
  how: Heading & { steps: Array<{ title: string; text: string }> }
  faq: Heading & { text: string; items: Array<{ question: string; answer: string }> }
  social: Heading
  personalize: Heading & { text: string; button: string }
  about: Heading & { text: string; note: string }
  footer: { tagline: string; email: string; hours: string; address: string; pickup: string; coverage: string }
  promotions: Heading & { text: string }
}

export const defaultSiteContent: SiteContent = {
  announcement: { text: 'Regalos con intención, detalles que enamoran' },
  navigation: {
    header: [
      { label: 'Inicio', href: '/#inicio' },
      { label: 'Tienda', href: '/#catalogo' },
      { label: 'Categorías', href: '/#categorias' },
      { label: 'Nosotros', href: '/#nosotros' },
    ],
    store: [
      { label: '✦ Promociones', href: '/promociones' },
      { label: 'Medios de pago', href: '/#pagos' },
      { label: 'Cómo comprar', href: '/#ayuda' },
      { label: 'Redes', href: '/#redes' },
    ],
  },
  hero: {
    eyebrow: 'PARA CADA MOMENTO ESPECIAL',
    title: 'El detalle perfecto',
    accent: 'nace del corazón.',
    text: 'Detalles sublimados, regalos románticos, peluches y cositas lindas para el hogar. Encuentra ese regalo que dice más que mil palabras.',
    primaryLabel: 'Explorar productos',
    secondaryLabel: 'Ver categorías',
    foot: 'Personaliza tus ideas con nosotros',
    note: 'hecho para sorprender',
    image: '',
  },
  benefits: {
    items: [
      { icon: '✧', title: 'Detalles únicos', text: 'Para momentos especiales' },
      { icon: '♡', title: 'Con mucho cariño', text: 'Regalos con significado' },
      { icon: '✿', title: 'Atención cercana', text: 'Te ayudamos a elegir' },
      { icon: '✎', title: 'Personalizables', text: 'Tu estilo, tu mensaje' },
    ],
  },
  categories: { kicker: 'ENCUENTRA TU FAVORITO', title: 'Algo especial para', accent: 'cada ocasión', linkLabel: 'Ver todos los productos' },
  payments: {
    kicker: 'A TU MANERA, TAMBIÉN AL PAGAR', title: 'Elige tu', accent: 'medio de pago',
    text: 'Confirma primero el pedido y el importe final con un asesor. Luego envía tu comprobante por WhatsApp.',
    footnote: 'La elección del medio de pago no realiza ningún cargo automático.',
  },
  how: {
    kicker: 'COMPRA CON ACOMPAÑAMIENTO', title: 'De tu carrito', accent: 'a un buen detalle',
    steps: [
      { title: 'Elige lo que te gusta', text: 'Busca por familia o subcategoría y añade tus productos al carrito.' },
      { title: 'Revisa tu pedido', text: 'Completa la entrega, la personalización y el medio de pago.' },
      { title: 'Confirma por WhatsApp', text: 'Coordinamos el importe final, el diseño, la preparación y la entrega antes del pago.' },
    ],
  },
  faq: {
    kicker: 'ANTES DE ELEGIR', title: 'Resolvemos', accent: 'tus dudas',
    text: 'Lo que más nos preguntan sobre pedidos, envíos y pagos.',
    items: faq.map(({ question, answer }) => ({ question, answer })),
  },
  social: { kicker: 'CONECTA CON JHOS', title: 'Descubre lo que', accent: 'estamos creando' },
  personalize: {
    kicker: 'TÚ LO IMAGINAS, NOSOTROS TE AYUDAMOS', title: '¿Tienes una idea', accent: 'especial?',
    text: 'Cuéntanos qué quieres personalizar: una taza con su nombre, un detalle romántico o un regalo único para alguien importante.',
    button: 'Inspírate en el catálogo',
  },
  about: {
    kicker: 'CONÓCENOS', title: 'Pequeños detalles,', accent: 'grandes sonrisas.',
    text: 'En JHOS Importaciones reunimos regalos, detalles personalizados, peluches y productos para el hogar. Queremos ayudarte a encontrar algo bonito para cada ocasión.',
    note: 'Consulta con nosotros la disponibilidad, personalización y entrega de tu producto favorito.',
  },
  footer: {
    tagline: 'Personalizamos momentos, creamos emociones. Regalos, importaciones y detalles hechos a tu manera.',
    email: business.email, hours: business.hours, address: business.address, pickup: business.pickup, coverage: business.coverage,
  },
  promotions: {
    kicker: 'EXCLUSIVO PARA TI', title: 'Promociones que', accent: 'te van a encantar.',
    text: 'Descubre nuestras novedades y oportunidades. Revisa las condiciones de cada promoción y consulta disponibilidad por WhatsApp.',
  },
}

/** Combina lo guardado en la base de datos con los valores por defecto (sección por sección). */
export function mergeSiteContent(saved: unknown): SiteContent {
  const result = structuredClone(defaultSiteContent) as unknown as Record<string, Record<string, unknown>>
  if (saved && typeof saved === 'object') {
    for (const [section, value] of Object.entries(saved as Record<string, unknown>)) {
      if (result[section] && value && typeof value === 'object' && !Array.isArray(value)) {
        for (const [field, fieldValue] of Object.entries(value)) {
          if (field in result[section]! && typeof fieldValue === typeof result[section]![field]) result[section]![field] = fieldValue
        }
      }
    }
  }
  return result as unknown as SiteContent
}

// ---------- Descripción del formulario del panel ----------
export type FieldType = 'text' | 'textarea' | 'image' | 'links' | 'list'
export interface FieldSpec {
  key: string
  label: string
  type: FieldType
  hint?: string
  itemFields?: Array<{ key: string; label: string; type: 'text' | 'textarea' }>
  itemName?: string
}
export interface SectionSpec { id: keyof SiteContent; title: string; description: string; where: string; fields: FieldSpec[] }

const heading: FieldSpec[] = [
  { key: 'kicker', label: 'Texto pequeño de arriba', type: 'text' },
  { key: 'title', label: 'Título', type: 'text' },
  { key: 'accent', label: 'Final del título (en color)', type: 'text' },
]

export const contentSections: SectionSpec[] = [
  { id: 'navigation', title: 'Menú principal', description: 'Los enlaces de arriba y los de la barra de la tienda.', where: '/', fields: [
    { key: 'header', label: 'Menú de arriba (junto al logo)', type: 'links' },
    { key: 'store', label: 'Enlaces a la derecha de la barra de la tienda', type: 'links', hint: 'Los menús de productos (Importaciones, Detalles…) se editan en «Menú y páginas».' },
  ] },
  { id: 'announcement', title: 'Barra de anuncio', description: 'La franja de color de la parte superior.', where: '/', fields: [{ key: 'text', label: 'Texto', type: 'text' }] },
  { id: 'hero', title: 'Portada: bloque principal', description: 'El título grande que se ve al entrar.', where: '/', fields: [
    { key: 'eyebrow', label: 'Texto pequeño de arriba', type: 'text' },
    { key: 'title', label: 'Título', type: 'text' },
    { key: 'accent', label: 'Final del título (en color)', type: 'text' },
    { key: 'text', label: 'Descripción', type: 'textarea' },
    { key: 'primaryLabel', label: 'Botón principal', type: 'text' },
    { key: 'secondaryLabel', label: 'Botón secundario', type: 'text' },
    { key: 'foot', label: 'Frase de abajo', type: 'text' },
    { key: 'note', label: 'Etiqueta sobre el dibujo', type: 'text' },
    { key: 'image', label: 'Imagen (opcional)', type: 'image', hint: 'Si subes una foto, reemplaza al dibujo del regalo.' },
  ] },
  { id: 'benefits', title: 'Portada: franja de beneficios', description: 'Las 4 frases debajo del bloque principal.', where: '/', fields: [
    { key: 'items', label: 'Beneficios', type: 'list', itemName: 'beneficio', itemFields: [{ key: 'icon', label: 'Símbolo', type: 'text' }, { key: 'title', label: 'Título', type: 'text' }, { key: 'text', label: 'Texto', type: 'text' }] },
  ] },
  { id: 'categories', title: 'Portada: categorías', description: 'Título de las tarjetas de categorías. La descripción de cada tarjeta se edita en «Menú y páginas».', where: '/#categorias', fields: [...heading, { key: 'linkLabel', label: 'Enlace «ver todos»', type: 'text' }] },
  { id: 'payments', title: 'Medios de pago', description: 'Títulos de la sección de pagos.', where: '/#pagos', fields: [...heading, { key: 'text', label: 'Descripción', type: 'textarea' }, { key: 'footnote', label: 'Nota final', type: 'text' }] },
  { id: 'how', title: 'Cómo comprar', description: 'Los pasos para comprar.', where: '/#ayuda', fields: [...heading, { key: 'steps', label: 'Pasos', type: 'list', itemName: 'paso', itemFields: [{ key: 'title', label: 'Título', type: 'text' }, { key: 'text', label: 'Texto', type: 'textarea' }] }] },
  { id: 'faq', title: 'Preguntas frecuentes', description: 'Preguntas y respuestas.', where: '/#preguntas', fields: [...heading, { key: 'text', label: 'Descripción', type: 'text' }, { key: 'items', label: 'Preguntas', type: 'list', itemName: 'pregunta', itemFields: [{ key: 'question', label: 'Pregunta', type: 'text' }, { key: 'answer', label: 'Respuesta', type: 'textarea' }] }] },
  { id: 'social', title: 'Redes sociales', description: 'Título de la sección de redes.', where: '/#redes', fields: heading },
  { id: 'personalize', title: 'Portada: ¿Tienes una idea especial?', description: 'Bloque de personalización.', where: '/#nosotros', fields: [...heading, { key: 'text', label: 'Descripción', type: 'textarea' }, { key: 'button', label: 'Botón', type: 'text' }] },
  { id: 'about', title: 'Nosotros', description: 'Quiénes son.', where: '/#nosotros', fields: [...heading, { key: 'text', label: 'Texto', type: 'textarea' }, { key: 'note', label: 'Nota', type: 'textarea' }] },
  { id: 'footer', title: 'Pie de página', description: 'Datos de contacto al final de la web.', where: '/', fields: [
    { key: 'tagline', label: 'Frase', type: 'textarea' },
    { key: 'email', label: 'Correo', type: 'text' },
    { key: 'hours', label: 'Horario', type: 'text' },
    { key: 'address', label: 'Dirección', type: 'text' },
    { key: 'pickup', label: 'Punto de recojo', type: 'text' },
    { key: 'coverage', label: 'Cobertura de envíos', type: 'text' },
  ] },
  { id: 'promotions', title: 'Página de Promociones', description: 'La cabecera de la página de promociones.', where: '/promociones', fields: [...heading, { key: 'text', label: 'Descripción', type: 'textarea' }] },
]
