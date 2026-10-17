import { useState, type FormEvent } from 'react'
import { AuthShell } from '../components/auth/AuthShell'
import { SocialAuthButtons } from '../components/auth/SocialAuthButtons'
import { registerWithEmail } from '../features/auth/authActions'
import { useAuth } from '../features/auth/AuthContext'

export function RegisterPage() {
  const { configured } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setPending(true)
    setError('')
    setMessage('')
    try {
      await registerWithEmail(email, password)
      setMessage('Revisa tu correo para confirmar el registro.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo completar el registro.')
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthShell eyebrow="CREA TU CUENTA" title="Regístrate" subtitle="Prepárate para guardar favoritos, direcciones y el historial de tus pedidos." alternateText="¿Ya tienes una cuenta?" alternateLabel="Inicia sesión" alternateTo="/iniciar-sesion">
      <SocialAuthButtons />
      <form className="auth-form" onSubmit={(event) => void submit(event)}>
        <label>Correo electrónico<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@correo.com" /></label>
        <label>Contraseña<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 8 caracteres" /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        {message && <p className="form-success" role="status">{message}</p>}
        <button className="btn btn-primary auth-submit" type="submit" disabled={!configured || pending}>{pending ? 'Creando cuenta…' : 'Crear cuenta'}</button>
      </form>
    </AuthShell>
  )
}
