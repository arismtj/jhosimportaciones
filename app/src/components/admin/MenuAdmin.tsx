import { useEffect, useState, type FormEvent } from 'react'
import { resetCategories } from '../../features/catalog/useCategories'
import {
  createMenu, deleteMenu, deletePage, listAdminPages, listMenus, reorderMenus, updateMenu,
  type MenuRow, type PageRow,
} from '../../services/supabase/admin'
import { resetMenuPages } from '../../services/supabase/pages'
import { PageEditor } from './PageEditor'

type NameDialog = { mode: 'new-menu' } | { mode: 'new-sub'; parent: MenuRow } | { mode: 'rename'; menu: MenuRow }

export function MenuAdmin({ notify }: { notify: (message: string) => void }) {
  const [menus, setMenus] = useState<MenuRow[]>([])
  const [pages, setPages] = useState<PageRow[]>([])
  const [counts, setCounts] = useState<Map<string, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const [dialog, setDialog] = useState<NameDialog | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [editingPage, setEditingPage] = useState<Partial<PageRow> | null>(null)

  const load = async () => {
    try {
      const [{ menus: rows, productCount }, pageRows] = await Promise.all([listMenus(), listAdminPages()])
      setMenus(rows)
      setCounts(productCount)
      setPages(pageRows)
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : 'No pudimos cargar el menú.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { void load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /** Ejecuta un cambio, avisa y refresca el menú de la tienda. */
  const run = async (action: () => Promise<void>, message: string) => {
    setBusy(true)
    try {
      await action()
      resetCategories()
      resetMenuPages()
      notify(message)
      await load()
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : 'No se pudo completar.')
    } finally {
      setBusy(false)
    }
  }

  const families = menus.filter((item) => item.parent_id === null)
  const childrenOf = (id: string) => menus.filter((item) => item.parent_id === id)
  const pagesIn = (menuId: string | null) => pages.filter((page) => page.menu_id === menuId)
  const totalOf = (family: MenuRow) => (counts.get(family.id) ?? 0) + childrenOf(family.id).reduce((sum, sub) => sum + (counts.get(sub.id) ?? 0), 0)

  const move = (list: MenuRow[], index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= list.length) return
    const next = [...list]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved!)
    void run(() => reorderMenus(next), 'Orden actualizado ✅')
  }

  const openDialog = (value: NameDialog) => {
    setName(value.mode === 'rename' ? value.menu.name : '')
    setDescription(value.mode === 'rename' ? value.menu.description ?? '' : '')
    setDialog(value)
  }

  const submitName = (event: FormEvent) => {
    event.preventDefault()
    if (!dialog || !name.trim()) return
    const current = dialog
    setDialog(null)
    if (current.mode === 'rename') void run(() => updateMenu(current.menu.id, current.menu.parent_id ? { name: name.trim() } : { name: name.trim(), description: description.trim() || null }), 'Cambios guardados ✅')
    else if (current.mode === 'new-menu') void run(() => createMenu(name, null, menus), `Menú «${name.trim()}» creado ✅ Ahora agrégale submenús.`)
    else void run(() => createMenu(name, current.parent.id, menus), `Submenú «${name.trim()}» creado ✅ Ya puedes asignarle productos.`)
  }

  const remove = (menu: MenuRow) => {
    if (!window.confirm(`¿Eliminar «${menu.name}» del menú?`)) return
    void run(() => deleteMenu(menu, menus, counts), 'Eliminado del menú.')
  }

  const removePage = (page: PageRow) => {
    if (!window.confirm(`¿Eliminar la página «${page.title}»?`)) return
    void run(() => deletePage(page), 'Página eliminada.')
  }

  const actions = (item: MenuRow, list: MenuRow[], index: number) => (
    <div className="menu-actions">
      <button type="button" onClick={() => move(list, index, -1)} disabled={busy || index === 0} aria-label={`Subir ${item.name}`}>↑</button>
      <button type="button" onClick={() => move(list, index, 1)} disabled={busy || index === list.length - 1} aria-label={`Bajar ${item.name}`}>↓</button>
      <button type="button" onClick={() => openDialog({ mode: 'rename', menu: item })} disabled={busy}>✏️ <span>Renombrar</span></button>
      <button type="button" onClick={() => void run(() => updateMenu(item.id, { active: !item.active }), item.active ? 'Oculto en la tienda.' : 'Visible en la tienda ✅')} disabled={busy}>{item.active ? '🙈 ' : '👁️ '}<span>{item.active ? 'Ocultar' : 'Mostrar'}</span></button>
      <button type="button" className="danger" onClick={() => remove(item)} disabled={busy} aria-label={`Eliminar ${item.name}`}>🗑️</button>
    </div>
  )

  const pageRows = (list: PageRow[]) => list.map((page) => (
    <li key={page.id} className={`menu-page${page.published ? '' : ' is-hidden'}`}>
      <span className="menu-name">📄 {page.title}{!page.published && <em className="b-hidden">Borrador</em>}</span>
      <div className="menu-actions">
        <a href={`/pagina/${page.slug}`} target="_blank" rel="noreferrer">🔗 <span>Ver</span></a>
        <button type="button" onClick={() => setEditingPage(page)}>✏️ <span>Editar</span></button>
        <button type="button" className="danger" onClick={() => removePage(page)} aria-label={`Eliminar página ${page.title}`}>🗑️</button>
      </div>
    </li>
  ))

  return (
    <section aria-labelledby="menuTitle">
      <div className="admin-section-head">
        <div><h2 id="menuTitle">Menú de la tienda</h2><p>Crea menús y submenús. Los productos se colocan en los submenús desde «Productos».</p></div>
        <div className="menu-head-buttons">
          <button type="button" className="btn btn-primary admin-new" onClick={() => openDialog({ mode: 'new-menu' })}>＋ Nuevo menú</button>
          <button type="button" className="btn btn-outline admin-new" onClick={() => setEditingPage({ menu_id: null, published: true })}>＋ Nueva página</button>
        </div>
      </div>

      {loading ? <p className="admin-empty">Cargando…</p> : (
        <div className="menu-tree">
          {families.map((family, index) => {
            const subs = childrenOf(family.id)
            return (
              <article key={family.id} className={`menu-card${family.active ? '' : ' is-hidden'}`}>
                <header className="menu-row menu-family">
                  <span className="menu-name"><strong>{family.name}</strong>{!family.active && <em className="b-hidden">Oculto</em>}<small>{totalOf(family)} productos</small></span>
                  {actions(family, families, index)}
                </header>
                <ul className="menu-subs">
                  {subs.map((sub, subIndex) => (
                    <li key={sub.id} className={`menu-row${sub.active ? '' : ' is-hidden'}`}>
                      <span className="menu-name">↳ {sub.name}{!sub.active && <em className="b-hidden">Oculto</em>}<small>{counts.get(sub.id) ?? 0} productos</small></span>
                      {actions(sub, subs, subIndex)}
                    </li>
                  ))}
                  {pageRows(pagesIn(family.id))}
                  {!subs.length && !pagesIn(family.id).length && <li className="menu-hint">Este menú aún está vacío. Agrégale un submenú para poner productos.</li>}
                </ul>
                <footer className="menu-card-footer">
                  <button type="button" onClick={() => openDialog({ mode: 'new-sub', parent: family })} disabled={busy}>＋ Submenú</button>
                  <button type="button" onClick={() => setEditingPage({ menu_id: family.id, published: true })} disabled={busy}>＋ Página aquí</button>
                </footer>
              </article>
            )
          })}
          <article className="menu-card">
            <header className="menu-row menu-family"><span className="menu-name"><strong>Barra principal</strong><small>Páginas sueltas junto a «Promociones»</small></span></header>
            <ul className="menu-subs">
              {pageRows(pagesIn(null))}
              {!pagesIn(null).length && <li className="menu-hint">Sin páginas. Ej.: «Nosotros», «Envíos a provincia».</li>}
            </ul>
          </article>
        </div>
      )}

      {dialog && (
        <div className="admin-dialog-backdrop" role="dialog" aria-modal="true" aria-labelledby="nameDialogTitle">
          <form className="admin-dialog" onSubmit={submitName}>
            <h3 id="nameDialogTitle">{dialog.mode === 'rename' ? 'Editar menú' : dialog.mode === 'new-menu' ? 'Nuevo menú' : `Nuevo submenú en «${dialog.parent.name}»`}</h3>
            <input autoFocus value={name} maxLength={60} onChange={(event) => setName(event.target.value)} placeholder={dialog.mode === 'new-menu' ? 'Ej.: Día de la Madre' : 'Ej.: Cajas sorpresa'} required />
            {dialog.mode === 'rename' && !dialog.menu.parent_id && (
              <label className="admin-field"><span className="admin-label">Frase de la tarjeta en la portada <small>puedes empezar con un emoji</small></span><input value={description} maxLength={80} onChange={(event) => setDescription(event.target.value)} placeholder="Ej.: 💐 Regalos para mamá" /></label>
            )}
            <div className="admin-dialog-actions">
              <button type="button" className="btn btn-outline" onClick={() => setDialog(null)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      )}

      {editingPage && (
        <PageEditor
          page={editingPage}
          menus={families}
          allPages={pages}
          onClose={() => setEditingPage(null)}
          onSaved={() => { setEditingPage(null); resetMenuPages(); notify('Página guardada ✅'); void load() }}
        />
      )}
    </section>
  )
}
