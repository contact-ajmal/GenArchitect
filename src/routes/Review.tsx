import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ClipboardList,
  Hammer,
  RotateCcw,
  Sparkles,
  TriangleAlert,
  Wand2,
} from 'lucide-react'
import { ARCHITECTURES } from '../data/architectures'
import { notebooksForPattern } from '../data/notebookTemplates'
import { Button, Callout, Eyebrow, Pill } from '../components/ui'
import RagDiagram from '../components/diagram/RagDiagram'
import DrawioExport from '../components/DrawioExport'
import { DIFFICULTY_LABELS } from '../lib/display'
import { visibleQuestions, type AnswerMap } from '../diagnose/flow'
import { recommend } from '../diagnose/recommend'

type Phase = 'intro' | 'quiz' | 'report'

/** Plain-English phrase per answer value, for the profile summary. */
const ANSWER_PHRASES: Record<string, string> = {
  small: 'a small corpus',
  large: 'a large corpus',
  massive: 'a massive corpus',
  single: 'one source',
  multiple: 'several sources',
  many_diff_permissions: 'many sources with different permissions',
  none: 'no per-user access rules',
  per_user: 'per-user document access',
  simple: 'simple lookups',
  multi_hop: 'multi-step questions',
  relationship: 'relationship questions',
  traversal: 'traversal-heavy answers',
  semantic: 'mostly-semantic answers',
  stateless: 'no cross-session memory',
  user_memory: 'memory of the user',
  answer_only: 'answers only',
  take_actions: 'action-taking',
  review: 'with a review step',
  no_review: 'without a review step',
  speed_cost: 'a focus on speed & cost',
  capability: 'a focus on capability',
}

function confidenceOf(gap: number): { label: string; tone: 'managed' | 'aws' } {
  if (gap >= 4) return { label: 'Strong fit', tone: 'managed' }
  if (gap >= 2) return { label: 'Good fit', tone: 'managed' }
  return { label: 'Close call', tone: 'aws' }
}

