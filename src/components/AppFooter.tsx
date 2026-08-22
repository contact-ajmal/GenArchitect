import { Link } from 'react-router-dom'
import { Github, Globe, Linkedin } from 'lucide-react'
import { BRAND } from '../config/brand'

const NAV = [
  { label: 'Use case', to: '/use-case' },
  { label: 'RAG architectures', to: '/catalog/rag' },
  { label: 'Agentic data architectures', to: '/catalog/agentic-data' },
  { label: 'Retrieval atlas', to: '/retrieval' },
  { label: 'Review', to: '/review' },
  { label: 'Build', to: '/build' },
  { label: 'Failure modes', to: '/failure-modes' },
  { label: 'Security', to: '/security' },
  { label: 'Evaluate', to: '/evaluate' },
  { label: 'Playground', to: '/playground' },
  { label: 'About accuracy', to: '/accuracy' },
]

export default function AppFooter() {
  return (
    <footer className="mt-20 border-t border-hairline">
      <div className="mx-auto max-w-content px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md">
            <div className="flex items-center gap-2">
              <svg
                viewBox="0 0 32 32"
                className="h-5 w-5 text-accent"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M16 16 L6 7" />
                <path d="M16 16 L27 9" />
                <path d="M16 16 L9 26" />
                <path d="M16 16 L25 25" />
                <circle cx="6" cy="7" r="2.4" />
                <circle cx="27" cy="9" r="2.4" />
                <circle cx="9" cy="26" r="2.4" />
                <circle cx="25" cy="25" r="2.4" />
                <circle cx="16" cy="16" r="3.4" fill="currentColor" stroke="none" />
              </svg>
              <span className="font-display text-base font-bold tracking-tight text-ink">
                Gen<span className="text-accent">Architect</span>
              </span>
            </div>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
              {BRAND.tagline}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              {BRAND.disclaimer}
            </p>

            <div className="mt-5 flex items-center gap-3 text-sm text-ink-muted">
              <span>
                Built by{' '}
                <span className="font-medium text-ink">Ajmal Baba</span>
              </span>
              <a
                href="https://ajmalbaba-portfolio.pages.dev/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Ajmal Baba's portfolio website"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-hairline text-ink-muted transition-colors hover:text-ink hover:border-ink/30 focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Globe className="h-4 w-4" />
              </a>
              <a
                href="https://github.com/contact-ajmal"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Ajmal Baba on GitHub"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-hairline text-ink-muted transition-colors hover:text-ink hover:border-ink/30 focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://www.linkedin.com/in/ajmalnazirbaba/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Ajmal Baba on LinkedIn"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-hairline text-ink-muted transition-colors hover:text-ink hover:border-ink/30 focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          <nav aria-label="Footer" className="flex flex-col gap-2">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-sm text-ink-muted transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="mt-10 font-mono text-[11px] uppercase tracking-wide text-ink-muted">
          GenArchitect · educational reference · verify against current AWS docs
        </p>
      </div>
    </footer>
  )
}
