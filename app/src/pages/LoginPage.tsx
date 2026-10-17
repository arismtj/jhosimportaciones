import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/auth/AuthShell'
import { SocialAuthButtons } from '../components/auth/SocialAuthButtons'
import { signInWithEmail } from '../features/auth/authActions'
import { useAuth } from '../features/auth/AuthContext'

export function LoginPage() {
  const { configured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      await signInWithEmail(email, password)
      const destination = (location.state as { from?: string } | null)?.from ?? '/mi-cuenta'
      navigate(destination, { replace: true })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo iniciar sesión.')
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthShell eyebrow="QUÉ GUSTO VERTE" title="Inicia sesión" subtitle="Guarda tus datos y revisa tus pedidos cuando la tienda esté conectada." alternateText="¿Aún no tienes una cuenta?" alternateLabel="Regístrate" alternateTo="/registro">
      <SocialAuthButtons />
      <form className="auth-form" onSubmit={(event) => void submit(event)}>
        <label>Correo electrónico<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@correo.com" /></label>
        <label>Contraseña<input type="password" autoComplete="current-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Tu contraseña" /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary auth-submit" type="submit" disabled={!configured || pending}>{pending ? 'Ingresando…' : 'Ingresar'}</button>
      </form>
    </AuthShell>
  )
}
