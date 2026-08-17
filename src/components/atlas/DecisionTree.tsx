import { useState } from 'react'
import { CornerDownRight, RotateCcw } from 'lucide-react'
import type { DecisionNode } from '../../atlas/types'
import { Button } from '../ui'

export interface DecisionTreeProps {
  root: DecisionNode
}

/** An interactive "which should I use?" branching visual ending in a
 *  recommendation with reasoning. Deterministic — you can trace every step. */
export default function DecisionTree({ root }: DecisionTreeProps) {
  const [node, setNode] = useState<DecisionNode>(root)
  const [trail, setTrail] = useState<string[]>([])

  const reset = () => {
    setNode(root)
    setTrail([])
  }

  const isLeaf = !!node.recommendation

  return (
    <div className="rounded-xl border border-hairline bg-neutral-0 p-6">
      {trail.length > 0 ? (
        <ol className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
          {trail.map((t, i) => (
            <li key={i} className="flex items-center gap-1.5">
              {i > 0 ? <CornerDownRight className="h-3 w-3" /> : null}
              <span className="rounded-full bg-neutral-100 px-2 py-0.5">{t}</span>
            </li>
          ))}
        </ol>
      ) : null}

      {isLeaf ? (
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wide text-accent-strong">
            Recommendation
          </p>
          <p className="mt-2 text-xl font-semibold text-ink">{node.recommendation}</p>
          {node.reasoning ? (
            <p className="mt-2 leading-relaxed text-ink-soft">{node.reasoning}</p>
          ) : null}
          <div className="mt-5">
            <Button variant="subtle" size="sm" onClick={reset}>
              <RotateCcw className="h-4 w-4" />
              Start over
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-lg font-medium text-ink">{node.question}</p>
          <div className="mt-4 flex flex-col gap-2">
            {node.options?.map((o) => (
              <button
                key={o.label}
                type="button"
                onClick={() => {
                  setTrail((t) => [...t, o.label])
                  setNode(o.next)
                }}
                className="flex items-center justify-between rounded-lg border border-hairline px-4 py-3 text-left text-sm font-medium text-ink-soft transition-colors hover:border-accent hover:bg-accent/[0.05] hover:text-ink"
              >
                {o.label}
                <CornerDownRight className="h-4 w-4 text-ink-muted" />
              </button>
            ))}
          </div>
          {trail.length > 0 ? (
            <div className="mt-4">
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="h-4 w-4" />
                Start over
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
