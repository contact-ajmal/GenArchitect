import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, TriangleAlert, Wrench } from 'lucide-react'
import { FAILURE_MODES, type Severity } from '../data/failureModes'
import { ARCHITECTURES } from '../data/architectures'
import { compositionFromPattern } from '../compose/composition'
import { normalizeComposition } from '../compose/rules'
import { Button, Callout, Eyebrow } from '../components/ui'
import RagDiagram from '../components/diagram/RagDiagram'

const AMBER = '#D97706'

const SEVERITY_STYLE: Record<Severity, string> = {
  medium: 'bg-neutral-100 text-ink-soft',
  high: 'bg-amber-100 text-amber-800',
  critical: 'bg-rose-100 text-rose-700',
}

function SeverityTag({ severity }: { severity: Severity }) {
  return (
    <span
      className={
        'rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ' +
        SEVERITY_STYLE[severity]
      }
    >
      {severity}
    </span>
  )
}

export default function FailureModes() {
  const navigate = useNavigate()
  const [activeId, setActiveId] = useState(FAILURE_MODES[0].id)
  const mode = useMemo(
    () => FAILURE_MODES.find((f) => f.id === activeId) ?? FAILURE_MODES[0],
    [activeId],
  )

  const fixArch = ARCHITECTURES[mode.fixArchitectureId]

  const composeFix = () => {
    const base = compositionFromPattern(mode.affectedPatterns[0])
    const composition = normalizeComposition({
      ...base,
      ...mode.composePatch,
      name: `Fixed: ${mode.title}`,
    })
    navigate('/compose', { state: { composition } })
  }

  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:px-6">
      <header className="max-w-3xl">
        <Eyebrow>Failure-mode lab</Eyebrow>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          What breaks, why, and how to fix it
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">
          Enterprises learn RAG architecture best from failure. Each mode below
          shows the symptom, the architectural cause on a diagram, a before/after
          example, and a concrete fix — with a path straight into the pattern
          that solves it or the composer.
        </p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[19rem_minmax(0,1fr)]">
        {/* Gallery */}
        <nav aria-label="Failure modes" className="lg:sticky lg:top-24 lg:self-start">
          <ol className="flex flex-col gap-1">
            {FAILURE_MODES.map((f) => {
              const active = f.id === mode.id
              return (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(f.id)}
                    aria-current={active ? 'true' : undefined}
                    className={
                      'flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ' +
                      (active
                        ? 'bg-neutral-100 font-medium text-ink'
                        : 'text-ink-muted hover:bg-neutral-100 hover:text-ink')
                    }
                  >
                    <TriangleAlert
                      className={
                        'mt-0.5 h-4 w-4 shrink-0 ' +
                        (f.severity === 'critical'
                          ? 'text-rose-500'
                          : f.severity === 'high'
                            ? 'text-amber-600'
                            : 'text-ink-muted')
                      }
                    />
                    <span className="min-w-0">{f.title}</span>
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>

        {/* Detail */}
        <article className="min-w-0">
          <div className="flex items-center gap-3">
            <SeverityTag severity={mode.severity} />
            <span className="text-sm text-ink-muted">
              Affects{' '}
              {mode.affectedPatterns
                .map((p) => ARCHITECTURES[p].name)
                .slice(0, 3)
                .join(', ')}
              {mode.affectedPatterns.length > 3 ? '…' : ''}
            </span>
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {mode.title}
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-hairline bg-neutral-0 p-5">
              <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
                Symptom
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {mode.symptom}
              </p>
            </div>
            <div className="rounded-xl border border-hairline bg-neutral-0 p-5">
              <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
                Architectural cause
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {mode.cause}
              </p>
            </div>
          </div>

          {/* Cause on diagram — the fixing component in a warning treatment */}
          <div className="mt-5">
            <p className="mb-2 flex items-center gap-2 text-sm text-ink-muted">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: AMBER }}
              />
              The component that resolves it — added or strengthened in{' '}
              <Link
                to={`/architecture/${fixArch.id}`}
                className="font-medium text-accent-strong hover:underline"
              >
                {fixArch.name}
              </Link>
            </p>
            <div className="overflow-hidden rounded-xl border border-hairline bg-neutral-0 p-3">
              <RagDiagram
                architecture={fixArch}
                highlightedComponentIds={[mode.fixComponentId]}
                glowColor={AMBER}
              />
            </div>
          </div>

          {/* Before / after */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-5">
              <p className="font-mono text-[11px] uppercase tracking-wide text-rose-700">
                Before — the failure
              </p>
              <p className="mt-2 text-sm font-medium text-ink">
                “{mode.before.query}”
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                {mode.before.answer}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="font-mono text-[11px] uppercase tracking-wide text-emerald-700">
                After — the fix
              </p>
              <p className="mt-2 text-sm font-medium text-ink">
                “{mode.after.query}”
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                {mode.after.answer}
              </p>
            </div>
          </div>

          {/* Fix */}
          <div className="mt-6">
            <Callout variant="tip" title="The fix">
              {mode.fix}
            </Callout>
          </div>

          {/* Meridian framing */}
          <div className="mt-4 rounded-xl border border-hairline bg-accent/[0.04] p-5">
            <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
              In the Meridian scenario
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {mode.meridian}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={composeFix}>
              <Wrench className="h-4 w-4" />
              Fix it in the composer
            </Button>
            <Link to={`/architecture/${fixArch.id}`}>
              <Button variant="subtle">
                See {fixArch.name}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </article>
      </div>
    </div>
  )
}
