import { ArrowUpRight } from 'lucide-react'
import clsx from 'clsx'
import type { UpdateEntry, UpdateSummary, UpdateTopic } from '../../types'
import { relativeTime } from '../../lib/videos'

export interface UpdateCardProps {
  /** Accepts the full entry or the trimmed homepage summary. */
  update: UpdateSummary &
    Partial<Pick<UpdateEntry, 'excerpt' | 'note'>> & { topics?: UpdateTopic[] }
  /** Accent border — used for pinned items. */
  featured?: boolean
  /** Tighter type and no excerpt; for the homepage rail. */
  compact?: boolean
}

/**
 * One update. Always an outbound link to the original on aws.amazon.com, and
 * always names its source — we surface AWS's work, we don't reproduce it.
 */
export default function UpdateCard({ update, featured, compact }: UpdateCardProps) {
  return (
    <a
      href={update.url}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(
        'group flex h-full flex-col rounded-xl border border-hairline bg-neutral-0 transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-accent',
        compact ? 'p-3.5' : 'p-4',
        featured && 'border-accent/40',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3
          className={clsx(
            'font-medium leading-snug text-ink group-hover:text-accent-strong',
            compact && 'line-clamp-2 text-[15px]',
          )}
        >
          {update.title}
        </h3>
        <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted transition-colors group-hover:text-accent-strong" />
      </div>

      {/* Source attribution — required on every card, never omitted. */}
      <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-ink-muted">
        <span
          className={clsx(
            'rounded px-1.5 py-0.5 font-mono text-[10px]',
            update.kind === 'announcement' ? 'bg-signal/15 text-ink' : 'bg-neutral-100 text-ink-muted',
          )}
        >
          {update.kind === 'announcement' ? 'launch' : 'blog'}
        </span>
        <span className="font-medium text-ink-soft">{update.sourceName}</span>
        <span aria-hidden="true">·</span>
        <span>{relativeTime(update.publishedAt)}</span>
      </p>

      {/* Our own take wins over the syndicated excerpt. */}
      {!compact && update.note ? (
        <p className="mt-2 border-l-2 border-accent/50 pl-2.5 text-sm leading-relaxed text-ink-soft">
          {update.note}
        </p>
      ) : !compact && update.excerpt ? (
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-muted">
          {update.excerpt}
        </p>
      ) : null}

      {!compact && update.topics && update.topics.length > 0 ? (
        <span className="mt-3 flex flex-wrap gap-1">
          {update.topics.slice(0, 4).map((t) => (
            <span key={t} className="rounded-full bg-neutral-100 px-2 py-0.5 font-mono text-[10px] text-ink-muted">
              {t}
            </span>
          ))}
        </span>
      ) : null}
    </a>
  )
}
