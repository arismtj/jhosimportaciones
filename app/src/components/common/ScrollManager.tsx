import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { initAnalytics, trackPageview } from '../../services/analytics'

export function ScrollManager() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    initAnalytics()
  }, [])

  useEffect(() => {
    // Espera a que la página actualice su título antes de registrar la visita
    const timeout = window.setTimeout(() => trackPageview(pathname), 400)
    return () => window.clearTimeout(timeout)
  }, [pathname])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (hash) {
        document.getElementById(hash.slice(1))?.scrollIntoView()
      } else {
        window.scrollTo({ top: 0, left: 0 })
      }
    })
    return () => window.cancelAnimationFrame(frame)
  }, [hash, pathname])

  return null
}
