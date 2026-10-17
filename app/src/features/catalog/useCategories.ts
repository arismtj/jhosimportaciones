import { useCallback, useEffect, useState } from 'react'
import { getCategories, type CatalogCategory } from '../../services/supabase/catalog'

let cache: Promise<CatalogCategory[]> | null = null

function load(force = false) {
  if (!cache || force) {
    cache = getCategories().catch((reason: unknown) => {
      cache = null
      throw reason
    })
  }
  return cache
}

/** Olvida el menú guardado para que se vuelva a pedir (tras editarlo en el panel). */
export function resetCategories() {
  cache = null
}

export const familyOrder = new Map([
  ['importaciones', 0],
  ['detalles', 1],
  ['sublimacion', 2],
])

export function useCategories() {
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    load(version > 0)
      .then((data) => {
        if (!active) return
        setCategories(data)
        setError('')
        setLoaded(true)
      })
      .catch((reason: unknown) => {
        if (!active) return
        setError(reason instanceof Error ? reason.message : 'No se pudieron cargar las categorías.')
        setLoaded(true)
      })
    return () => { active = false }
  }, [version])

  // El orden viene de la base de datos (sort_order), editable desde el panel
  const families = categories.filter((category) => category.parent_id === null)
  const subcategoriesOf = (familyId: string) => categories.filter((category) => category.parent_id === familyId)
  const reload = useCallback(() => {
    setLoaded(false)
    setVersion((current) => current + 1)
  }, [])

  return { categories, families, subcategoriesOf, loaded, error, reload }
}
