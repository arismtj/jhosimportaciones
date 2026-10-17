import { useEffect, useState, type FormEvent } from 'react'
import { formatPeruDate, todayInPeru } from '../../config/promotions'
import { deletePromotion, listAdminPromotions, promoMediaUrl, savePromotion, type PromotionRow } from '../../services/supabase/admin'
import { compressImage } from '../../utils/image'

type Draft = Partial<PromotionRow> & { title: string; ends_on: string }

function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00`)
  value.setDate(value.getDate() + days)
  return value.toISOString().slice(0, 10)
}

export function PromotionsAdmin({ notify }: { notify: (message: string) => void }) {
  const [rows, setRows] = useState<PromotionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Draft | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const today = todayInPeru()

  const load = () => {
    setLoading(true)
    listAdminPromotions().then(setRows).catch((caught: Error) => notify(caught.message)).finally(() => setLoading(false))
  }
  useEffect(load, []) // eslint-disable-line react-hooks/exhaustive-deps

  const open = (row?: PromotionRow) => {
    setFile(null)
    setError('')
    setEditing(row ? { ...row } : { title: '', body: '', starts_on: today, ends_on: addDays(today, 14), active: true })
  }

  const pickFile = async (selected: File | undefined) => {
    if (!selected) return
    setError('')
    try {
      if (selected.type.startsWith('video/')) {
        if (selected.size > 50 * 1024 * 1024) throw new Error('El video pesa más de 50 MB. Recórtalo o compártelo en menor calidad.')
        setFile(selected)
      } else {
        setFile(await compressImage(selected))
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos leer el archivo.')
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!editing) return
    if (!editing.title.trim()) return setError('Escribe un título.')
    if ((editing.starts_on ?? today) > editing.ends_on) return setError('La fecha de fin debe ser posterior a la de inicio.')
    setSaving(true)
    setError('')
    try {
      await savePromotion(editing, file)
      setEditing(null)
      notify('Promoción guardada ✅')
      load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos guardar.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row: PromotionRow) => {
    if (!window.confirm(`¿Eliminar la promoción «${row.title}»?`)) return
    try {
      await deletePromotion(row)
      notify('Promoción eliminada.')
      load()
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : 'No se pudo eliminar.')
    }
  }

  const status = (row: PromotionRow) => !row.active ? 'Pausada' : row.ends_on < today ? 'Vencida' : row.starts_on > today ? 'Programada' : 'Visible'

  return (
    <section aria-labelledby="promosTitle">
      <div className="admin-section-head">
        <div><h2 id="promosTitle">Promociones</h2><p>Se muestran solas entre la fecha de inicio y la de fin.</p></div>
        <button type="button" className="btn btn-primary admin-new" onClick={() => open()}>＋ Nueva promoción</button>
      </div>
      {loading ? <p className="admin-empty">Cargando…</p> : !rows.length ? <p className="admin-empty">Aún no hay promociones.</p> : (
        <ul className="admin-list">
          {rows.map((row) => (
            <li key={row.id} className={status(row) !== 'Visible' ? 'is-hidden' : ''}>
              <button type="button" className="admin-item-main" onClick={() => open(row)}>
                {row.media_type === 'image' && row.media_url ? <img src={promoMediaUrl(row.media_url)} alt="" /> : <span className="admin-noimg">{row.media_type === 'video' ? '🎬' : '✨'}</span>}
                <span className="admin-item-text">
                  <strong>{row.title}</strong>
                  <small>{formatPeruDate(row.starts_on)} → {formatPeruDate(row.ends_on)}</small>
                  <span className="admin-badges"><em className={status(row) === 'Visible' ? 'b-ok' : 'b-hidden'}>{status(row)}</em></span>
                </span>
              </button>
              <div className="admin-item-actions">
                <button type="button" onClick={() => open(row)}>✏️ Editar</button>
                <button type="button" className="danger" onClick={() => void remove(row)}>🗑️</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <div className="admin-sheet" role="dialog" aria-modal="true" aria-labelledby="promoEditorTitle">
          <form className="admin-sheet-inner" onSubmit={(event) => void submit(event)}>
            <header className="admin-sheet-header">
              <button type="button" className="admin-back" onClick={() => setEditing(null)}>← Volver</button>
              <h2 id="promoEditorTitle">{editing.id ? 'Editar promoción' : 'Nueva promoción'}</h2>
            </header>
            <label className="admin-field"><span className="admin-label">Título *</span><input value={editing.title} maxLength={120} onChange={(event) => setEditing({ ...editing, title: event.target.value })} placeholder="Ej.: Caja sorpresa de Navidad" required /></label>
            <label className="admin-field"><span className="admin-label">Texto</span><textarea rows={6} maxLength={2000} value={editing.body ?? ''} onChange={(event) => setEditing({ ...editing, body: event.target.value })} placeholder="Qué incluye, condiciones, premios…" /></label>
            <div className="admin-field">
              <span className="admin-label">Video o imagen <small>MP4 hasta 50 MB o una foto</small></span>
              {(file || editing.media_url) && (
                <div className="admin-media-preview">
                  {file ? (file.type.startsWith('video/') ? <video src={URL.createObjectURL(file)} controls /> : <img src={URL.createObjectURL(file)} alt="" />)
                    : editing.media_type === 'video' ? <video src={promoMediaUrl(editing.media_url!)} controls preload="metadata" /> : <img src={promoMediaUrl(editing.media_url!)} alt="" />}
                </div>
              )}
              <label className="admin-photo-add wide"><input type="file" accept="video/mp4,video/webm,video/quicktime,image/*" onChange={(event) => void pickFile(event.target.files?.[0])} /><span aria-hidden="true">🎬</span>{file || editing.media_url ? 'Cambiar archivo' : 'Subir video o imagen'}</label>
            </div>
            <div className="admin-row">
              <label className="admin-field"><span className="admin-label">Desde</span><input type="date" value={editing.starts_on ?? today} onChange={(event) => setEditing({ ...editing, starts_on: event.target.value })} /></label>
              <label className="admin-field"><span className="admin-label">Hasta *</span><input type="date" value={editing.ends_on} onChange={(event) => setEditing({ ...editing, ends_on: event.target.value })} required /></label>
            </div>
            <div className="admin-switches"><label className="admin-switch"><input type="checkbox" checked={editing.active ?? true} onChange={(event) => setEditing({ ...editing, active: event.target.checked })} /><span><strong>Activa</strong><small>Apágala para pausarla sin borrarla.</small></span></label></div>
            {error && <p className="admin-error" role="alert">{error}</p>}
            <footer className="admin-sheet-footer">
              <button type="button" className="btn btn-outline" onClick={() => setEditing(null)} disabled={saving}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? (file?.type.startsWith('video/') ? 'Subiendo video…' : 'Guardando…') : 'Guardar promoción'}</button>
            </footer>
          </form>
        </div>
      )}
    </section>
  )
}
