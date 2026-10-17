import { useEffect, useMemo, useState } from 'react'
import { contentSections, defaultSiteContent, type FieldSpec, type LinkItem, type SectionSpec, type SiteContent } from '../../config/siteContent'
import { fetchSiteContent, useSetSiteContent } from '../../features/content/SiteContentContext'
import { listAdminPages, listMenus, saveSiteContent, uploadSiteImage } from '../../services/supabase/admin'
import { promoMediaPublicUrl } from '../../services/supabase/media'
import { compressImage } from '../../utils/image'

type Values = Record<string, unknown>
type Option = { label: string; href: string }

const fixedLinks: Option[] = [
  { label: 'Inicio', href: '/#inicio' },
  { label: 'Tienda (catálogo)', href: '/#catalogo' },
  { label: 'Categorías', href: '/#categorias' },
  { label: 'Nosotros', href: '/#nosotros' },
  { label: 'Medios de pago', href: '/#pagos' },
  { label: 'Cómo comprar', href: '/#ayuda' },
  { label: 'Preguntas frecuentes', href: '/#preguntas' },
  { label: 'Redes', href: '/#redes' },
  { label: 'Promociones', href: '/promociones' },
  { label: 'Regalos de Navidad', href: '/regalos-navidad' },
]

function LinksField({ value, onChange, options }: { value: LinkItem[]; onChange: (value: LinkItem[]) => void; options: Option[] }) {
  const set = (index: number, patch: Partial<LinkItem>) => onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  const move = (index: number, delta: number) => {
    const next = [...value]
    const [item] = next.splice(index, 1)
    next.splice(index + delta, 0, item!)
    onChange(next)
  }
  return (
    <div className="content-list">
      {value.map((item, index) => {
        const known = options.some((option) => option.href === item.href)
        return (
          <div className="content-item" key={index}>
            <div className="admin-row">
              <label className="admin-field"><span className="admin-label">Texto</span><input value={item.label} onChange={(event) => set(index, { label: event.target.value })} /></label>
              <label className="admin-field"><span className="admin-label">Lleva a</span>
                <select value={known ? item.href : '__otro'} onChange={(event) => set(index, { href: event.target.value === '__otro' ? 'https://' : event.target.value })}>
                  {options.map((option) => <option key={option.href} value={option.href}>{option.label}</option>)}
                  <option value="__otro">Otro enlace (escribir)…</option>
                </select>
              </label>
            </div>
            {!known && <label className="admin-field"><span className="admin-label">Dirección del enlace</span><input value={item.href} onChange={(event) => set(index, { href: event.target.value })} placeholder="https://…" /></label>}
            <div className="menu-actions">
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Subir">↑</button>
              <button type="button" onClick={() => move(index, 1)} disabled={index === value.length - 1} aria-label="Bajar">↓</button>
              <button type="button" className="danger" onClick={() => onChange(value.filter((_, i) => i !== index))}>🗑️ <span>Quitar</span></button>
            </div>
          </div>
        )
      })}
      <button type="button" className="content-add" onClick={() => onChange([...value, { label: 'Nuevo enlace', href: '/promociones' }])}>＋ Agregar enlace</button>
    </div>
  )
}

function ListField({ field, value, onChange }: { field: FieldSpec; value: Values[]; onChange: (value: Values[]) => void }) {
  const set = (index: number, key: string, text: string) => onChange(value.map((item, i) => (i === index ? { ...item, [key]: text } : item)))
  const move = (index: number, delta: number) => {
    const next = [...value]
    const [item] = next.splice(index, 1)
    next.splice(index + delta, 0, item!)
    onChange(next)
  }
  const empty = Object.fromEntries((field.itemFields ?? []).map((item) => [item.key, '']))
  return (
    <div className="content-list">
      {value.map((item, index) => (
        <div className="content-item" key={index}>
          {(field.itemFields ?? []).map((sub) => (
            <label className="admin-field" key={sub.key}>
              <span className="admin-label">{sub.label}</span>
              {sub.type === 'textarea'
                ? <textarea rows={3} value={String(item[sub.key] ?? '')} onChange={(event) => set(index, sub.key, event.target.value)} />
                : <input value={String(item[sub.key] ?? '')} onChange={(event) => set(index, sub.key, event.target.value)} />}
            </label>
          ))}
          <div className="menu-actions">
            <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Subir">↑</button>
            <button type="button" onClick={() => move(index, 1)} disabled={index === value.length - 1} aria-label="Bajar">↓</button>
            <button type="button" className="danger" onClick={() => onChange(value.filter((_, i) => i !== index))}>🗑️ <span>Quitar</span></button>
          </div>
        </div>
      ))}
      <button type="button" className="content-add" onClick={() => onChange([...value, empty])}>＋ Agregar {field.itemName ?? 'elemento'}</button>
    </div>
  )
}

