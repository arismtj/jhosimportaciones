import { createHash } from 'node:crypto'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import {
  SOURCE_SYSTEM,
  SOURCE_URL,
  checkImages,
  sha256,
  sourceHash,
  validateAndNormalize,
} from './lib/reference-catalog.mjs'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const appDirectory = path.resolve(scriptDirectory, '..')
const snapshotDirectory = path.join(appDirectory, 'catalog-source')
const snapshotPath = path.join(snapshotDirectory, 'reference-products.json')
const metadataPath = path.join(snapshotDirectory, 'reference-products.meta.json')
const fallbackImagePath = path.join(appDirectory, 'public', 'JHOS_logo_optimizado_menos_1MB.png')
const bucketName = 'product-images'

const args = new Set(process.argv.slice(2))
const fetchSnapshot = args.has('--fetch')
const executeImport = args.has('--execute')
const shouldCheckImages = args.has('--check-images')
const reconcileMissing = args.has('--reconcile-missing')

function printJson(label, value) {
  process.stdout.write(`${label}: ${JSON.stringify(value, null, 2)}\n`)
}

async function loadSourceProducts() {
  if (!fetchSnapshot) {
    return JSON.parse(await readFile(snapshotPath, 'utf8'))
  }

  const response = await fetch(SOURCE_URL, { headers: { accept: 'application/json' } })
  if (!response.ok) throw new Error(`No se pudo recuperar el catálogo: HTTP ${response.status}.`)
  const products = await response.json()
  const audit = validateAndNormalize(products)
  if (audit.errors.length) throw new Error(`El catálogo recuperado contiene ${audit.errors.length} errores.`)

  await mkdir(snapshotDirectory, { recursive: true })
  await writeFile(snapshotPath, `${JSON.stringify(products, null, 2)}\n`, 'utf8')
  await writeFile(
    metadataPath,
    `${JSON.stringify({
      sourceUrl: SOURCE_URL,
      fetchedAt: new Date().toISOString(),
      sourceSha256: sourceHash(products),
      stats: audit.stats,
      warnings: audit.warnings,
    }, null, 2)}\n`,
    'utf8',
  )
  return products
}

async function downloadImage(image) {
  const response = await fetch(image.sourceUrl)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const sourceMimeType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() ?? ''
  const sourceBuffer = Buffer.from(await response.arrayBuffer())
  if (!sourceBuffer.length) throw new Error('La imagen descargada está vacía.')
  if (sourceBuffer.length > 8 * 1024 * 1024) throw new Error('La imagen supera el límite de 8 MB.')

  if (sourceMimeType === 'image/svg+xml' || new URL(image.sourceUrl).pathname.toLowerCase().endsWith('.svg')) {
    const { default: sharp } = await import('sharp')
    const outputBuffer = await sharp(sourceBuffer, { density: 180 }).webp({ quality: 88 }).toBuffer()
    return { outputBuffer, outputMimeType: 'image/webp', extension: 'webp', sourceMimeType }
  }

  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(sourceMimeType)) {
    throw new Error(`Tipo de imagen no permitido: ${sourceMimeType || '(desconocido)'}.`)
  }

  const extension = sourceMimeType === 'image/jpeg' ? 'jpg' : sourceMimeType.split('/')[1]
  return { outputBuffer: sourceBuffer, outputMimeType: sourceMimeType, extension, sourceMimeType }
}

async function uploadFallback(client) {
  const buffer = await readFile(fallbackImagePath)
  const storagePath = `catalog/_fallback/product-image-unavailable-${sha256(buffer).slice(0, 12)}.png`
  const { error } = await client.storage.from(bucketName).upload(storagePath, buffer, {
    contentType: 'image/png',
    cacheControl: '31536000',
    upsert: true,
  })
  if (error) throw error
  return { storagePath, sha256: sha256(buffer), mimeType: 'image/png' }
}

async function recordIssue(client, runId, issue) {
  const { error } = await client.from('catalog_import_issues').insert({
    import_run_id: runId,
    external_id: issue.externalId ?? null,
    stage: issue.stage,
    code: issue.code,
    message: issue.message.slice(0, 1000),
    source_url: issue.sourceUrl ?? null,
    details: issue.details ?? {},
  })
  if (error) throw error
}

async function upsertCategories(client, products) {
  const families = [...new Map(products.map((product) => [product.familySlug, product.family])).entries()]
  const familyIds = new Map()

  for (const [slug, name] of families) {
    const { data, error } = await client
      .from('categories')
      .upsert({ slug, name, parent_id: null, active: true }, { onConflict: 'slug' })
      .select('id')
      .single()
    if (error) throw error
    familyIds.set(slug, data.id)
  }

  const categoryIds = new Map()
  const subcategories = [...new Map(products.map((product) => [
    product.subcategorySlug,
    { name: product.subcategory, familySlug: product.familySlug },
  ])).entries()]

  for (const [slug, category] of subcategories) {
    const { data, error } = await client
      .from('categories')
      .upsert({ slug, name: category.name, parent_id: familyIds.get(category.familySlug), active: true }, { onConflict: 'slug' })
      .select('id')
      .single()
    if (error) throw error
    categoryIds.set(slug, data.id)
  }
  return categoryIds
}

