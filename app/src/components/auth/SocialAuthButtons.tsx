import { useState } from 'react'
import { signInWithGoogle } from '../../features/auth/authActions'
import { useAuth } from '../../features/auth/AuthContext'

export function SocialAuthButtons() {
  const { configured } = useAuth()
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const authenticateWithGoogle = async () => {
    setError('')
    setPending(true)
    try {
      await signInWithGoogle()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo iniciar la autenticación.')
      setPending(false)
    }
  }

  return (
    <>
      <div className="social-auth">
        <button type="button" className="social-button google-button" disabled={!configured || pending} onClick={() => void authenticateWithGoogle()}><span aria-hidden="true">G</span>{pending ? 'Conectando con Google…' : 'Continuar con Google'}</button>
        <button type="button" className="social-button facebook-button" disabled aria-disabled="true"><span className="facebook-mark" aria-hidden="true">f</span>Facebook · Próximamente</button>
      </div>
      {!configured && <p className="auth-config-note" role="note">Google se habilitará al configurar las variables públicas de Supabase. No se crean sesiones simuladas.</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="auth-divider"><span>o usa tu correo</span></div>
    </>
  )
}
