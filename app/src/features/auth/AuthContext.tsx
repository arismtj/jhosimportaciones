import type { Session, User } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { isSupabaseConfigured, supabase } from '../../services/supabase/client'
import type { Database } from '../../types/database'

export type UserRole = Database['public']['Enums']['user_role']

interface AuthContextValue {
  configured: boolean
  loading: boolean
  session: Session | null
  user: User | null
  displayName: string
  email: string
  role: UserRole | null
  error: string | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function displayNameFromUser(user: User | null) {
  if (!user) return ''
  const metadata = user.user_metadata
  const name = metadata?.full_name ?? metadata?.name ?? metadata?.display_name
  if (typeof name === 'string' && name.trim()) return name.trim()
  return user.email?.split('@')[0] ?? 'Cliente JHOS'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured)
  const [profileLoading, setProfileLoading] = useState(false)
  const [role, setRole] = useState<UserRole | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false)
      return
    }

    let active = true
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (active) {
        setProfileLoading(Boolean(data.session?.user))
        setSession(data.session)
        setError(sessionError?.message ?? null)
        setAuthLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setProfileLoading(Boolean(nextSession?.user))
      setSession(nextSession)
      setRole(null)
      setError(null)
      setAuthLoading(false)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session?.user || !supabase) {
      setRole(null)
      setProfileLoading(false)
      return
    }

    let active = true
    void supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data, error: profileError }) => {
        if (!active) return
        setRole(data?.role ?? 'customer')
        setError(profileError?.message ?? null)
        setProfileLoading(false)
      })

    return () => {
      active = false
    }
  }, [session?.user])

  const value = useMemo<AuthContextValue>(
    () => ({
      configured: isSupabaseConfigured,
      loading: authLoading || profileLoading,
      session,
      user: session?.user ?? null,
      displayName: displayNameFromUser(session?.user ?? null),
      email: session?.user.email ?? '',
      role,
      error,
      signOut: async () => {
        if (!supabase) return
        const { error: signOutError } = await supabase.auth.signOut()
        if (signOutError) throw signOutError
      },
    }),
    [authLoading, error, profileLoading, role, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
