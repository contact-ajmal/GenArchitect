import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, Menu, Search, X } from 'lucide-react'
import clsx from 'clsx'
import { ARCHITECTURE_FAMILIES } from '../data/architectures'

/**
 * Stylized retrieval / graph-node glyph: a central query node linked out to
 * three retrieved document nodes. Rendered in the accent color.
 */
function GraphGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* edges from the central query node to the retrieved nodes */}
      <path d="M16 16 L6 7" />
      <path d="M16 16 L27 9" />
      <path d="M16 16 L9 26" />
      <path d="M16 16 L25 25" />
      {/* retrieved document nodes */}
      <circle cx="6" cy="7" r="2.4" />
      <circle cx="27" cy="9" r="2.4" />
      <circle cx="9" cy="26" r="2.4" />
      <circle cx="25" cy="25" r="2.4" />
      {/* central query node */}
      <circle cx="16" cy="16" r="3.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

type NavChild = { label: string; to: string; blurb: string }
type NavItem = {
  label: string
  to: string
  kind: 'route' | 'anchor'
  /** When present the item opens a menu instead of navigating. */
  children?: NavChild[]
}

const ARCHITECTURE_CHILDREN: NavChild[] = ARCHITECTURE_FAMILIES.map((f) => ({
  label: f.navLabel,
  to: `/catalog/${f.slug}`,
  blurb: f.blurb,
}))

const NAV_ITEMS: NavItem[] = [
  { label: 'Use case', to: '/use-case', kind: 'route' },
  { label: 'Architectures', to: '/catalog', kind: 'route', children: ARCHITECTURE_CHILDREN },
  { label: 'Compose', to: '/compose', kind: 'route' },
  { label: 'Strands', to: '/strands', kind: 'route' },
  { label: 'AgentCore', to: '/agentcore', kind: 'route' },
  { label: 'Notebooks', to: '/notebooks', kind: 'route' },
  { label: 'Videos', to: '/videos', kind: 'route' },
  { label: 'Latest', to: '/updates', kind: 'route' },
  { label: 'Case studies', to: '/use-cases', kind: 'route' },
]

function navLinkClass({ isActive }: { isActive: boolean }) {
  return clsx(
    'text-sm font-medium transition-colors hover:text-ink',
    isActive ? 'text-ink' : 'text-ink-muted',
  )
}

/**
 * Desktop nav item that opens a menu. Click to toggle; closes on Escape, on an
 * outside click, and whenever the route changes so it never survives a
 * navigation. The trigger is a button, not a link — it opens the menu rather
 * than going anywhere, which is what a disclosure control should do.
 */
function NavMenu({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const isActive = location.pathname.startsWith(item.to)

  useEffect(() => setOpen(false), [location.pathname])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={clsx(
          'inline-flex items-center gap-1 text-sm font-medium transition-colors hover:text-ink',
          isActive || open ? 'text-ink' : 'text-ink-muted',
        )}
      >
        {item.label}
        <ChevronDown
          className={clsx('h-3.5 w-3.5 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-hairline bg-neutral-0 shadow-lg"
        >
          {item.children?.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              role="menuitem"
              className={({ isActive: childActive }) =>
                clsx(
                  'block border-b border-hairline px-4 py-3 last:border-b-0 transition-colors hover:bg-neutral-100',
                  childActive && 'bg-neutral-50',
                )
              }
            >
              <span className="block text-sm font-medium text-ink">{child.label}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted line-clamp-2">
                {child.blurb}
              </span>
            </NavLink>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default function AppHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-[var(--header-height)] border-b border-hairline bg-neutral-0/85 backdrop-blur">
      <div className="mx-auto flex h-full max-w-content items-center justify-between px-4 sm:px-6">
        {/* Wordmark */}
        <Link
          to="/"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2.5"
          aria-label="GenArchitect home"
        >
          <GraphGlyph className="h-7 w-7 text-accent" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-bold tracking-tight text-ink">
              Gen<span className="text-accent">Architect</span>
            </span>
            <span className="mt-0.5 hidden font-mono text-[9px] uppercase tracking-[0.14em] text-ink-muted md:block">
              AWS agentic architecture studio
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Global search trigger */}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('open-search'))}
            aria-label="Search"
            className="inline-flex items-center gap-2 rounded-md border border-hairline px-2 py-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
          >
            <Search className="h-4 w-4" />
            <span className="hidden font-mono text-[11px] sm:inline">⌘K</span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-4 xl:flex">
            {NAV_ITEMS.map((item) =>
              item.children ? (
                <NavMenu key={item.to} item={item} />
              ) : item.kind === 'route' ? (
                <NavLink key={item.to} to={item.to} className={navLinkClass}>
                  {item.label}
                </NavLink>
              ) : (
                <a
                  key={item.to}
                  href={item.to}
                  className="text-sm font-medium text-ink-muted transition-colors hover:text-ink"
                >
                  {item.label}
                </a>
              ),
            )}
          </nav>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-soft hover:bg-neutral-100 xl:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu — collapses below the header */}
      {open && (
        <nav className="border-b border-hairline bg-neutral-0 px-4 pb-4 pt-2 xl:hidden">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                {item.children ? (
                  /* No dropdown on mobile — the sheet has room, so the
                     children sit inline under a section label. */
                  <>
                    <span className="block px-3 pb-1 pt-2 font-mono text-[11px] uppercase tracking-wide text-ink-muted">
                      {item.label}
                    </span>
                    <ul className="flex flex-col gap-1">
                      {item.children.map((child) => (
                        <li key={child.to}>
                          <NavLink
                            to={child.to}
                            onClick={() => setOpen(false)}
                            className={({ isActive }) =>
                              clsx(
                                'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                isActive
                                  ? 'bg-neutral-100 text-ink'
                                  : 'text-ink-muted hover:bg-neutral-100 hover:text-ink',
                              )
                            }
                          >
                            {child.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : item.kind === 'route' ? (
                  <NavLink
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-neutral-100 text-ink'
                          : 'text-ink-muted hover:bg-neutral-100 hover:text-ink',
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ) : (
                  <a
                    href={item.to}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-neutral-100 hover:text-ink"
                  >
                    {item.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
