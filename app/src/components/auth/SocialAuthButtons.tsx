import { useState } from 'react'
import { signInWithOAuth } from '../../features/auth/authActions'
import { useAuth } from '../../features/auth/AuthContext'

export function SocialAuthButtons() {
  const { configured } = useAuth()
  const [error, setError] = useState('')
  const [pending, setPending] = useState<'google' | 'facebook' | null>(null)

  const authenticate = async (provider: 'google' | 'facebook') => {
    setError('')
    setPending(provider)
    try {
      await signInWithOAuth(provider)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo iniciar la autenticación.')
      setPending(null)
    }
  }

  return (
    <>
      <div className="social-auth">
        <button type="button" className="social-button" disabled={!configured || pending !== null} onClick={() => void authenticate('google')}><span aria-hidden="true">G</span>{pending === 'google' ? 'Conectando…' : 'Continuar con Google'}</button>
        <button type="button" className="social-button" disabled={!configured || pending !== null} onClick={() => void authenticate('facebook')}><span className="facebook-mark" aria-hidden="true">f</span>{pending === 'facebook' ? 'Conectando…' : 'Continuar con Facebook'}</button>
      </div>
      {!configured && <p className="auth-config-note" role="note">La autenticación se habilitará al configurar Supabase y los proveedores sociales. No se crean sesiones simuladas.</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="auth-divider"><span>o usa tu correo</span></div>
    </>
  )
}
