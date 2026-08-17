import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import clsx from 'clsx'
import type { RagArchitecture, WalkthroughStep } from '../../types'
import { AWS_SERVICES } from '../../data/services'
import { Button, Callout, Eyebrow, Pill, StepDots } from '../ui'
import type { PillVariant } from '../ui'
import RagDiagram from './RagDiagram'
import CodeBlock from '../code/CodeBlock'

import type { VerificationRecord } from '../../data/verification'

export interface SyncedWalkthroughProps {
  architecture: RagArchitecture
  /** Optional freshness badge shown on the code pane. */
  verification?: VerificationRecord
  className?: string
}

const AUTOPLAY_MS = 4600

function serviceVariant(category: string): PillVariant {
  if (category === 'agentcore' || category === 'bedrock') return 'managed'
  if (category === 'framework') return 'self-managed'
  return 'aws'
}

function NoteList({
  variant,
  title,
  notes,
}: {
  variant: 'note' | 'security' | 'cost'
  title: string
  notes?: string[]
}) {
  if (!notes || notes.length === 0) return null
  return (
    <Callout variant={variant} title={title}>
      {notes.length === 1 ? (
        notes[0]
      ) : (
        <ul className="list-disc space-y-1 pl-4">
          {notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      )}
    </Callout>
  )
}

function DetailPanel({ step }: { step: WalkthroughStep }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Eyebrow>
          Step {step.order} · {step.title}
        </Eyebrow>
        <p className="mt-2 text-[15px] leading-relaxed text-ink">
          {step.plainExplanation}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          {step.technicalDetail}
        </p>
      </div>

      {step.awsServiceIds.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {step.awsServiceIds.map((id) => {
            const svc = AWS_SERVICES[id]
            return (
              <Pill key={id} variant={serviceVariant(svc.category)}>
                {svc.name}
              </Pill>
            )
          })}
        </div>
      ) : null}

      <NoteList variant="note" title="Tradeoffs" notes={step.tradeoffs} />
      <NoteList variant="security" title="Security" notes={step.securityNotes} />
      <NoteList variant="cost" title="Cost" notes={step.costNotes} />
    </div>
  )
}

/**
 * The signature "see it and build it" surface: a diagram and a code block kept
 * in lockstep by a stepper. Each step lights the diagram nodes and the exact
 * code lines together. Keyboard-navigable, screen-reader announced, with an
 * autoplay that respects prefers-reduced-motion.
 */
export default function SyncedWalkthrough({
  architecture,
  verification,
  className,
}: SyncedWalkthroughProps) {
  const reduce = useReducedMotion() ?? false

  const steps = useMemo(
    () => [...architecture.walkthrough].sort((a, b) => a.order - b.order),
    [architecture],
  )
  const [idx, setIdx] = useState(0)
  const [autoplay, setAutoplay] = useState(false)
  const [annotHighlight, setAnnotHighlight] = useState<string[] | null>(null)

  const step = steps[idx]
  const sample = useMemo(
    () => architecture.codeSamples.find((s) => s.id === step.codeSampleId),
    [architecture, step],
  )

  // Reset when the architecture changes.
  useEffect(() => {
    setIdx(0)
    setAutoplay(false)
  }, [architecture])

  // Clear any open annotation highlight when the step changes.
  useEffect(() => {
    setAnnotHighlight(null)
  }, [idx])

  const goTo = useCallback(
    (next: number, pause = true) => {
      if (pause) setAutoplay(false)
      setIdx((prev) => {
        const clamped = Math.max(0, Math.min(steps.length - 1, next))
        return clamped === prev ? prev : clamped
      })
    },
    [steps.length],
  )

  // Autoplay timer — disabled entirely under reduced motion.
  useEffect(() => {
    if (!autoplay || reduce) return
    const t = setInterval(() => {
      setIdx((prev) => {
        if (prev >= steps.length - 1) {
          setAutoplay(false)
          return prev
        }
        return prev + 1
      })
    }, AUTOPLAY_MS)
    return () => clearInterval(t)
  }, [autoplay, reduce, steps.length])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      goTo(idx + 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      goTo(idx - 1)
    } else if (e.key === ' ' && !reduce) {
      e.preventDefault()
      setAutoplay((v) => !v)
    }
  }

  const liveRef = useRef<HTMLDivElement>(null)

  return (
    <section
      className={clsx('flex flex-col gap-4', className)}
      aria-roledescription="synced walkthrough"
      aria-label={`${architecture.name} walkthrough`}
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <StepDots
            total={steps.length}
            current={idx}
            onStepClick={(i) => goTo(i)}
          />
          <span className="font-mono text-xs text-ink-muted">
            {String(idx + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!reduce ? (
            <Button
              size="sm"
              variant={autoplay ? 'primary' : 'subtle'}
              onClick={() => setAutoplay((v) => !v)}
              aria-pressed={autoplay}
              aria-label={autoplay ? 'Pause autoplay' : 'Play walkthrough'}
            >
              {autoplay ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {autoplay ? 'Pause' : 'Auto'}
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="subtle"
            onClick={() => goTo(idx - 1)}
            disabled={idx === 0}
            aria-label="Previous step"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <Button
            size="sm"
            variant="subtle"
            onClick={() => goTo(idx + 1)}
            disabled={idx === steps.length - 1}
            aria-label="Next step"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Two-pane: diagram + code/detail */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        {/* Diagram — sticky so it stays visible while reading */}
        <div className="sticky top-[calc(var(--header-height)+0.5rem)] z-10 max-h-[46vh] overflow-auto rounded-xl border border-hairline bg-neutral-0 p-3 lg:max-h-none lg:overflow-visible">
          <RagDiagram
            architecture={architecture}
            highlightedComponentIds={annotHighlight ?? step.diagramComponentIds}
          />
        </div>

        {/* Code + detail */}
        <div className="flex flex-col gap-4">
          {sample ? (
            <CodeBlock
              language={sample.language}
              code={sample.code}
              filename={sample.filename}
              highlightLines={step.codeHighlightRange}
              maxHeight="440px"
              verification={verification}
              annotations={sample.annotations}
              onAnnotationOpen={(id) => setAnnotHighlight(id ? [id] : null)}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-hairline p-6 text-sm text-ink-muted">
              This step has no code sample — it’s about the diagram above.
            </div>
          )}
          <DetailPanel step={step} />
        </div>
      </div>

      {/* Screen-reader announcement of the active step */}
      <div ref={liveRef} aria-live="polite" className="sr-only">
        {`Step ${idx + 1} of ${steps.length}: ${step.title}`}
      </div>
    </section>
  )
}
