import { useState } from 'react'
import clsx from 'clsx'
import type { TimelineStage } from '../../atlas/types'

export interface LifecycleTimelineProps {
  stages: TimelineStage[]
}

/** A horizontal lifecycle (persistence triggers, memory extraction→consolidation,
 *  build→deploy→operate) with per-stage detail. Stacks vertically on mobile. */
export default function LifecycleTimeline({ stages }: LifecycleTimelineProps) {
  const [active, setActive] = useState(0)
  const stage = stages[active]

  return (
    <div>
      <ol className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-0">
        {stages.map((s, i) => (
          <li key={s.id} className="flex flex-1 items-center sm:flex-col">
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-current={i === active ? 'step' : undefined}
              className={clsx(
                'flex w-full flex-col items-center gap-1 rounded-lg border px-3 py-2.5 text-center transition-colors',
                i === active
                  ? 'border-accent bg-accent/[0.06] text-ink'
                  : 'border-hairline text-ink-soft hover:border-neutral-300',
              )}
            >
              <span
                className={clsx(
                  'flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px] font-semibold',
                  i === active ? 'bg-accent text-neutral-0' : 'bg-neutral-100 text-ink-muted',
                )}
              >
                {i + 1}
              </span>
              <span className="text-xs font-medium leading-tight">{s.label}</span>
            </button>
            {i < stages.length - 1 ? (
              <span
                aria-hidden="true"
                className="mx-1 hidden h-px flex-1 bg-neutral-200 sm:block"
              />
            ) : null}
          </li>
        ))}
      </ol>

      <div className="mt-4 rounded-xl border border-hairline bg-neutral-0 p-5" aria-live="polite">
        <p className="font-mono text-[11px] uppercase tracking-wide text-accent-strong">
          {stage.label}
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-ink">{stage.plain}</p>
        {stage.technical ? (
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{stage.technical}</p>
        ) : null}
      </div>
    </div>
  )
}
