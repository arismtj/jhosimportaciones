import { useEffect } from 'react'
import { absoluteUrl, site, type JsonLd } from '../../shared/seo.mjs'

export const SITE_URL = (import.meta.env.VITE_SITE_URL || site.url).replace(/\/$/, '')

export interface SeoOptions {
  title: string
  description?: string
  /** Ruta canónica, por ejemplo /producto/taza */
  path?: string
  image?: string
  type?: 'website' | 'product'
  jsonLd?: JsonLd | JsonLd[]
  noindex?: boolean
}

function setMeta(attribute: 'name' | 'property', key: string, value: string | undefined) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!value) {
    element?.remove()
    return
  }
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', value)
}

function setCanonical(url: string | undefined) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!url) {
    link?.remove()
    return
  }
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.href = url
}

/** Actualiza título, descripción, canonical, Open Graph y datos estructurados de la página. */
export function useSeo(options: SeoOptions | null) {
  const serialized = options ? JSON.stringify(options) : ''

  useEffect(() => {
    if (!options) return
    const url = options.path ? absoluteUrl(options.path, SITE_URL) : undefined
    const image = absoluteUrl(options.image || site.ogImage, SITE_URL)
    document.title = options.title
    setMeta('name', 'description', options.description)
    setMeta('name', 'robots', options.noindex ? 'noindex, nofollow' : 'index, follow')
    setCanonical(options.noindex ? undefined : url)
    setMeta('property', 'og:title', options.title)
    setMeta('property', 'og:description', options.description)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:type', options.type ?? 'website')
    setMeta('property', 'og:image', image)
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', options.title)
    setMeta('name', 'twitter:description', options.description)
    setMeta('name', 'twitter:image', image)

    document.head.querySelectorAll('script[type="application/ld+json"]').forEach((node) => node.remove())
    const blocks = options.jsonLd ? (Array.isArray(options.jsonLd) ? options.jsonLd : [options.jsonLd]) : []
    blocks.forEach((block) => {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.dataset.seo = 'jsonld'
      script.textContent = JSON.stringify(block)
      document.head.appendChild(script)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialized])
}

import type { ReactNode } from 'react'
export function Seo(props: SeoOptions & { children?: ReactNode }) {
  const { children, ...options } = props
  useSeo(options)
  return children ?? null
}
