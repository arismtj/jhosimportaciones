import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCategories } from '../../features/catalog/useCategories'
import { useMenuPages } from '../../features/catalog/useMenuPages'
import { useSiteContent } from '../../features/content/SiteContentContext'
import { SmartLink } from '../common/SmartLink'

// Las preguntas frecuentes cuentan como parte de «Cómo comprar»
const spiedSections = ['catalogo', 'pagos', 'ayuda', 'redes', 'preguntas']
const sectionAlias: Record<string, string> = { preguntas: 'ayuda' }

/** Devuelve el id de la sección que está bajo la barra fija, o null si ninguna. */
function useActiveSection(enabled: boolean) {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setActive(null)
      return
    }
    let frame = 0
    const update = () => {
      frame = 0
      const header = document.querySelector('.site-header')
      const line = (header?.getBoundingClientRect().bottom ?? 0) + 80
      let current: string | null = null
      for (const id of spiedSections) {
        const rect = document.getElementById(id)?.getBoundingClientRect()
        if (rect && rect.top <= line && rect.bottom > line) current = id
      }
      setActive(current ? sectionAlias[current] ?? current : null)
    }
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [enabled])

  return active
}

function isChristmasSeason(date = new Date()) {
  return date.getMonth() >= 9 // octubre a diciembre
}

interface StoreNavProps {
  /** Filtro activo del catálogo de la portada (slug de familia o subcategoría, o 'todos') */
  filter?: string
  /** En la portada filtra el catálogo sin cambiar de página; en otras páginas los enlaces navegan */
  onSelect?: (slug: string) => void
}

export function StoreNav({ filter = 'todos', onSelect }: StoreNavProps) {
  const { families, subcategoriesOf, categories } = useCategories()
  const menuPages = useMenuPages()
  const { navigation } = useSiteContent()
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const navRef = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  const isHome = Boolean(onSelect)
  const activeSection = useActiveSection(isHome)
  const inCatalog = activeSection === 'catalogo'
  const pageSlug = pathname.startsWith('/categoria/') ? decodeURIComponent(pathname.split('/')[2] ?? '') : null
  const currentSlug = isHome ? (inCatalog ? filter : null) : pageSlug
  const current = categories.find((category) => category.slug === currentSlug)
  const activeFamily = current?.parent_id ? categories.find((category) => category.id === current.parent_id)?.slug : current?.slug

  useEffect(() => {
    if (!openMenu) return
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !navRef.current?.contains(event.target as Node)) setOpenMenu(null)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [openMenu])

  useEffect(() => { setOpenMenu(null) }, [pathname])

  /** Cada menú abre su propia página (/categoria/…), mejor para Google. Solo «Todo el catálogo» filtra en la portada. */
  const select = (slug: string) => (event: ReactMouseEvent) => {
    setOpenMenu(null)
    if (slug !== 'todos' || !onSelect || event.metaKey || event.ctrlKey || event.shiftKey) return
    event.preventDefault()
    onSelect(slug)
    window.requestAnimationFrame(() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' }))
  }

  const sectionHref = (hash: string) => (isHome ? hash : `/${hash}`)
  const allActive = isHome ? inCatalog && filter === 'todos' : false

  return (
    <nav className="store-nav" aria-label="Secciones de la tienda" ref={navRef}>
      <div className="wrap store-nav-inner">
        <div className="store-nav-groups">
          <Link to="/#catalogo" className={allActive ? 'active' : ''} aria-current={allActive ? 'true' : undefined} onClick={select('todos')}>Todo el catálogo</Link>
          {families.map((family) => {
            const subcategories = subcategoriesOf(family.id)
            const familyPages = menuPages.filter((page) => page.menu_id === family.id)
            const isOpen = openMenu === family.slug
            const isActive = activeFamily === family.slug
            return (
              <div
                className={`store-nav-item${isOpen ? ' open' : ''}`}
                key={family.id}
                onMouseEnter={() => setOpenMenu(family.slug)}
                onMouseLeave={() => setOpenMenu((value) => (value === family.slug ? null : value))}
              >
                <Link
                  to={`/categoria/${family.slug}`}
                  className={isActive ? 'active' : ''}
                  aria-current={isActive ? 'true' : undefined}
                  aria-haspopup="true"
                  aria-expanded={isOpen}
                  onClick={select(family.slug)}
                  onKeyDown={(event) => { if (event.key === 'ArrowDown') { event.preventDefault(); setOpenMenu(family.slug) } }}
                >
                  {family.name}<span className="store-nav-caret" aria-hidden="true">▾</span>
                </Link>
                {(subcategories.length > 0 || familyPages.length > 0) && (
                  <div className="store-submenu" aria-label={`Subcategorías de ${family.name}`}>
                    <Link to={`/categoria/${family.slug}`} className={currentSlug === family.slug ? 'active' : ''} onClick={select(family.slug)}>Todo {family.name}</Link>
                    {subcategories.map((sub) => (
                      <Link key={sub.id} to={`/categoria/${sub.slug}`} className={currentSlug === sub.slug ? 'active' : ''} onClick={select(sub.slug)}>{sub.name}</Link>
                    ))}
                    {familyPages.map((page) => (
                      <Link key={page.id} to={`/pagina/${page.slug}`} className={pathname === `/pagina/${page.slug}` ? 'active' : ''}>{page.title}</Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="store-nav-links">
          {isChristmasSeason() && <Link to="/regalos-navidad" className={`store-nav-promo${pathname === '/regalos-navidad' ? ' active' : ''}`}>🎄 Navidad</Link>}
          {menuPages.filter((page) => !page.menu_id).map((page) => (
            <Link key={page.id} to={`/pagina/${page.slug}`} className={pathname === `/pagina/${page.slug}` ? 'active' : ''}>{page.title}</Link>
          ))}
          {navigation.store.map((link) => {
            const hash = link.href.split('#')[1]
            const href = hash && link.href.startsWith('/#') ? sectionHref(`#${hash}`) : link.href
            const active = hash ? activeSection === hash : pathname === link.href
            const promo = link.href === '/promociones' || link.href === '/regalos-navidad'
            return <SmartLink key={`${link.label}${link.href}`} href={href} className={`${promo ? 'store-nav-promo' : ''}${active ? ' active' : ''}`.trim() || undefined}>{link.label}</SmartLink>
          })}
        </div>
      </div>
    </nav>
  )
}
