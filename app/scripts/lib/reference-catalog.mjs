import { createHash } from 'node:crypto'

export const SOURCE_URL = 'https://jhos-importaciones-tienda.wigglyemu17.chatgpt.site/api/products'
export const SOURCE_ORIGIN = new URL(SOURCE_URL).origin
export const SOURCE_SYSTEM = 'jhos-reference-wigglyemu17'
export const EXPECTED_FAMILIES = ['Importaciones', 'Detalles', 'Sublimación']

const availabilityMap = {
  stock: 'in_stock',
  out: 'out_of_stock',
  custom: 'made_to_order',
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort((left, right) => left.localeCompare(right))
        .map((key) => [key, canonicalize(value[key])]),
    )
  }
  return value
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value))
}

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

export function sourceHash(products) {
  return sha256(canonicalJson(products))
}

export function slugify(value) {
  const slug = String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'item'
}

function requireText(value, field, externalId, errors) {
  if (typeof value !== 'string' || !value.trim()) {
    errors.push(`${externalId || '(sin id)'}: ${field} debe ser texto no vacío.`)
    return ''
  }
  return value.trim()
}

function sourceImagePaths(product) {
  const paths = Array.isArray(product.images) && product.images.length ? product.images : [product.img]
  return [...new Set(paths.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim()))]
}

export function imageUrl(sourcePath) {
  return new URL(sourcePath, `${SOURCE_ORIGIN}/`).href
}

export function validateAndNormalize(products) {
  const errors = []
  const warnings = []
  if (!Array.isArray(products)) throw new Error('El catálogo de referencia no es un arreglo JSON.')
  if (!products.length) throw new Error('El catálogo de referencia está vacío.')

  const seenIds = new Set()
  const seenNames = new Map()
  const normalized = []

  for (const raw of products) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      errors.push('Se encontró un producto que no es un objeto JSON.')
      continue
    }

    const externalId = requireText(String(raw.id ?? ''), 'id', '', errors)
    const name = requireText(raw.name, 'name', externalId, errors)
    const description = requireText(raw.text, 'text', externalId, errors)
    const family = requireText(raw.group, 'group', externalId, errors)
    const subcategory = requireText(raw.subcategory, 'subcategory', externalId, errors)
    const paths = sourceImagePaths(raw)

    if (seenIds.has(externalId)) errors.push(`${externalId}: identificador de origen duplicado.`)
    seenIds.add(externalId)

    const foldedName = name.toLocaleLowerCase('es')
    const sameNameIds = seenNames.get(foldedName) ?? []
    sameNameIds.push(externalId)
    seenNames.set(foldedName, sameNameIds)

    if (!EXPECTED_FAMILIES.includes(family)) errors.push(`${externalId}: familia desconocida “${family}”.`)
    if (!Number.isFinite(raw.price) || raw.price <= 0) errors.push(`${externalId}: price debe ser mayor que cero.`)
    if (typeof raw.active !== 'boolean') errors.push(`${externalId}: active debe ser booleano.`)
    if (!Object.hasOwn(availabilityMap, raw.availability)) {
      errors.push(`${externalId}: disponibilidad desconocida “${raw.availability}”.`)
    }
    if (!paths.length) errors.push(`${externalId}: no contiene imágenes.`)

    const priceMode = raw.priceMode ?? 'fixed'
    if (!['fixed', 'from'].includes(priceMode)) errors.push(`${externalId}: priceMode desconocido “${priceMode}”.`)
    if (priceMode === 'from' && (!Number.isFinite(raw.priceMax) || raw.priceMax < raw.price)) {
      errors.push(`${externalId}: priceMax debe ser igual o mayor que price.`)
    }

    const sourceUpdatedAt = raw.updatedAt ? new Date(raw.updatedAt) : null
    if (raw.updatedAt && Number.isNaN(sourceUpdatedAt.getTime())) {
      errors.push(`${externalId}: updatedAt no es una fecha válida.`)
    }

    const suffix = sha256(externalId).slice(0, 10)
    normalized.push({
      externalId,
      slug: `${slugify(name).slice(0, 80)}-${suffix}`,
      name,
      description,
      family,
      familySlug: slugify(family),
      subcategory,
      subcategorySlug: `${slugify(family)}-${slugify(subcategory)}`,
      price: Number(raw.price),
      priceMode,
      priceMax: priceMode === 'from' ? Number(raw.priceMax) : null,
      availability: availabilityMap[raw.availability],
      stockQuantity: null,
      customizable: false,
      featured: false,
      published: raw.active,
      sourceSystem: SOURCE_SYSTEM,
      sourceVersion: Number.isInteger(raw.version) ? raw.version : null,
      sourceUpdatedAt: sourceUpdatedAt && !Number.isNaN(sourceUpdatedAt.getTime()) ? sourceUpdatedAt.toISOString() : null,
      sourceMetadata: {
        cat: raw.cat ?? null,
        source: raw.source ?? null,
        page: raw.page ?? null,
        originalImg: raw.originalImg ?? null,
        photoSource: raw.photoSource ?? null,
        sourceAvailability: raw.availability,
        pendingFields: ['stock_quantity', 'variants', 'customizable'],
      },
      images: paths.map((sourcePath, index) => ({
        sourcePath,
        sourceUrl: imageUrl(sourcePath),
        altText: name,
        sortOrder: index,
        isPrimary: index === 0,
      })),
    })
  }

  for (const [name, ids] of seenNames) {
    if (ids.length > 1) warnings.push(`Nombre repetido “${name}” en los IDs: ${ids.join(', ')}.`)
  }

  const familyCounts = Object.fromEntries(
    EXPECTED_FAMILIES.map((family) => [family, normalized.filter((product) => product.family === family).length]),
  )
  const subcategories = [...new Set(normalized.map((product) => `${product.family}/${product.subcategory}`))]
  const images = normalized.flatMap((product) => product.images)

  return {
    errors,
    warnings,
    normalized,
    stats: {
      products: normalized.length,
      families: familyCounts,
      subcategories: subcategories.length,
      availability: {
        inStock: normalized.filter((product) => product.availability === 'in_stock').length,
        outOfStock: normalized.filter((product) => product.availability === 'out_of_stock').length,
        madeToOrder: normalized.filter((product) => product.availability === 'made_to_order').length,
      },
      priceRanges: normalized.filter((product) => product.priceMode === 'from').length,
      images: images.length,
      uniqueImages: new Set(images.map((image) => image.sourceUrl)).size,
      svgImages: images.filter((image) => new URL(image.sourceUrl).pathname.toLowerCase().endsWith('.svg')).length,
    },
  }
}

async function checkOneImage(image, timeoutMs) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(image.sourceUrl, { method: 'HEAD', signal: controller.signal })
    return {
      ...image,
      ok: response.ok,
      status: response.status,
      contentType: response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() ?? null,
      error: response.ok ? null : `HTTP ${response.status}`,
    }
  } catch (error) {
    return { ...image, ok: false, status: 0, contentType: null, error: error instanceof Error ? error.message : String(error) }
  } finally {
    clearTimeout(timeout)
  }
}

export async function checkImages(normalizedProducts, { concurrency = 12, timeoutMs = 20_000 } = {}) {
  const uniqueImages = [...new Map(
    normalizedProducts.flatMap((product) => product.images).map((image) => [image.sourceUrl, image]),
  ).values()]
  const results = []
  let cursor = 0

  async function worker() {
    while (cursor < uniqueImages.length) {
      const image = uniqueImages[cursor]
      cursor += 1
      results.push(await checkOneImage(image, timeoutMs))
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, uniqueImages.length) }, () => worker()))
  return results
}
