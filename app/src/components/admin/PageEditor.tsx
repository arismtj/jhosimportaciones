import { useState, type FormEvent } from 'react'
import { savePage, type MenuRow, type PageRow } from '../../services/supabase/admin'
import { pageImageUrl } from '../../services/supabase/pages'
import { compressImage } from '../../utils/image'

interface Props {
  page: Partial<PageRow>
  menus: MenuRow[]
  allPages: PageRow[]
  onClose: () => void
  onSaved: () => void
}

export function PageEditor({ page, menus, allPages, onClose, onSaved }: Props) {
  const [draft, setDraft] = useState<Partial<PageRow>>(page)
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const pick = async (selected: File | undefined) => {
    if (!selected) return
    try { setFile(await compressImage(selected)) } catch { setError('No pudimos leer la imagen.') }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft.title?.trim()) return setError('Escribe un título.')
    setSaving(true)
    setError('')
    try {
      await savePage({ ...draft, title: draft.title }, file, allPages)
      onSaved()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos guardar.')
    } finally {
      setSaving(false)
    }
  }

  const preview = file ? URL.createObjectURL(file) : draft.image_url ? pageImageUrl(draft.image_url) : ''

  return (
    <div className="admin-sheet" role="dialog" aria-modal="true" aria-labelledby="pageEditorTitle">
      <form className="admin-sheet-inner" onSubmit={(event) => void submit(event)}>
        <header className="admin-sheet-header">
          <button type="button" className="admin-back" onClick={onClose}>← Volver</button>
          <h2 id="pageEditorTitle">{draft.id ? 'Editar página' : 'Nueva página'}</h2>
        </header>
        <label className="admin-field"><span className="admin-label">Título *</span><input value={draft.title ?? ''} maxLength={120} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Ej.: Envíos a provincia" required /></label>
        <label className="admin-field">
          <span className="admin-label">¿Dónde aparece en el menú?</span>
          <select value={draft.menu_id ?? ''} onChange={(event) => setDraft({ ...draft, menu_id: event.target.value || null })}>
            <option value="">Barra principal (junto a Promociones)</option>
            {menus.map((menu) => <option key={menu.id} value={menu.id}>Dentro de «{menu.name}»</option>)}
          </select>
        </label>
        <div className="admin-field">
          <span className="admin-label">Imagen <small>opcional</small></span>
          {preview && <div className="admin-media-preview"><img src={preview} alt="" /></div>}
          <div className="admin-inline-actions">
            <label className="admin-photo-add wide"><input type="file" accept="image/*" onChange={(event) => void pick(event.target.files?.[0])} /><span aria-hidden="true">🖼️</span>{preview ? 'Cambiar imagen' : 'Subir imagen'}</label>
            {preview && <button type="button" className="btn btn-outline" onClick={() => { setFile(null); setDraft({ ...draft, image_url: null }) }}>Quitar imagen</button>}
          </div>
        </div>
        <label className="admin-field">
          <span className="admin-label">Contenido <small>Deja una línea en blanco para separar párrafos</small></span>
          <textarea rows={12} maxLength={20000} value={draft.body ?? ''} onChange={(event) => setDraft({ ...draft, body: event.target.value })} placeholder="Escribe aquí el texto de la página…" />
        </label>
        <div className="admin-switches">
          <label className="admin-switch"><input type="checkbox" checked={draft.published ?? true} onChange={(event) => setDraft({ ...draft, published: event.target.checked })} /><span><strong>Publicada</strong><small>Apágala para guardarla como borrador sin mostrarla.</small></span></label>
        </div>
        {error && <p className="admin-error" role="alert">{error}</p>}
        <footer className="admin-sheet-footer">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar página'}</button>
        </footer>
      </form>
    </div>
  )
}
