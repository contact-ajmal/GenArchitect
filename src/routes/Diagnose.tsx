import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, RotateCcw, Sparkles } from 'lucide-react'
import { ARCHITECTURES } from '../data/architectures'
import { Button, Callout, Eyebrow, Pill } from '../components/ui'
import RagDiagram from '../components/diagram/RagDiagram'
import { DIFFICULTY_LABELS } from '../lib/display'
import { visibleQuestions, type AnswerMap } from '../diagnose/flow'
import { recommend } from '../diagnose/recommend'

export default function Diagnose() {
  const navigate = useNavigate()
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [submitted, setSubmitted] = useState(false)

  const questions = useMemo(() => visibleQuestions(answers), [answers])
  const result = useMemo(() => recommend(answers), [answers])
  const answeredCount = questions.filter((q) => answers[q.id]).length

  const setAnswer = (id: string, value: string) =>
    setAnswers((prev) => ({ ...prev, [id]: value }))

  const reset = () => {
    setAnswers({})
    setSubmitted(false)
  }

  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:px-6">
      <header className="max-w-3xl">
        <Eyebrow>Diagnose my RAG</Eyebrow>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Which pattern fits your problem?
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">
          A short, honest interview maps your needs to one of the nine patterns —
          and shows exactly why. It’s guidance, not a mandate; you can always
          tweak the result in the composer.
        </p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        {/* Interview */}
        <div className="flex flex-col gap-5">
          {questions.map((q, i) => (
            <fieldset
              key={q.id}
              className="rounded-xl border border-hairline bg-neutral-0 p-5"
            >
              <legend className="px-1">
                <span className="font-mono text-[11px] text-ink-muted">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </legend>
              <p className="font-medium text-ink">{q.question}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                {q.help}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {q.choices.map((choice) => {
                  const active = answers[q.id] === choice.value
                  return (
                    <button
                      key={choice.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setAnswer(q.id, choice.value)}
                      className={
                        'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ' +
                        (active
                          ? 'border-accent bg-accent/10 text-ink'
                          : 'border-hairline text-ink-soft hover:border-neutral-300 hover:text-ink')
                      }
                    >
                      {choice.label}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          ))}

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setSubmitted(true)}
              disabled={!result}
            >
              <Sparkles className="h-4 w-4" />
              See recommendation
            </Button>
            <Button variant="ghost" onClick={reset}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            {!result ? (
              <span className="text-sm text-ink-muted">
                {answeredCount}/{questions.length} answered
              </span>
            ) : null}
          </div>
        </div>

        {/* Result */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          {submitted && result ? (
            <RecommendationCard result={result} onCompose={() =>
              navigate('/compose', { state: { composition: result.composition } })
            } />
          ) : (
            <div className="rounded-xl border border-dashed border-hairline p-8 text-center text-ink-muted">
              Answer the questions, then see a recommended pattern with a
              transparent “why”, a runner-up, and a one-click handoff to the
              composer.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RecommendationCard({
  result,
  onCompose,
}: {
  result: NonNullable<ReturnType<typeof recommend>>
  onCompose: () => void
}) {
  const arch = ARCHITECTURES[result.recommended.id]
  const runnerUp = result.runnerUp ? ARCHITECTURES[result.runnerUp.id] : null

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-hairline bg-neutral-0 p-5">
      <div>
        <Eyebrow>Recommended</Eyebrow>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">
          {arch.name}
        </h2>
        <div className="mt-1 flex items-center gap-2">
          <Pill variant="difficulty">{DIFFICULTY_LABELS[arch.difficulty]}</Pill>
          <span className="text-sm text-ink-muted">{arch.tagline}</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-hairline bg-neutral-50 p-2">
        <RagDiagram architecture={arch} />
      </div>

      <div>
        <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
          Why
        </p>
        <ul className="mt-2 space-y-1.5">
          {result.recommended.reasons.map((r, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-ink-soft">
              <span className="text-accent-strong">•</span>
              {r}
            </li>
          ))}
        </ul>
      </div>

      {runnerUp ? (
        <Callout variant="note" title={`Runner-up: ${runnerUp.name}`}>
          {result.whatWouldChange}
        </Callout>
      ) : null}

      <div className="flex flex-col gap-2">
        <Button onClick={onCompose}>
          Compose this
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Link to={`/architecture/${arch.id}`}>
          <Button variant="subtle" className="w-full">
            See the full deep dive
          </Button>
        </Link>
      </div>
    </div>
  )
}
