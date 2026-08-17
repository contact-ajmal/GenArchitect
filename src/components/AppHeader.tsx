import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import clsx from 'clsx'

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

type NavItem = { label: string; to: string; kind: 'route' | 'anchor' }

const NAV_ITEMS: NavItem[] = [
  { label: 'Use case', to: '/use-case', kind: 'route' },
  { label: 'Diagnose', to: '/diagnose', kind: 'route' },
  { label: 'Catalog', to: '/catalog', kind: 'route' },
  { label: 'Compose', to: '/compose', kind: 'route' },
  { label: 'Notebooks', to: '/notebooks', kind: 'route' },
  { label: 'Strands', to: '/strands', kind: 'route' },
  { label: 'AgentCore', to: '/agentcore', kind: 'route' },
  { label: 'Build', to: '/build', kind: 'route' },
  { label: 'About', to: '/#about', kind: 'anchor' },
]

function navLinkClass({ isActive }: { isActive: boolean }) {
  return clsx(
    'text-sm font-medium transition-colors hover:text-ink',
    isActive ? 'text-ink' : 'text-ink-muted',
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
          <span className="font-display text-lg font-bold tracking-tight text-ink">
            Gen<span className="text-accent">Architect</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-4 xl:flex">
          {NAV_ITEMS.map((item) =>
            item.kind === 'route' ? (
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

      {/* Mobile menu — collapses below the header */}
      {open && (
        <nav className="border-b border-hairline bg-neutral-0 px-4 pb-4 pt-2 xl:hidden">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                {item.kind === 'route' ? (
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
