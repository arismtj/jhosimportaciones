import { supabase } from '../../services/supabase/client'

function requireClient() {
  if (!supabase) throw new Error('Supabase todavía no está configurado.')
  return supabase
}

function getOAuthRedirectUrl(path = '/mi-cuenta') {
  return `${window.location.origin}${path}`
}

export async function signInWithGoogle(redirectPath = '/mi-cuenta') {
  const client = requireClient()
  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: getOAuthRedirectUrl(redirectPath) },
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
