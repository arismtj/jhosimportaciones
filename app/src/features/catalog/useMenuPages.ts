import { useEffect, useState } from 'react'
import { getMenuPages, type MenuPage } from '../../services/supabase/pages'

/** Páginas de contenido publicadas, para colocarlas en el menú. */
export function useMenuPages() {
  const [pages, setPages] = useState<MenuPage[]>([])
  useEffect(() => {
    let active = true
    void getMenuPages().then((data) => { if (active) setPages(data) })
    return () => { active = false }
  }, [])
  return pages
}
