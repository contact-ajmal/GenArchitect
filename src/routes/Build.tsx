import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  CircleDot,
  Eye,
  TriangleAlert,
} from 'lucide-react'
import { BUILD_TRACK } from '../data/buildTrack'
import type { BuildStage } from '../data/buildTrack'
import { ARCHITECTURES } from '../data/architectures'
import { AWS_SERVICES } from '../data/services'
import { verificationForServices } from '../data/verification'
import { Button, Callout, Eyebrow, Pill } from '../components/ui'
import CodeBlock from '../components/code/CodeBlock'
import AtlasLink from '../components/atlas/AtlasLink'
import RelatedVideos from '../components/video/RelatedVideos'
import { atlasRefsFor } from '../atlas/links'
import { serviceVariant } from '../lib/display'

const ACTIVE_KEY = 'genarchitect:build:active'
const DONE_KEY = 'genarchitect:build:completed'

function loadDone(): Set<string> {
  try {
    const raw = localStorage.getItem(DONE_KEY)
    return new Set<string>(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function StageStepper({ stage }: { stage: BuildStage }) {
  return (
    <ol className="flex flex-col gap-8">
      {stage.steps.map((step, i) => (
        <li key={i} className="border-l-2 border-hairline pl-5">
          <div className="flex items-start gap-2">
            <span className="-ml-[27px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-0 font-mono text-[11px] font-semibold text-ink-muted ring-1 ring-hairline">
              {i + 1}
            </span>
            <p className="text-[15px] font-medium leading-relaxed text-ink">
              {step.instruction}
            </p>
          </div>

          {step.awsServiceIds.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {step.awsServiceIds.map((id) => (
                <Pill key={id} variant={serviceVariant(AWS_SERVICES[id].category)}>
                  {AWS_SERVICES[id].name}
                </Pill>
              ))}
            </div>
          ) : null}

          {step.codeSample ? (
            <div className="mt-4">
              <CodeBlock
                language={step.codeSample.language}
                code={step.codeSample.code}
                filename={step.codeSample.filename}
                caption={step.codeSample.explanation}
                verification={
                  verificationForServices(step.awsServiceIds) ?? undefined
                }
              />
            </div>
          ) : null}

          {step.callouts?.length ? (
            <div className="mt-4 flex flex-col gap-3">
              {step.callouts.map((c, ci) => (
                <Callout key={ci} variant={c.variant} title={c.title}>
                  {c.body}
                </Callout>
              ))}
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  )
}

export default function Build() {
  const [activeId, setActiveId] = useState<string>(
    () => localStorage.getItem(ACTIVE_KEY) ?? BUILD_TRACK[0].id,
  )
  const [done, setDone] = useState<Set<string>>(() => loadDone())

  useEffect(() => {
    localStorage.setItem(ACTIVE_KEY, activeId)
  }, [activeId])
  useEffect(() => {
    localStorage.setItem(DONE_KEY, JSON.stringify([...done]))
  }, [done])

  const stage = useMemo(
    () => BUILD_TRACK.find((s) => s.id === activeId) ?? BUILD_TRACK[0],
    [activeId],
  )
  const stageIndex = BUILD_TRACK.indexOf(stage)
  const nextStage = BUILD_TRACK[stageIndex + 1]

  const toggleDone = (id: string) =>
    setDone((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const goActive = (id: string) => {
    setActiveId(id)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:px-6">
      <header className="max-w-3xl">
        <Eyebrow>The build track</Eyebrow>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Build the Meridian end-state, stage by stage.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">
          A hands-on path from a first Strands agent to a deployed, secure,
          observable agentic-RAG system on Amazon Bedrock AgentCore. Every
          snippet is a reference implementation to adapt — not a script to run
          blindly.
        </p>
        <div className="mt-5">
          <Callout variant="note" title="This is a reference path, not a substitute for AWS docs">
            Following it on a real AWS account creates resources and incurs cost
            (models, retrieval, storage, a running runtime). Verify every
            fast-moving API against the current AWS documentation, and tear down
            what you’re not using.
          </Callout>
        </div>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
        {/* Left rail */}
        <nav aria-label="Build stages" className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-ink-muted">
            {done.size} / {BUILD_TRACK.length} complete
          </p>
          <ol className="flex flex-col gap-1">
            {BUILD_TRACK.map((s) => {
              const isActive = s.id === stage.id
              const isDone = done.has(s.id)
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => goActive(s.id)}
                    aria-current={isActive ? 'step' : undefined}
                    className={
                      'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ' +
                      (isActive
                        ? 'bg-neutral-100 font-medium text-ink'
                        : 'text-ink-muted hover:bg-neutral-100 hover:text-ink')
                    }
                  >
                    <span className="shrink-0">
                      {isDone ? (
                        <Check className="h-4 w-4 text-accent-strong" />
                      ) : (
                        <CircleDot
                          className={
                            'h-4 w-4 ' +
                            (isActive ? 'text-accent' : 'text-neutral-300')
                          }
                        />
                      )}
                    </span>
                    <span className="min-w-0 truncate">{s.title}</span>
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>

        {/* Active stage */}
        <article className="min-w-0">
          <Eyebrow>
            {stageIndex === 0
              ? 'Setup'
              : `Stage ${stageIndex} of ${BUILD_TRACK.length - 1}`}
          </Eyebrow>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {stage.title}
          </h2>
          <p className="mt-3 text-lg leading-relaxed text-ink-soft">
            {stage.goal}
          </p>

          {stage.prerequisites.length > 0 ? (
            <div className="mt-6 rounded-xl border border-hairline bg-neutral-0 p-5">
              <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
                Prerequisites
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
                {stage.prerequisites.map((p, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-ink-muted">•</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {(() => {
            const refs = atlasRefsFor(stage.steps.flatMap((s) => s.awsServiceIds))
            return refs.length ? (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-ink-muted">Learn the concepts:</span>
                {refs.map((r) => (
                  <AtlasLink key={r.topicId} atlas={r.atlas} topicId={r.topicId}>
                    {r.label}
                  </AtlasLink>
                ))}
              </div>
            ) : null
          })()}

          {stage.relatedArchitectureIds?.length ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-ink-muted">Realizes:</span>
              {stage.relatedArchitectureIds.map((aid) => (
                <Link
                  key={aid}
                  to={`/architecture/${aid}`}
                  className="inline-flex items-center gap-1 rounded-full border border-hairline px-2.5 py-0.5 text-xs font-medium text-accent-strong hover:bg-neutral-100"
                >
                  {ARCHITECTURES[aid].name}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              ))}
            </div>
          ) : null}

          <div className="mt-8">
            <StageStepper stage={stage} />
          </div>

          {/* What you should see */}
          <div className="mt-10">
            <Callout variant="tip" title="What you should see">
              <span className="flex items-start gap-2">
                <Eye className="mt-0.5 h-4 w-4 shrink-0" />
                {stage.whatYouShouldSee}
              </span>
            </Callout>
          </div>

          {/* Common pitfalls */}
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
            <p className="flex items-center gap-2 font-semibold text-ink">
              <TriangleAlert className="h-4 w-4 text-amber-600" />
              Common pitfalls
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-soft">
              {stage.commonPitfalls.map((p, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-amber-600">•</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Related demos/talks for this stage's patterns */}
          {stage.relatedArchitectureIds?.[0] ? (
            <div className="mt-10">
              <RelatedVideos patternId={stage.relatedArchitectureIds[0]} title="Watch" />
            </div>
          ) : null}

          {/* Stage footer: complete + next */}
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-6">
            <Button
              variant={done.has(stage.id) ? 'subtle' : 'primary'}
              onClick={() => toggleDone(stage.id)}
            >
              {done.has(stage.id) ? (
                <>
                  <Check className="h-4 w-4" />
                  Completed
                </>
              ) : (
                'Mark stage complete'
              )}
            </Button>
            {nextStage ? (
              <Button variant="ghost" onClick={() => goActive(nextStage.id)}>
                Next: {nextStage.title.replace(/^Stage [A-Z] — /, '')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Link to="/architecture/guardrailed_secure_rag">
                <Button variant="ghost">
                  See the end-state pattern
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </article>
      </div>
    </div>
  )
}
