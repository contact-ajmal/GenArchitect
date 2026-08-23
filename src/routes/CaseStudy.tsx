import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ExternalLink,
  FlaskConical,
  ScrollText,
} from 'lucide-react'
import clsx from 'clsx'
import type {
  CaseStudyDiagram,
  CaseStudySource,
  ClaimConfidence,
} from '../types'
import { Button, Callout, Eyebrow, Pill, StepDots } from '../components/ui'
import RagDiagram from '../components/diagram/RagDiagram'
import DrawioExport from '../components/DrawioExport'
import AtlasLink from '../components/atlas/AtlasLink'
import RelatedVideos from '../components/video/RelatedVideos'
import { caseStudyFor } from '../data/caseStudies'
import { USE_CASES } from '../lib/usecases'
import { ARCHITECTURES } from '../data/architectures'

/**
 * A long-form architecture read on one real deployment.
 *
 * The organising constraint is provenance. These are real companies that
 * mostly have not published architectures, so the page never lets a claim
 * float free of where it came from: every step and every lesson renders a
 * badge that either links the sources backing it or states what the inference
 * rests on. The provenance callout is not dismissible and sits above the first
 * diagram on purpose.
 */
export default function CaseStudy() {
  const { id } = useParams<{ id: string }>()
  const study = id ? caseStudyFor(id) : undefined
  const entry = useMemo(() => USE_CASES.find((u) => u.id === id), [id])

  if (!study) {
    return (
      <div className="mx-auto max-w-content px-4 py-24 text-center sm:px-6">
        <h1 className="font-display text-2xl font-bold text-ink">
          No deep dive for this case study
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Most entries in the library are cards. Deep dives exist only where
          enough has been published to reconstruct an architecture honestly.
        </p>
        <Link
          to="/use-cases"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent-strong hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to case studies
        </Link>
      </div>
    )
  }

  const sourceById = new Map(study.sources.map((s) => [s.id, s]))

  return (
    <div className="mx-auto max-w-content px-4 py-10 sm:px-6">
      <Link
        to="/use-cases"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Case studies
      </Link>

      <header className="mt-6 max-w-3xl">
        <Eyebrow>Case study deep dive</Eyebrow>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          {study.company}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">{study.headline}</p>

        {entry ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {entry.agentPattern ? <Pill variant="neutral">{entry.agentPattern}</Pill> : null}
            {entry.services.map((s) => (
              <Pill key={s} variant="aws">
                {s}
              </Pill>
            ))}
            {entry.year ? <Pill variant="neutral">{entry.year}</Pill> : null}
          </div>
        ) : null}
      </header>

      {/* Provenance — the contract with the reader, before anything else. */}
      <div className="mt-8 max-w-3xl">
        <Callout variant="warning" title="What is documented, and what is ours">
          {study.provenance}
        </Callout>
      </div>

      {/* Narrative */}
      <div className="mt-12 max-w-3xl">
        {study.sections.map((section) => (
          <section key={section.id} className="mt-10 first:mt-0">
            <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
              {section.title}
            </h2>
            <div className="mt-3 space-y-4 text-base leading-relaxed text-ink-soft">
              {section.body.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Architecture views */}
      {study.diagrams.map((diagram) => (
        <DiagramView key={diagram.id} diagram={diagram} sourceById={sourceById} />
      ))}

      {/* Lessons */}
      <section className="mt-16 max-w-3xl">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
          What to take from it
        </h2>
        <ul className="mt-4 flex flex-col gap-3">
          {study.lessons.map((lesson, i) => (
            <li
              key={i}
              className="rounded-xl border border-hairline bg-neutral-0 p-4"
            >
              <p className="text-sm leading-relaxed text-ink-soft">{lesson.text}</p>
              <div className="mt-2">
                <Provenance
                  confidence={lesson.confidence}
                  sourceIds={lesson.sourceIds}
                  basis={lesson.basis}
                  sourceById={sourceById}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Where this sits in the catalog */}
      <section className="mt-16">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
          The patterns it resembles
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {study.relatedPatternIds.map((pid) => {
            const arch = ARCHITECTURES[pid]
            return (
              <Link
                key={pid}
                to={`/architecture/${pid}`}
                className="group rounded-xl border border-hairline bg-neutral-0 p-4 transition-shadow hover:shadow-md"
              >
                <p className="font-display font-semibold text-ink">{arch.name}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                  {arch.tagline}
                </p>
              </Link>
            )
          })}
        </div>

        {study.relatedAtlasTopics?.length ? (
          <div className="mt-6">
            <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
              Learn the concepts
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {study.relatedAtlasTopics.map((t) => (
                <AtlasLink key={`${t.atlas}/${t.topicId}`} atlas={t.atlas} topicId={t.topicId}>
                  {t.label}
                </AtlasLink>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <RelatedVideos patternId={study.relatedPatternIds[0]} />

      {/* Sources */}
      <section className="mt-16 max-w-3xl">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
          Sources
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Everything marked “documented” on this page traces to one of these. We
          summarise in our own words and link out rather than reproducing them.
        </p>
        <ul className="mt-4 flex flex-col gap-2">
          {study.sources.map((s) => (
            <li key={s.id}>
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="group flex items-start gap-2 rounded-lg border border-hairline bg-neutral-0 px-4 py-3 transition-colors hover:bg-neutral-50"
              >
                <ScrollText className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink group-hover:underline">
                    {s.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-muted">
                    {s.publisher}
                    {s.date ? ` · ${s.date}` : ''} ·{' '}
                    {s.tier === 'official' ? 'published by the vendor or the firm' : 'reported'}
                  </span>
                </span>
                <ExternalLink className="ml-auto mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-muted" />
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-ink-muted">
          GenArchitect is not affiliated with, sponsored by, or endorsed by
          Bridgewater Associates, AWS, or Anthropic. Company and product names
          are the trademarks of their respective owners.
        </p>
      </section>
    </div>
  )
}

/** One architecture view with its stepped read and a draw.io export. */
function DiagramView({
  diagram,
  sourceById,
}: {
  diagram: CaseStudyDiagram
  sourceById: Map<string, CaseStudySource>
}) {
  const [active, setActive] = useState(0)
  const steps = [...diagram.steps].sort((a, b) => a.order - b.order)
  const step = steps[active]

  return (
    <section className="mt-16">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
          {diagram.title}
        </h2>
        <span
          className={clsx(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide',
            diagram.kind === 'documented'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
              : 'border-amber-300 bg-amber-50 text-amber-800',
          )}
        >
          {diagram.kind === 'documented' ? (
            <BookOpen className="h-3.5 w-3.5" />
          ) : (
            <FlaskConical className="h-3.5 w-3.5" />
          )}
          {diagram.kind === 'documented' ? 'As publicly described' : 'Our reconstruction'}
        </span>
      </div>

      <p className="mt-3 max-w-3xl text-base leading-relaxed text-ink-soft">
        {diagram.blurb}
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-hairline bg-neutral-0 p-4">
        <RagDiagram
          architecture={diagram.diagram}
          highlightedComponentIds={step?.diagramComponentIds}
        />
      </div>

      {/* Stepped read */}
      {steps.length ? (
        <div className="mt-4 rounded-xl border border-hairline bg-neutral-0 p-5">
          <StepDots
            total={steps.length}
            current={active}
            labels={steps.map((s) => s.title)}
            onStepClick={setActive}
          />

          <h3 className="mt-4 font-display text-lg font-semibold text-ink">
            {step.order}. {step.title}
          </h3>
          <p className="mt-2 text-base leading-relaxed text-ink-soft">{step.plain}</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            {step.technical}
          </p>

          <div className="mt-3">
            <Provenance
              confidence={step.confidence}
              sourceIds={step.sourceIds}
              basis={step.basis}
              sourceById={sourceById}
            />
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <Button
              variant="subtle"
              size="sm"
              onClick={() => setActive((i) => Math.max(0, i - 1))}
              disabled={active === 0}
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="subtle"
              size="sm"
              onClick={() => setActive((i) => Math.min(steps.length - 1, i + 1))}
              disabled={active === steps.length - 1}
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-4">
        <DrawioExport source={diagram.diagram} name={diagram.diagram.name} />
      </div>
    </section>
  )
}

/** Where a claim came from — a link to sources, or the basis for an inference. */
function Provenance({
  confidence,
  sourceIds,
  basis,
  sourceById,
}: {
  confidence: ClaimConfidence
  sourceIds?: string[]
  basis?: string
  sourceById: Map<string, CaseStudySource>
}) {
  if (confidence === 'sourced') {
    const cited = (sourceIds ?? [])
      .map((sid) => sourceById.get(sid))
      .filter((s): s is CaseStudySource => Boolean(s))
    return (
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-emerald-800">
          Documented
        </span>
        {cited.map((s) => (
          <a
            key={s.id}
            href={s.url}
            target="_blank"
            rel="noreferrer"
            // Two sources can share a publisher (an AWS blog and an AWS talk),
            // so the full label is disclosed on hover.
            title={s.label}
            className="underline decoration-dotted underline-offset-2 hover:text-ink"
          >
            {s.publisher}
          </a>
        ))}
      </p>
    )
  }

  return (
    <p className="flex flex-wrap items-start gap-x-2 gap-y-1 text-xs text-ink-muted">
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-amber-800">
        Our inference
      </span>
      {basis ? <span className="min-w-0">{basis}</span> : null}
    </p>
  )
}
