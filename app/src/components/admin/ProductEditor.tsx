import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import type { CatalogCategory } from '../../services/supabase/catalog'
import { imageUrl, saveProduct, type AdminImage, type AdminProduct, type ProductDraft } from '../../services/supabase/admin'
import { compressImage } from '../../utils/image'

interface Props {
  product: AdminProduct | null
  families: CatalogCategory[]
  subcategoriesOf: (familyId: string) => CatalogCategory[]
  onClose: () => void
  onSaved: (message: string) => void
}

const emptyDraft: ProductDraft = {
  name: '', description: '', category_id: '', price: 0, price_mode: 'fixed', price_max: null,
  availability: 'in_stock', published: true, featured: false, price_verified: true, customizable: false,
}

export function ProductEditor({ product, families, subcategoriesOf, onClose, onSaved }: Props) {
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft)
  const [images, setImages] = useState<AdminImage[]>([])
  const [removed, setRemoved] = useState<AdminImage[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (product) {
      setDraft({
        id: product.id, slug: product.slug, name: product.name, description: product.description, category_id: product.category_id,
        price: Number(product.price), price_mode: product.price_mode, price_max: product.price_max === null ? null : Number(product.price_max),
        availability: product.availability, published: product.published, featured: product.featured,
        price_verified: product.price_verified, customizable: product.customizable,
      })
      setImages([...product.images].sort((a, b) => (a.is_primary === b.is_primary ? a.sort_order - b.sort_order : a.is_primary ? -1 : 1))
        .map((image) => ({ id: image.id, storage_path: image.storage_path, source_url: image.source_url, preview: imageUrl(image) })))
    } else {
      setDraft(emptyDraft)
      setImages([])
    }
    setRemoved([])
    setError('')
  }, [product])

  const update = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) => setDraft((current) => ({ ...current, [key]: value }))

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setProcessing(true)
    setError('')
    try {
      const prepared: AdminImage[] = []
      for (const file of Array.from(files).slice(0, 10)) {
        const compressed = await compressImage(file)
        if (compressed.size > 8 * 1024 * 1024) throw new Error(`La foto «${file.name}» pesa demasiado (máx. 8 MB).`)
        prepared.push({ storage_path: null, source_url: null, file: compressed, preview: URL.createObjectURL(compressed) })
      }
      setImages((current) => [...current, ...prepared].slice(0, 12))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos preparar la foto.')
    } finally {
      setProcessing(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    setImages((current) => {
      const target = current[index]
      if (target && !target.file) setRemoved((list) => [...list, target])
      return current.filter((_, position) => position !== index)
    })
  }

  const makePrimary = (index: number) => setImages((current) => [current[index]!, ...current.filter((_, position) => position !== index)])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft.name.trim()) return setError('Escribe el nombre del producto.')
    if (!draft.category_id) return setError('Elige una categoría.')
    if (!(draft.price >= 0)) return setError('Escribe un precio válido.')
    if (draft.price_mode === 'from' && draft.price_max !== null && draft.price_max < draft.price) return setError('El precio máximo debe ser mayor que el precio «desde».')
    setSaving(true)
    setError('')
    try {
      await saveProduct(draft, images, removed)
      onSaved(product ? 'Cambios guardados ✅ Ya se ven en la tienda.' : 'Producto creado ✅ Ya aparece en la tienda.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos guardar.')
    } finally {
      setSaving(false)
    }
  }

  const priceLabel = useMemo(() => (draft.price_mode === 'from' ? 'Precio desde (S/)' : 'Precio (S/)'), [draft.price_mode])

  return (
    <div className="admin-sheet" role="dialog" aria-modal="true" aria-labelledby="editorTitle">
      <form className="admin-sheet-inner" onSubmit={(event) => void submit(event)}>
        <header className="admin-sheet-header">
          <button type="button" className="admin-back" onClick={onClose}>← Volver</button>
          <h2 id="editorTitle">{product ? 'Editar producto' : 'Nuevo producto'}</h2>
        </header>

        <section className="admin-field">
          <span className="admin-label">Fotos <small>La primera es la principal. Toca «Principal» para cambiarla.</small></span>
          <div className="admin-photos">
            {images.map((image, index) => (
              <figure key={image.preview} className={index === 0 ? 'primary' : ''}>
                <img src={image.preview} alt="" />
                {index === 0 ? <span className="admin-photo-tag">Principal</span> : <button type="button" className="admin-photo-tag action" onClick={() => makePrimary(index)}>Principal</button>}
                <button type="button" className="admin-photo-remove" aria-label="Quitar foto" onClick={() => removeImage(index)}>×</button>
              </figure>
            ))}
            <label className="admin-photo-add">
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={(event) => void addFiles(event.target.files)} />
              <span aria-hidden="true">📷</span>{processing ? 'Preparando…' : 'Subir fotos'}
            </label>
          </div>
        </section>

        <label className="admin-field">
          <span className="admin-label">Nombre del producto *</span>
          <input value={draft.name} maxLength={180} onChange={(event) => update('name', event.target.value)} placeholder="Ej.: Taza mágica personalizada" required />
        </label>

        <label className="admin-field">
          <span className="admin-label">Categoría *</span>
          <select value={draft.category_id} onChange={(event) => update('category_id', event.target.value)} required>
            <option value="">Elige una categoría…</option>
            {families.map((family) => (
              subcategoriesOf(family.id).length ? (
                <optgroup key={family.id} label={family.name}>
                  {subcategoriesOf(family.id).map((sub) => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
                </optgroup>
              ) : <option key={family.id} value={family.id}>{family.name}</option>
            ))}
          </select>
        </label>

        <div className="admin-row">
          <label className="admin-field">
            <span className="admin-label">Tipo de precio</span>
            <select value={draft.price_mode} onChange={(event) => update('price_mode', event.target.value as ProductDraft['price_mode'])}>
              <option value="fixed">Precio fijo</option>
              <option value="from">Desde (varía según modelo)</option>
            </select>
          </label>
          <label className="admin-field">
            <span className="admin-label">{priceLabel} *</span>
            <input type="number" inputMode="decimal" min="0" step="0.10" value={Number.isFinite(draft.price) ? draft.price : ''} onChange={(event) => update('price', Number(event.target.value))} required />
          </label>
          {draft.price_mode === 'from' && (
            <label className="admin-field">
              <span className="admin-label">Hasta (S/) <small>opcional</small></span>
              <input type="number" inputMode="decimal" min="0" step="0.10" value={draft.price_max ?? ''} onChange={(event) => update('price_max', event.target.value === '' ? null : Number(event.target.value))} />
            </label>
          )}
        </div>

        <label className="admin-field">
          <span className="admin-label">Descripción</span>
          <textarea rows={5} maxLength={3000} value={draft.description} onChange={(event) => update('description', event.target.value)} placeholder="Medidas, material, qué incluye, colores disponibles…" />
        </label>

        <label className="admin-field">
          <span className="admin-label">Disponibilidad</span>
          <select value={draft.availability} onChange={(event) => update('availability', event.target.value as ProductDraft['availability'])}>
            <option value="in_stock">Disponible</option>
            <option value="made_to_order">Bajo pedido</option>
            <option value="out_of_stock">Agotado</option>
          </select>
        </label>

        <div className="admin-switches">
          <label className="admin-switch"><input type="checkbox" checked={draft.published} onChange={(event) => update('published', event.target.checked)} /><span><strong>Mostrar en la tienda</strong><small>Si lo apagas, el producto se oculta sin borrarse.</small></span></label>
          <label className="admin-switch"><input type="checkbox" checked={draft.featured} onChange={(event) => update('featured', event.target.checked)} /><span><strong>Destacado</strong><small>Aparece primero en el catálogo.</small></span></label>
          <label className="admin-switch"><input type="checkbox" checked={draft.price_verified} onChange={(event) => update('price_verified', event.target.checked)} /><span><strong>Precio confirmado</strong><small>Márcalo cuando el precio esté actualizado.</small></span></label>
          <label className="admin-switch"><input type="checkbox" checked={draft.customizable} onChange={(event) => update('customizable', event.target.checked)} /><span><strong>Personalizable</strong><small>Se puede pedir con nombre, foto o frase.</small></span></label>
        </div>

        {error && <p className="admin-error" role="alert">{error}</p>}

        <footer className="admin-sheet-footer">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving || processing}>{saving ? 'Guardando…' : 'Guardar producto'}</button>
        </footer>
      </form>
    </div>
  )
}
