import { useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import type { AtlasCodeSample, FlowStep } from '../../atlas/types'
import { verificationForServices } from '../../data/verification'
import CodeBlock from '../code/CodeBlock'

export interface FlowWalkthroughProps {
  steps: FlowStep[]
  codeSamples?: AtlasCodeSample[]
}

/**
 * A left-to-right flow with a stepper, active-stage highlight, and a detail
 * panel. When a step names a code sample, it renders synced beneath.
 */
export default function FlowWalkthrough({ steps, codeSamples }: FlowWalkthroughProps) {
  const [active, setActive] = useState(0)
  const byId = useMemo(
    () => new Map((codeSamples ?? []).map((c) => [c.id, c])),
    [codeSamples],
  )
  const step = steps[active]
  const sample = step.codeSampleId ? byId.get(step.codeSampleId) : undefined

  return (
    <div>
      {/* stepper */}
      <ol className="flex flex-wrap items-center gap-1">
        {steps.map((s, i) => (
          <li key={s.id} className="flex items-center">
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-current={i === active ? 'step' : undefined}
              className={clsx(
                'rounded-md px-2.5 py-1 text-sm font-medium transition-colors',
                i === active
                  ? 'bg-ink text-neutral-0'
                  : 'text-ink-muted hover:bg-neutral-100 hover:text-ink',
              )}
            >
              <span className="font-mono text-[10px]">{i + 1}</span> {s.label}
            </button>
            {i < steps.length - 1 ? (
              <ChevronRight className="h-4 w-4 text-neutral-300" />
            ) : null}
          </li>
        ))}
      </ol>

      {/* detail */}
      <div className="mt-4 rounded-xl border border-hairline bg-neutral-0 p-5" aria-live="polite">
        <p className="font-mono text-[11px] uppercase tracking-wide text-accent-strong">
          {step.label}
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-ink">{step.plain}</p>
        {step.technical ? (
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.technical}</p>
        ) : null}
      </div>

      {sample ? (
        <div className="mt-4">
          <CodeBlock
            language={sample.language}
            code={sample.code}
            filename={sample.filename}
            verification={
              sample.verifyServices
                ? (verificationForServices(sample.verifyServices) ?? undefined)
                : undefined
            }
          />
        </div>
      ) : null}
    </div>
  )
}
