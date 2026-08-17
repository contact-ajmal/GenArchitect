import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import type { TraceSpan } from '../../atlas/types'

export interface SequenceTraceProps {
  spans: TraceSpan[]
}

const KIND_COLOR: Record<NonNullable<TraceSpan['kind']>, string> = {
  entrypoint: 'bg-accent',
  auth: 'bg-indigo-500',
  gateway: 'bg-amber-500',
  tool: 'bg-emerald-500',
  model: 'bg-violet-500',
  memory: 'bg-sky-500',
  response: 'bg-ink',
}

/** A vertical sequence/trace visual for an invocation chain, with expandable
 *  spans indented by depth. Used for observability topics. */
export default function SequenceTrace({ spans }: SequenceTraceProps) {
  const [open, setOpen] = useState<Set<string>>(new Set())

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  return (
    <ol className="overflow-hidden rounded-xl border border-hairline bg-neutral-0">
      {spans.map((span) => {
        const isOpen = open.has(span.id)
        return (
          <li key={span.id} className="border-b border-hairline last:border-b-0">
            <button
              type="button"
              onClick={() => toggle(span.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-neutral-50"
              style={{ paddingLeft: `${12 + span.depth * 22}px` }}
            >
              <ChevronRight
                className={clsx('h-3.5 w-3.5 shrink-0 text-ink-muted transition-transform', isOpen && 'rotate-90')}
              />
              <span
                className={clsx(
                  'h-2.5 w-2.5 shrink-0 rounded-full',
                  span.kind ? KIND_COLOR[span.kind] : 'bg-neutral-300',
                )}
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                {span.label}
              </span>
              {span.kind ? (
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-wide text-ink-muted">
                  {span.kind}
                </span>
              ) : null}
            </button>
            {isOpen ? (
              <div
                className="pb-3 pr-4 text-sm leading-relaxed text-ink-soft"
                style={{ paddingLeft: `${34 + span.depth * 22}px` }}
              >
                {span.detail}
                {span.note ? (
                  <p className="mt-1 font-mono text-[11px] text-ink-muted">{span.note}</p>
                ) : null}
              </div>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