async function importCatalog(products, audit, imageChecks) {
  const supabaseUrl = process.env.SUPABASE_URL?.trim()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('La importación requiere SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno del proceso.')
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  const snapshotSha256 = sourceHash(products)
  const { data: run, error: runError } = await client
    .from('catalog_import_runs')
    .insert({ source_url: SOURCE_URL, source_sha256: snapshotSha256, source_product_count: products.length })
    .select('id')
    .single()
  if (runError) throw runError

  let importedProductCount = 0
  let importedImageCount = 0
  let failedImageCount = 0
  let status = 'running'

  try {
    const categoryIds = await upsertCategories(client, audit.normalized)
    const fallback = await uploadFallback(client)
    const failedCheckUrls = new Set(imageChecks.filter((image) => !image.ok).map((image) => image.sourceUrl))

    for (const product of audit.normalized) {
      const importedImages = []

      for (const image of product.images) {
        try {
          if (failedCheckUrls.has(image.sourceUrl)) throw new Error('La comprobación HTTP previa falló.')
          const converted = await downloadImage(image)
          const contentSha256 = createHash('sha256').update(converted.outputBuffer).digest('hex')
          const safeExternalId = product.externalId.replace(/[^a-zA-Z0-9_-]/g, '-')
          const storagePath = `catalog/${safeExternalId}/${image.sortOrder}-${contentSha256.slice(0, 16)}.${converted.extension}`
          const { error: uploadError } = await client.storage.from(bucketName).upload(storagePath, converted.outputBuffer, {
            contentType: converted.outputMimeType,
            cacheControl: '31536000',
            upsert: true,
          })
          if (uploadError) throw uploadError
          importedImages.push({
            storage_path: storagePath,
            source_url: image.sourceUrl,
            alt_text: image.altText,
            sort_order: image.sortOrder,
            is_primary: false,
            source_sha256: contentSha256,
            source_mime_type: converted.sourceMimeType,
            import_run_id: run.id,
          })
          importedImageCount += 1
        } catch (error) {
          failedImageCount += 1
          await recordIssue(client, run.id, {
            externalId: product.externalId,
            stage: 'image',
            code: 'IMAGE_IMPORT_FAILED',
            message: error instanceof Error ? error.message : String(error),
            sourceUrl: image.sourceUrl,
          })
        }
      }

      if (!importedImages.length) {
        importedImages.push({
          storage_path: fallback.storagePath,
          source_url: product.images[0]?.sourceUrl ?? null,
          alt_text: `Imagen no disponible para ${product.name}`,
          sort_order: 0,
          is_primary: false,
          source_sha256: fallback.sha256,
          source_mime_type: fallback.mimeType,
          import_run_id: run.id,
        })
      }
      importedImages[0].is_primary = true

      const { data: importedProduct, error: productError } = await client
        .from('products')
        .upsert({
          external_id: product.externalId,
          category_id: categoryIds.get(product.subcategorySlug),
          slug: product.slug,
          name: product.name,
          description: product.description,
          price: product.price,
          price_mode: product.priceMode,
          price_max: product.priceMax,
          availability: product.availability,
          stock_quantity: null,
          customizable: product.customizable,
          featured: product.featured,
          published: product.published,
          source_system: product.sourceSystem,
          source_version: product.sourceVersion,
          source_updated_at: product.sourceUpdatedAt,
          source_metadata: product.sourceMetadata,
          latest_import_run_id: run.id,
        }, { onConflict: 'external_id' })
        .select('id')
        .single()
      if (productError) throw productError

      const { error: imagesError } = await client.rpc('replace_product_images', {
        p_product_id: importedProduct.id,
        p_images: importedImages,
      })
      if (imagesError) throw imagesError
      importedProductCount += 1
    }

    if (reconcileMissing) {
      const currentExternalIds = new Set(audit.normalized.map((product) => product.externalId))
      const { data: importedProducts, error: lookupError } = await client
        .from('products')
        .select('id, external_id')
        .eq('source_system', SOURCE_SYSTEM)
      if (lookupError) throw lookupError

      const staleIds = importedProducts
        .filter((product) => product.external_id && !currentExternalIds.has(product.external_id))
        .map((product) => product.id)
      for (let index = 0; index < staleIds.length; index += 100) {
        const { error } = await client
          .from('products')
          .update({ published: false })
          .in('id', staleIds.slice(index, index + 100))
        if (error) throw error
      }
    }

    status = failedImageCount ? 'partial' : 'succeeded'
  } catch (error) {
    status = 'failed'
    await recordIssue(client, run.id, {
      stage: 'catalog',
      code: 'IMPORT_ABORTED',
      message: error instanceof Error ? error.message : String(error),
    })
    throw error
  } finally {
    await client.from('catalog_import_runs').update({
      status,
      imported_product_count: importedProductCount,
      imported_image_count: importedImageCount,
      failed_image_count: failedImageCount,
      summary: audit.stats,
      finished_at: new Date().toISOString(),
    }).eq('id', run.id)
  }

  printJson('Importación', { runId: run.id, status, importedProductCount, importedImageCount, failedImageCount })
}

async function main() {
  const products = await loadSourceProducts()
  const audit = validateAndNormalize(products)
  printJson('Auditoría', { sourceSha256: sourceHash(products), ...audit.stats, warnings: audit.warnings })

  if (audit.errors.length) {
    printJson('Errores', audit.errors)
    process.exitCode = 1
    return
  }

  let imageChecks = []
  if (shouldCheckImages) {
    imageChecks = await checkImages(audit.normalized)
    const failures = imageChecks.filter((image) => !image.ok)
    printJson('Imágenes', {
      checked: imageChecks.length,
      successful: imageChecks.length - failures.length,
      failed: failures.length,
      failures,
    })
    if (failures.length && !executeImport) process.exitCode = 1
  }

  if (executeImport) await importCatalog(products, audit, imageChecks)
  else process.stdout.write('Modo dry-run: no se realizaron cambios en Supabase.\n')
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`)
  process.exitCode = 1
})
