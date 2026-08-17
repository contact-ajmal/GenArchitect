import clsx from 'clsx'

export interface StepDotsProps {
  /** Total number of steps. */
  total: number
  /** Zero-based index of the current step. */
  current: number
  /** Optional labels; when present the current step's label is shown. */
  labels?: string[]
  /** When provided, dots become clickable buttons. */
  onStepClick?: (index: number) => void
  className?: string
}

/**
 * Compact progress indicator for stepped walkthroughs. Completed and current
 * steps use the accent; upcoming steps stay neutral. Segments connect the dots.
 */
export default function StepDots({
  total,
  current,
  labels,
  onStepClick,
  className,
}: StepDotsProps) {
  const steps = Array.from({ length: total }, (_, i) => i)

  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      <ol
        className="flex items-center"
        aria-label={`Step ${current + 1} of ${total}`}
      >
        {steps.map((i) => {
          const state =
            i < current ? 'complete' : i === current ? 'current' : 'upcoming'
          const dot = (
            <span
              className={clsx(
                'block rounded-full transition-colors',
                state === 'current'
                  ? 'h-3 w-3 bg-accent ring-4 ring-accent/20'
                  : state === 'complete'
                    ? 'h-2.5 w-2.5 bg-accent'
                    : 'h-2.5 w-2.5 bg-neutral-300',
              )}
            />
          )

          return (
            <li key={i} className="flex items-center">
              {onStepClick ? (
                <button
                  type="button"
                  onClick={() => onStepClick(i)}
                  aria-label={labels?.[i] ?? `Go to step ${i + 1}`}
                  aria-current={state === 'current' ? 'step' : undefined}
                  className="flex h-6 w-6 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-0"
                >
                  {dot}
                </button>
              ) : (
                <span
                  className="flex h-6 w-6 items-center justify-center"
                  aria-current={state === 'current' ? 'step' : undefined}
                >
                  {dot}
                </span>
              )}

              {i < total - 1 ? (
                <span
                  aria-hidden="true"
                  className={clsx(
                    'h-px w-6 transition-colors',
                    i < current ? 'bg-accent' : 'bg-neutral-200',
                  )}
                />
              ) : null}
            </li>
          )
        })}
      </ol>

      {labels?.[current] ? (
        <p className="font-mono text-xs text-ink-muted">
          <span className="text-ink-soft">
            {String(current + 1).padStart(2, '0')}
          </span>{' '}
          / {String(total).padStart(2, '0')} — {labels[current]}
        </p>
      ) : null}
    </div>
  )
}
