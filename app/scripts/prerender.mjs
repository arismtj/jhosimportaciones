// Genera HTML estático por página (producto, categoría, portada…), sitemap.xml y robots.txt
// a partir del build de Vite. Se ejecuta después de `vite build`.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  absoluteUrl, breadcrumbJsonLd, categoryPath, clip, collectionJsonLd, content, formatSoles,
  productDescription, productJsonLd, productPath, productTitle, site, storeJsonLd,
} from '../shared/seo.mjs'
import { imageUrl, validateAndNormalize } from './lib/reference-catalog.mjs'

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(appDir, 'dist')

async function loadEnvFile() {
  for (const name of ['.env.production.local', '.env.local', '.env.production', '.env']) {
    try {
      const text = await readFile(path.join(appDir, name), 'utf8')
      for (const line of text.split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
        if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
      }
    } catch { /* archivo opcional */ }
  }
}

await loadEnvFile()
const SITE_URL = (process.env.VITE_SITE_URL || site.url).replace(/\/$/, '')
const SUPABASE_URL = process.env.VITE_SUPABASE_URL?.trim().replace(/\/$/, '')
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
const jsonLdTag = (data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`

async function fetchJson(pathAndQuery) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    signal: AbortSignal.timeout(20000),
  })
  if (!response.ok) throw new Error(`Supabase respondió ${response.status} en ${pathAndQuery.split('?')[0]}`)
  return response.json()
}

function storageUrl(storagePath) {
  return `${SUPABASE_URL}/storage/v1/object/public/product-images/${storagePath.split('/').map(encodeURIComponent).join('/')}`
}

async function loadFromSupabase() {
  const categories = await fetchJson('categories?select=id,parent_id,slug,name,sort_order&active=eq.true&order=sort_order,name')
  const rows = []
  for (let offset = 0; ; offset += 1000) {
    const page = await fetchJson(`products?select=id,external_id,slug,name,description,price,price_mode,price_max,availability,updated_at,category_id,images:product_images(storage_path,source_url,sort_order,is_primary)&published=eq.true&order=name&offset=${offset}&limit=1000`)
    rows.push(...page)
    if (page.length < 1000) break
  }
  const byId = new Map(categories.map((category) => [category.id, category]))
  const products = rows.map((row) => {
    const category = byId.get(row.category_id)
    const family = category?.parent_id ? byId.get(category.parent_id) : category
    const images = [...row.images]
      .sort((a, b) => (a.is_primary === b.is_primary ? a.sort_order - b.sort_order : a.is_primary ? -1 : 1))
      .map((image) => (image.storage_path ? storageUrl(image.storage_path) : image.source_url))
      .filter(Boolean)
    return {
      slug: row.slug, name: row.name, description: row.description, price: Number(row.price), priceMode: row.price_mode,
      priceMax: row.price_max === null ? null : Number(row.price_max), availability: row.availability, externalId: row.external_id,
      categorySlug: category?.slug, categoryName: category?.name ?? '', familySlug: family?.slug, familyName: family?.name ?? '',
      images, image: images[0], updatedAt: row.updated_at,
    }
  }).filter((product) => product.categorySlug)
  return { categories: categories.map(({ slug, name, parent_id, id }) => ({ id, slug, name, parentId: parent_id })), products, source: 'Supabase' }
}

async function loadFromSnapshot() {
  const raw = JSON.parse(await readFile(path.join(appDir, 'catalog-source', 'reference-products.json'), 'utf8'))
  const { normalized } = validateAndNormalize(raw)
  const categories = []
  for (const product of normalized) {
    if (!categories.some((category) => category.slug === product.familySlug)) categories.push({ id: product.familySlug, slug: product.familySlug, name: product.family, parentId: null })
    if (!categories.some((category) => category.slug === product.subcategorySlug)) categories.push({ id: product.subcategorySlug, slug: product.subcategorySlug, name: product.subcategory, parentId: product.familySlug })
  }
  const products = normalized.map((product) => {
    const images = product.images.map((image) => image.sourceUrl ?? imageUrl(image.sourcePath))
    return {
      slug: product.slug, name: product.name, description: product.description, price: product.price, priceMode: product.priceMode,
      priceMax: product.priceMax, availability: product.availability, externalId: product.externalId,
      categorySlug: product.subcategorySlug, categoryName: product.subcategory, familySlug: product.familySlug, familyName: product.family,
      images, image: images[0], updatedAt: product.sourceUpdatedAt,
    }
  })
  return { categories, products, source: 'snapshot local' }
}

let data
if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    data = await loadFromSupabase()
    if (!data.products.length) throw new Error('Supabase no devolvió productos publicados')
  } catch (error) {
    console.warn(`[prerender] ${error.message}. Uso el snapshot local del catálogo.`)
  }
}
data ??= await loadFromSnapshot()
const { categories, products } = data
const familyOrder = ['importaciones', 'detalles', 'sublimacion']
const families = categories.filter((category) => !category.parentId).sort((a, b) => familyOrder.indexOf(a.slug) - familyOrder.indexOf(b.slug))
const subcategoriesOf = (family) => categories.filter((category) => category.parentId === family.id)
const productsIn = (category) => products.filter((product) => product.categorySlug === category.slug || product.familySlug === category.slug)

const template = await readFile(path.join(distDir, 'index.html'), 'utf8')
if (!template.includes('<!--seo:start-->') || !template.includes('<!--app-html-->')) throw new Error('index.html no tiene los marcadores de SEO')

function headTags({ title, description, pathName, image, type = 'website', jsonLd = [] }) {
  const url = absoluteUrl(pathName, SITE_URL)
  const ogImage = absoluteUrl(image || site.ogImage, SITE_URL)
  return [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    '<meta name="robots" content="index, follow, max-image-preview:large" />',
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    `<meta property="og:site_name" content="${escapeHtml(site.name)}" />`,
    `<meta property="og:locale" content="${site.locale}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:image" content="${escapeHtml(ogImage)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />`,
    ...jsonLd.map(jsonLdTag),
  ].join('\n    ')
}

