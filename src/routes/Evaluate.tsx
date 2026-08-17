import { Link } from 'react-router-dom'
import { Activity } from 'lucide-react'
import {
  EVAL_ENABLEMENT,
  EVAL_LOOP_DIAGRAM,
  RAG_METRICS,
  SAMPLE_SCORECARDS,
  SAMPLE_TRACE,
} from '../data/evaluation'
import { verificationForServices } from '../data/verification'
import { Callout, Eyebrow } from '../components/ui'
import RagDiagram from '../components/diagram/RagDiagram'
import CodeBlock from '../components/code/CodeBlock'

export default function Evaluate() {
  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:px-6">
      <header className="max-w-3xl">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-accent-strong" />
          <Eyebrow>Evaluation &amp; observability</Eyebrow>
        </div>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          How do you know it works?
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">
          This is where most RAG projects stall. You can’t improve what you can’t
          see — so you measure retrieval and answer quality, trace what the agent
          actually did, and gate changes on evaluations before users ever notice.
        </p>
      </header>

      {/* Eval loop diagram */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold tracking-tight text-ink">
          The evaluation loop
        </h2>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Query → retrieve → generate → judge and trace → metrics → improve. The
          observability spine is what turns a black box into something you can
          debug and trust.
        </p>
        <div className="mt-5 overflow-hidden rounded-xl border border-hairline bg-neutral-0 p-3">
          <RagDiagram architecture={EVAL_LOOP_DIAGRAM} />
        </div>
      </section>

      {/* Metrics */}
      <section className="mt-14">
        <Eyebrow>The metrics that matter</Eyebrow>
        <h2 className="mb-6 mt-2 text-2xl font-bold tracking-tight text-ink">
          What to measure — and what “bad” looks like
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {RAG_METRICS.map((m) => (
            <div key={m.id} className="rounded-xl border border-hairline bg-neutral-0 p-5">
              <h3 className="font-semibold text-ink">{m.name}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink">{m.plain}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                {m.technical}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-amber-700">
                <span className="font-mono text-[11px] uppercase tracking-wide">
                  Bad looks like —{' '}
                </span>
                {m.badLooksLike}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Trace + scorecards */}
      <section className="mt-14 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Eyebrow>Sample trace</Eyebrow>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-muted">
              synthetic
            </span>
          </div>
          <ol className="overflow-hidden rounded-xl border border-hairline bg-neutral-0">
            {SAMPLE_TRACE.map((s, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-2.5 last:border-b-0"
              >
                <span className="min-w-0">
                  <span className="font-mono text-xs text-accent-strong">
                    {s.label}
                  </span>
                  <span className="ml-2 text-sm text-ink-soft">{s.detail}</span>
                </span>
                {s.ms ? (
                  <span className="shrink-0 font-mono text-[11px] text-ink-muted">
                    {s.ms}ms
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
          <p className="mt-2 text-xs text-ink-muted">
            An agent trace like this (via Observability → CloudWatch) is how you
            debug a bad answer — you can see the exact retrieval step that failed.
          </p>
        </div>

        <div>
          <div className="mb-3 flex items-center gap-2">
            <Eyebrow>Sample scorecard</Eyebrow>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-muted">
              synthetic
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {SAMPLE_SCORECARDS.map((card) => (
              <div
                key={card.label}
                className={
                  'rounded-xl border p-4 ' +
                  (card.tone === 'good'
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-amber-200 bg-amber-50')
                }
              >
                <p className="text-sm font-semibold text-ink">{card.label}</p>
                <div className="mt-2 flex flex-col gap-1.5">
                  {card.scores.map((s) => (
                    <div key={s.metric} className="flex items-center gap-2">
                      <span className="w-32 shrink-0 text-xs text-ink-soft">
                        {s.metric}
                      </span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200">
                        <span
                          className={
                            'block h-full rounded-full ' +
                            (card.tone === 'good' ? 'bg-emerald-500' : 'bg-amber-500')
                          }
                          style={{ width: `${Math.round(s.value * 100)}%` }}
                        />
                      </span>
                      <span className="w-10 shrink-0 text-right font-mono text-[11px] text-ink-muted">
                        {s.value.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-ink-soft">
                  {card.note}{' '}
                  <Link to="/failure-modes" className="text-accent-strong hover:underline">
                    See failure modes →
                  </Link>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LLM-as-judge caveat */}
      <section className="mt-10">
        <Callout variant="warning" title="Honest about LLM-as-judge">
          AgentCore Evaluations can use an LLM to score groundedness and
          relevance at scale — useful, but not infallible. LLM judges can be
          biased, inconsistent run-to-run, and lenient on fluent-but-wrong
          answers. Calibrate against human-labeled examples, track judge
          agreement, and keep a human in the loop for high-stakes decisions.
        </Callout>
      </section>

      {/* Enablement code */}
      <section className="mt-12">
        <Eyebrow>Turning it on</Eyebrow>
        <h2 className="mb-6 mt-2 text-2xl font-bold tracking-tight text-ink">
          Enable observability &amp; evaluations
        </h2>
        <div className="flex flex-col gap-6">
          {EVAL_ENABLEMENT.map((f) => (
            <CodeBlock
              key={f.filename}
              language={f.language}
              code={f.code}
              filename={f.filename}
              verification={
                verificationForServices([
                  'agentcore_observability',
                  'agentcore_evaluations',
                  'cloudwatch',
                ]) ?? undefined
              }
            />
          ))}
        </div>
      </section>

      {/* Meridian tie */}
      <section className="mt-12">
        <div className="rounded-xl border border-hairline bg-accent/[0.04] p-6">
          <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
            In the Meridian scenario
          </p>
          <p className="mt-2 leading-relaxed text-ink-soft">
            Meridian’s team monitors the assistant with traces to CloudWatch for
            audit, and gates every prompt or retrieval change on an evaluation
            suite — so quality and safety regressions are caught before they
            reach regulated users, and every answer stays reconstructable.
          </p>
        </div>
      </section>
    </div>
  )
}