function SectionEditor({ spec, initial, options, onClose, onSave }: { spec: SectionSpec; initial: Values; options: Option[]; onClose: () => void; onSave: (values: Values) => Promise<void> }) {
  const [values, setValues] = useState<Values>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (key: string, value: unknown) => setValues((current) => ({ ...current, [key]: value }))

  const uploadImage = async (key: string, file: File | undefined) => {
    if (!file) return
    setError('')
    setSaving(true)
    try { set(key, await uploadSiteImage(await compressImage(file))) } catch (caught) { setError(caught instanceof Error ? caught.message : 'No pudimos subir la imagen.') } finally { setSaving(false) }
  }

  const submit = async () => {
    setSaving(true)
    setError('')
    try { await onSave(values) } catch (caught) { setError(caught instanceof Error ? caught.message : 'No pudimos guardar.'); setSaving(false) }
  }

  const restore = () => {
    if (window.confirm('¿Volver a los textos originales de esta sección? (Se aplicará al guardar)')) setValues(structuredClone(defaultSiteContent[spec.id]) as unknown as Values)
  }

  return (
    <div className="admin-sheet" role="dialog" aria-modal="true" aria-labelledby="contentEditorTitle">
      <div className="admin-sheet-inner">
        <header className="admin-sheet-header">
          <button type="button" className="admin-back" onClick={onClose}>← Volver</button>
          <h2 id="contentEditorTitle">{spec.title}</h2>
        </header>
        <p className="content-desc">{spec.description}</p>
        {spec.fields.map((field) => (
          <div className="admin-field" key={field.key}>
            <span className="admin-label">{field.label}</span>
            {field.hint && <small className="content-hint">{field.hint}</small>}
            {field.type === 'text' && <input value={String(values[field.key] ?? '')} onChange={(event) => set(field.key, event.target.value)} />}
            {field.type === 'textarea' && <textarea rows={4} value={String(values[field.key] ?? '')} onChange={(event) => set(field.key, event.target.value)} />}
            {field.type === 'links' && <LinksField value={(values[field.key] as LinkItem[]) ?? []} onChange={(value) => set(field.key, value)} options={options} />}
            {field.type === 'list' && <ListField field={field} value={(values[field.key] as Values[]) ?? []} onChange={(value) => set(field.key, value)} />}
            {field.type === 'image' && (
              <>
                {values[field.key] ? <div className="admin-media-preview"><img src={promoMediaPublicUrl(String(values[field.key]))} alt="" /></div> : null}
                <div className="admin-inline-actions">
                  <label className="admin-photo-add wide"><input type="file" accept="image/*" onChange={(event) => void uploadImage(field.key, event.target.files?.[0])} /><span aria-hidden="true">🖼️</span>{values[field.key] ? 'Cambiar imagen' : 'Subir imagen'}</label>
                  {values[field.key] ? <button type="button" className="btn btn-outline" onClick={() => set(field.key, '')}>Quitar imagen</button> : null}
                </div>
              </>
            )}
          </div>
        ))}
        <button type="button" className="link-button content-restore" onClick={restore}>Restaurar textos originales</button>
        {error && <p className="admin-error" role="alert">{error}</p>}
        <footer className="admin-sheet-footer">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={() => void submit()} disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
        </footer>
      </div>
    </div>
  )
}

export function ContentAdmin({ notify }: { notify: (message: string) => void }) {
  const [content, setContent] = useState<SiteContent | null>(null)
  const [options, setOptions] = useState<Option[]>(fixedLinks)
  const [editing, setEditing] = useState<SectionSpec | null>(null)
  const setSiteContent = useSetSiteContent()

  useEffect(() => {
    fetchSiteContent().then(setContent).catch(() => setContent(defaultSiteContent))
    Promise.all([listMenus(), listAdminPages()]).then(([{ menus }, pages]) => {
      setOptions([
        ...fixedLinks,
        ...menus.filter((menu) => menu.active).map((menu) => ({ label: `Menú: ${menu.name}`, href: `/categoria/${menu.slug}` })),
        ...pages.filter((page) => page.published).map((page) => ({ label: `Página: ${page.title}`, href: `/pagina/${page.slug}` })),
      ])
    }).catch(() => undefined)
  }, [])

  const save = async (spec: SectionSpec, values: Values) => {
    if (!content) return
    const next = { ...content, [spec.id]: values } as SiteContent
    await saveSiteContent(next)
    setContent(next)
    setSiteContent(next)
    setEditing(null)
    notify('Cambios guardados ✅ Ya se ven en la tienda.')
  }

  const sections = useMemo(() => contentSections, [])

  return (
    <section aria-labelledby="contentTitle">
      <div className="admin-section-head"><div><h2 id="contentTitle">Contenido del sitio</h2><p>Cambia los textos de la portada, el menú principal y el pie de página.</p></div></div>
      {!content ? <p className="admin-empty">Cargando…</p> : (
        <ul className="admin-list">
          {sections.map((spec) => (
            <li key={spec.id}>
              <button type="button" className="admin-item-main" onClick={() => setEditing(spec)}>
                <span className="admin-noimg">{spec.id === 'navigation' ? '🧭' : spec.id === 'footer' ? '📍' : spec.id === 'faq' ? '❓' : '📝'}</span>
                <span className="admin-item-text"><strong>{spec.title}</strong><small>{spec.description}</small></span>
              </button>
              <div className="admin-item-actions">
                <button type="button" onClick={() => setEditing(spec)}>✏️ Editar</button>
                <a href={spec.where} target="_blank" rel="noreferrer">🔗 Ver</a>
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing && content && (
        <SectionEditor
          spec={editing}
          initial={structuredClone(content[editing.id]) as unknown as Values}
          options={options}
          onClose={() => setEditing(null)}
          onSave={(values) => save(editing, values)}
        />
      )}
    </section>
  )
}
