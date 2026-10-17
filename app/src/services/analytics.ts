/**
 * Analítica opcional. Solo se carga si existen las variables de entorno:
 *  - VITE_GA_MEASUREMENT_ID (Google Analytics 4, ej. G-XXXXXXX)
 *  - VITE_META_PIXEL_ID (Meta Pixel de Facebook/Instagram)
 */
type Params = Record<string, string | number | undefined>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string; callMethod?: (...args: unknown[]) => void; push?: unknown }
    _fbq?: unknown
  }
}

const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim()
const pixelId = import.meta.env.VITE_META_PIXEL_ID?.trim()
let started = false

function loadScript(src: string) {
  const script = document.createElement('script')
  script.async = true
  script.src = src
  document.head.appendChild(script)
}

export function initAnalytics() {
  if (started || typeof window === 'undefined') return
  started = true
  if (gaId && /^G-[A-Z0-9]+$/i.test(gaId)) {
    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments)
    }
    window.gtag('js', new Date())
    window.gtag('config', gaId, { send_page_view: false })
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${gaId}`)
  }
  if (pixelId && /^\d+$/.test(pixelId)) {
    type Fbq = NonNullable<Window['fbq']>
    const fbq: Fbq = Object.assign((...args: unknown[]) => {
      if (fbq.callMethod) fbq.callMethod(...args)
      else fbq.queue!.push(args)
    }, {} as Partial<Fbq>) as Fbq
    fbq.queue = []
    fbq.loaded = true
    fbq.version = '2.0'
    window.fbq = fbq
    window._fbq = fbq
    loadScript('https://connect.facebook.net/en_US/fbevents.js')
    fbq('init', pixelId)
  }
}

export function trackPageview(path: string) {
  window.gtag?.('event', 'page_view', { page_path: path, page_location: window.location.href, page_title: document.title })
  window.fbq?.('track', 'PageView')
}

const pixelEvents: Record<string, string> = {
  view_item: 'ViewContent',
  add_to_cart: 'AddToCart',
  begin_checkout: 'InitiateCheckout',
  generate_lead: 'Lead',
  contact_whatsapp: 'Contact',
}

export function trackEvent(name: string, params: Params = {}) {
  window.gtag?.('event', name, params)
  const pixelEvent = pixelEvents[name]
  if (pixelEvent) window.fbq?.('track', pixelEvent, params)
}
