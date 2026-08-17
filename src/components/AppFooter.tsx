import { Link } from 'react-router-dom'

const NAV = [
  { label: 'Use case', to: '/use-case' },
  { label: 'Catalog', to: '/catalog' },
  { label: 'Build', to: '/build' },
  { label: 'Failure modes', to: '/failure-modes' },
  { label: 'Security', to: '/security' },
  { label: 'Evaluate', to: '/evaluate' },
  { label: 'Playground', to: '/playground' },
  { label: 'About accuracy', to: '/accuracy' },
  { label: 'About', to: '/#about' },
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
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              An independent educational field guide to RAG architectures on
              Amazon Bedrock AgentCore and the Strands Agents SDK. Not affiliated
              with, sponsored by, or endorsed by Amazon Web Services. Code
              samples are reference implementations — verify against current AWS
              documentation.
            </p>
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