export default function Review() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('intro')
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [index, setIndex] = useState(0)

  const questions = useMemo(() => visibleQuestions(answers), [answers])
  const result = useMemo(() => recommend(answers), [answers])
  const current = questions[Math.min(index, questions.length - 1)]

  const choose = (value: string) => {
    const next = { ...answers, [current.id]: value }
    setAnswers(next)
    const nv = visibleQuestions(next)
    const pos = nv.findIndex((q) => q.id === current.id)
    if (pos + 1 < nv.length) setIndex(pos + 1)
    else setPhase('report')
  }

  const back = () => {
    if (index === 0) setPhase('intro')
    else setIndex((i) => i - 1)
  }

  const restart = () => {
    setAnswers({})
    setIndex(0)
    setPhase('intro')
  }

  /* ---------------------------------------------------------------- intro */
  if (phase === 'intro') {
    return (
      <div className="mx-auto max-w-content px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-hairline bg-neutral-0 px-3 py-1 text-xs font-medium text-ink-muted">
            <ClipboardList className="h-4 w-4 text-accent-strong" />
            Free · no signup · ~2 minutes
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Architecture review for your use case
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-soft">
            Answer a handful of plain-language questions about what you’re
            building, and get a recommended RAG architecture on AWS — with a
            clear, traceable explanation of why it fits, its tradeoffs, and where
            to go next. It’s guidance, not a mandate.
          </p>
          <div className="mt-8 flex justify-center">
            <Button size="lg" onClick={() => setPhase('quiz')}>
              <Sparkles className="h-4 w-4" />
              Start the review
            </Button>
          </div>
          <p className="mt-4 text-sm text-ink-muted">
            Prefer to browse first? See the{' '}
            <Link to="/catalog" className="text-accent-strong hover:underline">
              full catalog
            </Link>{' '}
            of nine patterns.
          </p>
        </div>
      </div>
    )
  }

  /* ----------------------------------------------------------------- quiz */
  if (phase === 'quiz' && current) {
    const total = questions.length
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-ink-muted">
              Question {index + 1} of {total}
            </span>
            <button
              type="button"
              onClick={restart}
              className="text-xs text-ink-muted hover:text-ink"
            >
              Start over
            </button>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${((index + 1) / total) * 100}%` }}
            />
          </div>
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-ink">
          {current.question}
        </h2>
        <p className="mt-2 leading-relaxed text-ink-muted">{current.help}</p>

        <div className="mt-6 flex flex-col gap-2.5">
          {current.choices.map((choice) => {
            const selected = answers[current.id] === choice.value
            return (
              <button
                key={choice.value}
                type="button"
                onClick={() => choose(choice.value)}
                className={
                  'flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left text-[15px] font-medium transition-colors ' +
                  (selected
                    ? 'border-accent bg-accent/[0.06] text-ink'
                    : 'border-hairline text-ink-soft hover:border-accent hover:bg-accent/[0.04] hover:text-ink')
                }
              >
                {choice.label}
                <ArrowRight className="h-4 w-4 shrink-0 text-ink-muted" />
              </button>
            )
          })}
        </div>

        <div className="mt-8">
          <Button variant="ghost" onClick={back}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </div>
    )
  }

  /* --------------------------------------------------------------- report */
  if (!result) {
    return (
      <div className="mx-auto max-w-content px-4 py-24 text-center sm:px-6">
        <p className="text-ink-muted">Answer a few questions to see your review.</p>
        <Button className="mt-4" onClick={restart}>
          Start the review
        </Button>
      </div>
    )
  }

  const arch = ARCHITECTURES[result.recommended.id]
  const runnerUp = result.runnerUp ? ARCHITECTURES[result.runnerUp.id] : null
  const gap = result.recommended.score - (result.runnerUp?.score ?? 0)
  const confidence = confidenceOf(gap)
  const notebook = notebooksForPattern(arch.id)[0]

  const profile = Object.entries(answers)
    .map(([, v]) => ANSWER_PHRASES[v])
    .filter(Boolean)
    .join(', ')

  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Eyebrow>Architecture review</Eyebrow>
        <Button variant="subtle" size="sm" onClick={restart}>
          <RotateCcw className="h-4 w-4" />
          Retake
        </Button>
      </div>

      {/* Recommendation banner */}
      <div className="mt-3 rounded-2xl border border-hairline bg-neutral-0 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <Pill variant={confidence.tone}>{confidence.label}</Pill>
          <Pill variant="difficulty">{DIFFICULTY_LABELS[arch.difficulty]}</Pill>
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: arch.accentColor }}
            aria-hidden="true"
          />
        </div>
        <p className="mt-4 text-sm text-ink-muted">Recommended architecture</p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          {arch.name}
        </h1>
        <p className="mt-2 text-lg text-ink-muted">{arch.tagline}</p>
        {profile ? (
          <p className="mt-4 max-w-2xl leading-relaxed text-ink-soft">
            Based on your answers — {profile} — this pattern is the best fit.
          </p>
        ) : null}
        <p className="mt-3 max-w-2xl leading-relaxed text-ink">{arch.summary}</p>
      </div>

      {/* Why + diagram */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-hairline bg-neutral-0 p-6">
          <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
            Why it fits your use case
          </p>
          <ul className="mt-3 space-y-2.5">
            {result.recommended.reasons.map((r, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink-soft">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong" />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-xl border border-hairline bg-neutral-50 p-3">
            <RagDiagram architecture={arch} />
          </div>
          <DrawioExport source={arch} name={arch.name} />
        </div>
      </div>

      {/* Strengths / watch-outs */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <p className="font-mono text-[11px] uppercase tracking-wide text-emerald-700">
            Where it’s strong
          </p>
          <ul className="mt-3 space-y-2">
            {arch.whenToUse.map((w, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed text-ink-soft">
                <span className="text-emerald-600">•</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-amber-700">
            <TriangleAlert className="h-3.5 w-3.5" />
            Watch out for
          </p>
          <ul className="mt-3 space-y-2">
            {arch.enterpriseConsiderations.map((c, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed text-ink-soft">
                <span className="text-amber-600">•</span>
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Runner-up */}
      {runnerUp ? (
        <div className="mt-6">
          <Callout variant="note" title={`Also consider: ${runnerUp.name}`}>
            {result.whatWouldChange}{' '}
            <Link to={`/architecture/${runnerUp.id}`} className="text-accent-strong underline">
              See {runnerUp.name}
            </Link>
            .
          </Callout>
        </div>
      ) : null}

      {/* Next steps */}
      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight text-ink">Your next steps</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to={`/architecture/${arch.id}`}
            className="group flex flex-col rounded-xl border border-hairline bg-neutral-0 p-5 transition-shadow hover:shadow-md"
          >
            <BookOpen className="h-5 w-5 text-accent-strong" />
            <p className="mt-3 font-semibold text-ink">Read the deep dive</p>
            <p className="mt-1 flex-1 text-sm text-ink-muted">
              The full walkthrough, tradeoffs, and reference code.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent-strong">
              Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          <button
            type="button"
            onClick={() => navigate('/compose', { state: { composition: result.composition } })}
            className="group flex flex-col rounded-xl border border-hairline bg-neutral-0 p-5 text-left transition-shadow hover:shadow-md"
          >
            <Wand2 className="h-5 w-5 text-accent-strong" />
            <p className="mt-3 font-semibold text-ink">Compose it</p>
            <p className="mt-1 flex-1 text-sm text-ink-muted">
              Open a live draft in the composer, pre-filled from your answers.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent-strong">
              Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>

          {notebook ? (
            <Link
              to={`/notebooks/${notebook.id}`}
              className="group flex flex-col rounded-xl border border-hairline bg-neutral-0 p-5 transition-shadow hover:shadow-md"
            >
              <ClipboardList className="h-5 w-5 text-accent-strong" />
              <p className="mt-3 font-semibold text-ink">Grab a notebook</p>
              <p className="mt-1 flex-1 text-sm text-ink-muted">
                A downloadable end-to-end notebook for this pattern.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent-strong">
                Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ) : null}

          <Link
            to="/build"
            className="group flex flex-col rounded-xl border border-hairline bg-neutral-0 p-5 transition-shadow hover:shadow-md"
          >
            <Hammer className="h-5 w-5 text-accent-strong" />
            <p className="mt-3 font-semibold text-ink">Build it</p>
            <p className="mt-1 flex-1 text-sm text-ink-muted">
              The hands-on AgentCore + Strands build track.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent-strong">
              Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>
      </section>

      {/* Transparency: full ranking */}
      <details className="mt-8 rounded-xl border border-hairline bg-neutral-0 p-5">
        <summary className="cursor-pointer text-sm font-medium text-ink">
          How the recommendation was scored
        </summary>
        <p className="mt-3 text-sm text-ink-muted">
          Deterministic scoring — no black box. Every pattern that matched your
          answers, ranked:
        </p>
        <ol className="mt-3 space-y-1.5">
          {result.ranked.map((p) => (
            <li key={p.id} className="flex items-center justify-between text-sm">
              <Link to={`/architecture/${p.id}`} className="text-ink hover:text-accent-strong hover:underline">
                {ARCHITECTURES[p.id].name}
              </Link>
              <span className="font-mono text-xs text-ink-muted">score {p.score}</span>
            </li>
          ))}
        </ol>
      </details>
    </div>
  )
}
