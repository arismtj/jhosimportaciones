import type { Provider } from '@supabase/supabase-js'
import { supabase } from '../../services/supabase/client'

function requireClient() {
  if (!supabase) throw new Error('Supabase todavía no está configurado.')
  return supabase
}

export async function signInWithOAuth(provider: Extract<Provider, 'google' | 'facebook'>) {
  const client = requireClient()
  const { error } = await client.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${window.location.origin}/mi-cuenta` },
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
