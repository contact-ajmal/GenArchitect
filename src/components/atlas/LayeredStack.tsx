import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import type { StackLayer } from '../../atlas/types'

export interface LayeredStackProps {
  layers: StackLayer[]
  /** Build a link for a layer's topicId (e.g. (id) => `/agentcore/${id}`). */
  topicHref?: (topicId: string) => string
}

const ACCENT = 'rgb(20 184 166)'

/** A stacked-layer visual for service composition — click a layer to expand
 *  its role and jump to its topic. */
export default function LayeredStack({ layers, topicHref }: LayeredStackProps) {
  const [open, setOpen] = useState<string | null>(layers[0]?.id ?? null)

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-1.5">
      {layers.map((layer) => {
        const isOpen = open === layer.id
        return (
          <div
            key={layer.id}
            className="overflow-hidden rounded-lg border border-hairline bg-neutral-0"
            style={{ borderLeft: `4px solid ${layer.accent ?? ACCENT}` }}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : layer.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <span className="min-w-0">
                <span className="block font-display text-sm font-semibold text-ink">
                  {layer.label}
                </span>
                <span className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
                  {layer.role}
                </span>
              </span>
              <ChevronDown
                className={clsx(
                  'h-4 w-4 shrink-0 text-ink-muted transition-transform',
                  isOpen && 'rotate-180',
                )}
              />
            </button>
            {isOpen && layer.detail ? (
              <div className="border-t border-hairline px-4 py-3">
                <p className="text-sm leading-relaxed text-ink-soft">{layer.detail}</p>
                {layer.topicId && topicHref ? (
                  <Link
                    to={topicHref(layer.topicId)}
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-accent-strong hover:underline"
                  >
                    Open topic
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
