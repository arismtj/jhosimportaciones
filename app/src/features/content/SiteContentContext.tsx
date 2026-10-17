import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { defaultSiteContent, mergeSiteContent, type SiteContent } from '../../config/siteContent'
import { isSupabaseConfigured, requireSupabase } from '../../services/supabase/client'

const SiteContentContext = createContext<{ content: SiteContent; setContent: (value: SiteContent) => void }>({
  content: defaultSiteContent,
  setContent: () => undefined,
})

export async function fetchSiteContent(): Promise<SiteContent> {
  if (!isSupabaseConfigured) return defaultSiteContent
  const { data, error } = await requireSupabase().from('site_content').select('value').eq('key', 'main').maybeSingle()
  if (error) throw error
  return mergeSiteContent(data?.value)
}

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(defaultSiteContent)
  useEffect(() => {
    let active = true
    fetchSiteContent().then((value) => { if (active) setContent(value) }).catch(() => undefined)
    return () => { active = false }
  }, [])
  return <SiteContentContext.Provider value={{ content, setContent }}>{children}</SiteContentContext.Provider>
}

/** Textos del sitio: valores por defecto mientras carga y los editados en el panel después. */
export function useSiteContent() {
  return useContext(SiteContentContext).content
}

export function useSetSiteContent() {
  return useContext(SiteContentContext).setContent
}