const staticHeader = () => `<header><a class="seo-brand" href="/">JHOS Importaciones</a>${families.map((family) => `<a href="${categoryPath(family.slug)}">${escapeHtml(family.name)}</a>`).join('')}<a href="/promociones">Promociones</a><a href="/regalos-navidad">Navidad</a></header>`
const staticFooter = () => `<footer><p><strong>${escapeHtml(site.legalName)}</strong> · RUC ${site.ruc}<br>${escapeHtml(site.address.streetAddress)}, ${escapeHtml(site.address.addressLocality)}, ${escapeHtml(site.address.addressRegion)}<br>WhatsApp: <a href="https://wa.me/51976110949">976 110 949</a> · <a href="https://wa.me/51902582800">902 582 800</a> · <a href="mailto:${site.email}">${site.email}</a></p></footer>`
const productLinks = (list) => `<ul>${list.map((product) => `<li><a href="${productPath(product.slug)}">${escapeHtml(product.name)}</a> — ${product.priceMode === 'from' ? 'desde ' : ''}${formatSoles(product.price)}</li>`).join('')}</ul>`

function page({ title, description, pathName, image, type, jsonLd, body }) {
  return template
    .replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, headTags({ title, description, pathName, image, type, jsonLd }))
    .replace('<!--app-html-->', `<div class="seo-static">${staticHeader()}<main>${body}</main>${staticFooter()}</div>`)
}

async function write(relativePath, html) {
  const target = path.join(distDir, relativePath)
  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(target, html, 'utf8')
}

const sitemap = []
const addUrl = (pathName, lastmod, priority) => sitemap.push({ loc: absoluteUrl(pathName, SITE_URL), lastmod, priority })
const today = new Date().toISOString().slice(0, 10)
const newest = (list) => list.map((product) => product.updatedAt).filter(Boolean).sort().at(-1)?.slice(0, 10) ?? today

// Fallback de la SPA (rutas no pre-renderizadas): plantilla limpia
await write('app-shell.html', template.replace('<!--app-html-->', ''))

// Portada
await write('index.html', page({
  title: content.home.title,
  description: content.home.description,
  pathName: '/',
  jsonLd: storeJsonLd(SITE_URL),
  body: `<h1>Regalos personalizados, detalles e importaciones en Lima</h1><p>${escapeHtml(content.home.description)}</p>${families.map((family) => `<h2><a href="${categoryPath(family.slug)}">${escapeHtml(family.name)}</a></h2><ul>${subcategoriesOf(family).map((sub) => `<li><a href="${categoryPath(sub.slug)}">${escapeHtml(sub.name)}</a></li>`).join('')}</ul>`).join('')}<h2>Productos</h2>${productLinks(products.slice(0, 40))}`,
}))
addUrl('/', newest(products), '1.0')

