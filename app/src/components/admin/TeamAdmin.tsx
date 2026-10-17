import { useEffect, useState, type FormEvent } from 'react'
import { grantAdmin, listAdmins, revokeAdmin } from '../../services/supabase/admin'

export function TeamAdmin({ notify, myEmail }: { notify: (message: string) => void; myEmail: string }) {
  const [admins, setAdmins] = useState<Array<{ email: string; has_logged_in: boolean }>>([])
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => { listAdmins().then(setAdmins).catch((caught: Error) => notify(caught.message)) }
  useEffect(load, []) // eslint-disable-line react-hooks/exhaustive-deps

  const add = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    try {
      await grantAdmin(email)
      notify(`Listo ✅ ${email.trim().toLowerCase()} ya puede entrar al panel con Google.`)
      setEmail('')
      load()
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : 'No se pudo agregar.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async (target: string) => {
    if (!window.confirm(`¿Quitar el acceso de ${target}?`)) return
    try {
      await revokeAdmin(target)
      notify('Acceso quitado.')
      load()
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : 'No se pudo quitar.')
    }
  }

  return (
    <section aria-labelledby="teamTitle">
      <div className="admin-section-head"><div><h2 id="teamTitle">Equipo</h2><p>Personas que pueden entrar a este panel con su cuenta de Google.</p></div></div>
      <form className="admin-team-form" onSubmit={(event) => void add(event)}>
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="correo@gmail.com" required aria-label="Correo de Google" />
        <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Agregando…' : 'Dar acceso'}</button>
      </form>
      <ul className="admin-team">
        {admins.map((admin) => (
          <li key={admin.email}>
            <span><strong>{admin.email}</strong><small>{admin.has_logged_in ? 'Ya entró al panel' : 'Aún no ha entrado'}</small></span>
            {admin.email !== myEmail.toLowerCase() && <button type="button" className="danger" onClick={() => void remove(admin.email)}>Quitar</button>}
          </li>
        ))}
      </ul>
    </section>
  )
}
