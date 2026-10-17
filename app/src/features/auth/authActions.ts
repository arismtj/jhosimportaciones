import { supabase } from '../../services/supabase/client'

function requireClient() {
  if (!supabase) throw new Error('Supabase todavía no está configurado.')
  return supabase
}

function getOAuthRedirectUrl() {
  const isLocalDevelopment =
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
    window.location.port === '5173'

  return isLocalDevelopment
    ? 'http://localhost:5173/mi-cuenta'
    : `${window.location.origin}/mi-cuenta`
}

export async function signInWithGoogle() {
  const client = requireClient()
  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: getOAuthRedirectUrl() },
  })
  if (error) throw error
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await requireClient().auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function registerWithEmail(email: string, password: string) {
  const { error } = await requireClient().auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${window.location.origin}/mi-cuenta` },
  })
  if (error) throw error
}
