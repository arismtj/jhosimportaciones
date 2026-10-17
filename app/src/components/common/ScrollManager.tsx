import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function ScrollManager() {
  const { pathname, hash } = useLocation()

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