// Categorías
for (const category of categories) {
  const list = productsIn(category)
  const text = content.categories[category.slug] ?? {}
  const family = category.parentId ? categories.find((item) => item.id === category.parentId) : null
  const pathName = categoryPath(category.slug)
  const description = text.description ?? clip(`${category.name} en JHOS Importaciones. Envíos a Lima y provincias; pide por WhatsApp.`, 160)
  await write(`categoria/${category.slug}.html`, page({
    title: text.title ?? `${category.name} | JHOS Importaciones`,
    description,
    pathName,
    jsonLd: [
      collectionJsonLd({ name: text.h1 ?? category.name, description, path: pathName, products: list.slice(0, 24) }, SITE_URL),
      breadcrumbJsonLd([{ name: 'Inicio', path: '/' }, ...(family ? [{ name: family.name, path: categoryPath(family.slug) }] : []), { name: category.name, path: pathName }], SITE_URL),
    ],
    body: `<p><a href="/">Inicio</a>${family ? ` › <a href="${categoryPath(family.slug)}">${escapeHtml(family.name)}</a>` : ''} › ${escapeHtml(category.name)}</p><h1>${escapeHtml(text.h1 ?? category.name)}</h1>${(text.intro ?? []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}${!family ? `<ul>${subcategoriesOf(category).map((sub) => `<li><a href="${categoryPath(sub.slug)}">${escapeHtml(sub.name)}</a></li>`).join('')}</ul>` : ''}<h2>${list.length} productos</h2>${productLinks(list)}`,
  }))
  addUrl(pathName, newest(list), family ? '0.8' : '0.9')
}

// Productos
for (const product of products) {
  const pathName = productPath(product.slug)
  const related = products.filter((item) => item.categorySlug === product.categorySlug && item.slug !== product.slug).slice(0, 12)
  const whatsapp = `https://wa.me/51976110949?text=${encodeURIComponent(`¡Hola! Quiero consultar por: ${product.name}. ${absoluteUrl(pathName, SITE_URL)}`)}`
  await write(`producto/${product.slug}.html`, page({
    title: productTitle(product),
    description: productDescription(product),
    pathName,
    image: product.image,
    type: 'product',
    jsonLd: [
      productJsonLd(product, product.images, SITE_URL),
      breadcrumbJsonLd([
        { name: 'Inicio', path: '/' },
        { name: product.familyName, path: categoryPath(product.familySlug) },
        { name: product.categoryName, path: categoryPath(product.categorySlug) },
        { name: product.name, path: pathName },
      ], SITE_URL),
    ],
    body: `<p><a href="/">Inicio</a> › <a href="${categoryPath(product.familySlug)}">${escapeHtml(product.familyName)}</a> › <a href="${categoryPath(product.categorySlug)}">${escapeHtml(product.categoryName)}</a></p><h1>${escapeHtml(product.name)}</h1>${product.image ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" width="360" height="360">` : ''}<p><strong>${product.priceMode === 'from' ? 'Desde ' : ''}${formatSoles(product.price)}</strong> · ${product.availability === 'out_of_stock' ? 'Agotado' : 'Consulta disponibilidad'}</p>${product.description ? `<p>${escapeHtml(product.description)}</p>` : ''}<p>Envíos a Lima y provincias. Recojo coordinado en Chorrillos. <a href="${whatsapp}">Consultar por WhatsApp</a></p>${related.length ? `<h2>Más de ${escapeHtml(product.categoryName)}</h2>${productLinks(related)}` : ''}`,
  }))
  addUrl(pathName, product.updatedAt?.slice(0, 10), '0.7')
}

// Páginas de contenido
for (const [slug, text] of Object.entries(content.pages)) {
  const pathName = `/${slug}`
  await write(`${slug}.html`, page({
    title: text.title,
    description: text.description,
    pathName,
    jsonLd: [breadcrumbJsonLd([{ name: 'Inicio', path: '/' }, { name: text.h1 ?? text.title, path: pathName }], SITE_URL)],
    body: `<h1>${escapeHtml(text.h1 ?? text.title)}</h1>${(text.intro ?? [text.description]).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}<ul>${families.map((family) => `<li><a href="${categoryPath(family.slug)}">${escapeHtml(family.name)}</a></li>`).join('')}</ul>`,
  }))
  addUrl(pathName, today, '0.6')
}

await write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemap.map((entry) => `  <url><loc>${escapeHtml(entry.loc)}</loc>${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}<priority>${entry.priority}</priority></url>`).join('\n')}\n</urlset>\n`)
await write('robots.txt', `User-agent: *\nAllow: /\nDisallow: /mi-cuenta\nDisallow: /administracion\nDisallow: /iniciar-sesion\nDisallow: /registro\n\nSitemap: ${absoluteUrl('/sitemap.xml', SITE_URL)}\n`)

console.log(`[prerender] ${products.length} productos, ${categories.length} categorías y ${sitemap.length} URLs en el sitemap (datos: ${data.source}).`)
