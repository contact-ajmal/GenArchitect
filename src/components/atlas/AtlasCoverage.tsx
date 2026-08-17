import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Circle, ExternalLink } from 'lucide-react'
import type { AtlasId, AtlasSection, CoverageStatus } from '../../atlas/types'
import { Eyebrow, Pill } from '../ui'

export interface AtlasCoverageProps {
  atlasId: AtlasId
  title: string
  sections: AtlasSection[]
}

const STATUS: Record<CoverageStatus, { label: string; variant: 'managed' | 'aws' | 'neutral' }> = {
  full: { label: 'Full', variant: 'managed' },
  overview: { label: 'Overview', variant: 'aws' },
  planned: { label: 'Planned', variant: 'neutral' },
}

/** The coverage map as an auditable checklist — makes "complete coverage" a
 *  verifiable claim rather than a vibe. */
export default function AtlasCoverage({ atlasId, title, sections }: AtlasCoverageProps) {
  const totals = sections
    .flatMap((s) => s.topics)
    .reduce(
      (acc, t) => ({ ...acc, [t.coverageStatus]: (acc[t.coverageStatus] ?? 0) + 1 }),
      {} as Record<CoverageStatus, number>,
    )

  return (
    <div className="mx-auto max-w-content px-4 py-10 sm:px-6">
      <Link to={`/${atlasId}`} className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        {title}
      </Link>

      <Eyebrow>Coverage map</Eyebrow>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        Every documented surface, tracked
      </h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        “Complete coverage” means every documented surface is represented,
        explained in original words, and navigable — with a link to the canonical
        docs for exact syntax. Overview-level items are marked honestly, not
        overstated.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Pill variant="managed">{totals.full ?? 0} full</Pill>
        <Pill variant="aws">{totals.overview ?? 0} overview</Pill>
        <Pill variant="neutral">{totals.planned ?? 0} planned</Pill>
      </div>

      <div className="mt-8 space-y-6">
        {sections.map((s) => (
          <div key={s.id}>
            <h2 className="text-lg font-semibold text-ink">{s.title}</h2>
            <ul className="mt-2 divide-y divide-hairline overflow-hidden rounded-xl border border-hairline">
              {s.topics.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 bg-neutral-0 px-4 py-2.5">
                  <span className="flex min-w-0 items-center gap-2.5">
                    {t.coverageStatus === 'full' ? (
                      <Check className="h-4 w-4 shrink-0 text-accent-strong" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-neutral-300" />
                    )}
                    <Link to={`/${atlasId}/${t.id}`} className="truncate text-sm text-ink hover:text-accent-strong hover:underline">
                      {t.title}
                    </Link>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Pill variant={STATUS[t.coverageStatus].variant}>
                      {STATUS[t.coverageStatus].label}
                    </Pill>
                    <a
                      href={t.docUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-ink-muted hover:text-accent-strong"
                      aria-label={`Official docs for ${t.title}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
