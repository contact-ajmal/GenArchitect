import { useEffect, useMemo, useState } from 'react'
import { useReducedMotion } from 'framer-motion'
import clsx from 'clsx'
import type { RagArchitecture } from '../../types'
import RagDiagram from './RagDiagram'
import CodeBlock from '../code/CodeBlock'

export interface AmbientSyncProps {
  architecture: RagArchitecture
  className?: string
}

const CYCLE_MS = 3200

/**
 * A quiet, controls-free preview of the diagram↔code sync for the hero. It
 * cycles through the walkthrough steps on a timer, highlighting a node and its
 * matching code lines together. Under reduced motion it shows a single static
 * composed state instead of cycling.
 */
export default function AmbientSync({
  architecture,
  className,
}: AmbientSyncProps) {
  const reduce = useReducedMotion() ?? false
  const steps = useMemo(
    () =>
      [...architecture.walkthrough]
        .sort((a, b) => a.order - b.order)
        .filter((s) => s.codeSampleId),
    [architecture],
  )
  // Reduced motion: freeze on a representative middle step.
  const [idx, setIdx] = useState(() =>
    reduce ? Math.floor(steps.length / 2) : 0,
  )

  useEffect(() => {
    if (reduce || steps.length < 2) return
    const t = setInterval(
      () => setIdx((i) => (i + 1) % steps.length),
      CYCLE_MS,
    )
    return () => clearInterval(t)
  }, [reduce, steps.length])

  const step = steps[idx]
  const sample = architecture.codeSamples.find(
    (s) => s.id === step?.codeSampleId,
  )

  if (!step || !sample) return null

  return (
    <div
      className={clsx('grid gap-3 sm:grid-cols-2', className)}
      aria-hidden="true"
    >
      <div className="overflow-hidden rounded-xl border border-hairline bg-neutral-0 p-3">
        <RagDiagram
          architecture={architecture}
          highlightedComponentIds={step.diagramComponentIds}
        />
      </div>
      <div className="min-w-0">
        <CodeBlock
          language={sample.language}
          code={sample.code}
          filename={sample.filename}
          highlightLines={step.codeHighlightRange}
          maxHeight="240px"
        />
      </div>
    </div>
  )
}
