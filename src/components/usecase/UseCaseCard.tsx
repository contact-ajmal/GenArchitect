import { ArrowUpRight, Building2, Layers, ShieldCheck, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import type { ReactNode } from 'react'
import type { UseCaseEntry } from '../../types'
import { INDUSTRY_LABELS } from '../../lib/usecases'
import { hasDeepDive } from '../../data/caseStudies'

export interface UseCaseCardProps {
  useCase: UseCaseEntry
  compact?: boolean
}

const SHELL =
  'group flex h-full flex-col rounded-xl border border-hairline bg-neutral-0 p-4 transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-accent'

/**
 * A real-world use case as a card. Normally links out to the original public
 * source — we never reproduce full case-study text, only our short summary +
 * facts. Where a deep dive exists it links inward to that instead, since the
 * deep dive carries the source links itself.
 */
export default function UseCaseCard({ useCase: u, compact }: UseCaseCardProps) {
  const deep = hasDeepDive(u.id)

  // Held as an element, not a component defined during render — a component
  // declared inline gets a new identity every render and remounts the subtree.
  const body: ReactNode = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-ink-muted">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            {INDUSTRY_LABELS[u.industry]}
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-ink">{u.company}</p>
        </div>
        {u.trustTier === 'official' ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded bg-navy/90 px-1.5 py-0.5 text-[10px] font-medium text-neutral-0">
            <ShieldCheck className="h-3 w-3 text-signal" />
            AWS
          </span>
        ) : null}
      </div>

      <p className="mt-3 font-medium leading-snug text-ink">{u.title}</p>
      {!compact ? (
        <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-ink-soft">{u.summary}</p>
      ) : null}

      {u.metric ? (
        <p className="mt-3 flex items-start gap-1.5 text-xs font-medium text-accent-strong">
          <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {u.metric}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-1">
        {u.agentPattern ? (
          <span className="rounded-full bg-navy/10 px-2 py-0.5 font-mono text-[10px] text-navy">
            {u.agentPattern}
          </span>
        ) : null}
        {u.services.slice(0, compact ? 2 : 3).map((s) => (
          <span key={s} className="rounded-full bg-neutral-100 px-2 py-0.5 font-mono text-[10px] text-ink-muted">
            {s}
          </span>
        ))}
      </div>

      <span
        className={clsx(
          'mt-3 inline-flex items-center gap-1 text-xs font-medium transition-colors group-hover:text-accent-strong',
          'pt-2',
          deep ? 'text-accent-strong' : 'text-ink-muted',
        )}
      >
        {deep ? (
          <>
            <Layers className="h-3.5 w-3.5" />
            Architecture deep dive
          </>
        ) : (
          <>
            {u.sourceName}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </>
        )}
      </span>
    </>
  )

  return deep ? (
    <Link to={`/use-cases/${u.id}`} className={SHELL}>
      {body}
    </Link>
  ) : (
    <a href={u.sourceUrl} target="_blank" rel="noopener noreferrer" className={SHELL}>
      {body}
    </a>
  )
}
