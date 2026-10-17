// Funciones de SEO compartidas por la web (React) y el pre-renderizado (Node).
import site from './site.json' with { type: 'json' }
import content from './seo-content.json' with { type: 'json' }

export { site, content }

export function absoluteUrl(path = '/', base = site.url) {
  if (/^https?:\/\//.test(path)) return path
  return `${base.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`
}

export function clip(text, max) {
  const clean = String(text ?? '').replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1).replace(/[\s,.;:]+\S*$/, '')}…`
}

export function productPath(slug) {
  return `/producto/${slug}`
}

export function categoryPath(slug) {
  return `/categoria/${slug}`
}

export function productTitle(product) {
  return clip(`${product.name} | ${product.categoryName} | JHOS`, 65)
}

export function formatSoles(value) {
  return `S/ ${Number(value).toFixed(2)}`
}

export function productDescription(product) {
  const price = `${product.priceMode === 'from' ? 'Desde ' : ''}${formatSoles(product.price)}`
  const base = product.description ? clip(product.description, 90) : `${product.categoryName} en JHOS Importaciones.`
  return clip(`${product.name}: ${base} ${price}. Envíos a Lima y provincias; pide por WhatsApp.`, 160)
}

const availabilityUrl = {
  in_stock: 'https://schema.org/InStock',
  out_of_stock: 'https://schema.org/OutOfStock',
  made_to_order: 'https://schema.org/PreOrder',
}

export function storeJsonLd(base = site.url) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Store',
      '@id': absoluteUrl('/#tienda', base),
      name: site.name,
      legalName: site.legalName,
      url: absoluteUrl('/', base),
      logo: absoluteUrl(site.logo, base),
      image: absoluteUrl(site.ogImage, base),
      telephone: site.telephone,
      email: site.email,
      priceRange: 'S/',
      currenciesAccepted: 'PEN',
      paymentAccepted: 'Yape, Plin, Transferencia bancaria',
      areaServed: { '@type': 'Country', name: 'Perú' },
      address: { '@type': 'PostalAddress', ...site.address },
      identifier: { '@type': 'PropertyValue', propertyID: 'RUC', value: site.ruc },
      contactPoint: site.phones.map((telephone) => ({ '@type': 'ContactPoint', telephone, contactType: 'sales', availableLanguage: 'es' })),
      sameAs: site.sameAs,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: site.name,
      url: absoluteUrl('/', base),
      inLanguage: 'es-PE',
    },
  ]
}

export function breadcrumbJsonLd(items, base = site.url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path, base),
    })),
  }
}

export function productJsonLd(product, images = [], base = site.url) {
  const url = absoluteUrl(productPath(product.slug), base)
  const offer = product.priceMode === 'from' && product.priceMax
    ? { '@type': 'AggregateOffer', lowPrice: product.price, highPrice: product.priceMax, offerCount: 1 }
    : { '@type': 'Offer', price: product.price }
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || productDescription(product),
    sku: product.externalId ?? undefined,
    category: `${product.familyName} > ${product.categoryName}`,
    image: images.length ? images : product.image ? [product.image] : undefined,
    url,
    offers: {
      ...offer,
      priceCurrency: 'PEN',
      availability: availabilityUrl[product.availability] ?? availabilityUrl.in_stock,
      itemCondition: 'https://schema.org/NewCondition',
      url,
      seller: { '@type': 'Organization', name: site.name },
    },
  }
}

export function collectionJsonLd({ name, description, path, products }, base = site.url) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: absoluteUrl(path, base),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(productPath(product.slug), base),
        name: product.name,
      })),
    },
  }
}
