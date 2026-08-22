import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ExternalLink,
  X,
} from 'lucide-react'
import type { RagArchitectureId, ReferenceKind } from '../types'
import type { AwsServiceId } from '../types'
import { ARCHITECTURES, ARCHITECTURE_ORDER } from '../data/architectures'
import { AWS_SERVICES } from '../data/services'
import { VERIFICATION, verificationForServices } from '../data/verification'
import {
  failureModesAffecting,
  failureModesPreventedBy,
} from '../data/failureModes'
import { Button, Callout, Card, Eyebrow, Pill } from '../components/ui'
import SyncedWalkthrough from '../components/diagram/SyncedWalkthrough'
import CodeBlock from '../components/code/CodeBlock'
import FreshnessBadge from '../components/FreshnessBadge'
import ExportScaffold from '../components/ExportScaffold'
import DrawioExport from '../components/DrawioExport'
import AtlasLink from '../components/atlas/AtlasLink'
import RelatedVideos from '../components/video/RelatedVideos'
import RelatedUseCases from '../components/usecase/RelatedUseCases'
import { atlasRefFor } from '../atlas/links'
import { compositionFromPattern } from '../compose/composition'
import { notebooksForPattern } from '../data/notebookTemplates'
import {
  DIFFICULTY_LABELS,
  REFERENCE_KIND_LABELS,
  serviceVariant,
} from '../lib/display'

function NotFound() {
  return (
    <div className="mx-auto max-w-content px-4 py-24 text-center sm:px-6">
      <h1 className="text-2xl font-bold text-ink">Architecture not found</h1>
      <p className="mt-2 text-ink-muted">
        That pattern id doesn’t exist in the catalog.
      </p>
      <Link to="/catalog" className="mt-6 inline-block">
        <Button>Back to the catalog</Button>
      </Link>
    </div>
  )
}

function ListCard({
  title,
  items,
  tone,
}: {
  title: string
  items: string[]
  tone: 'good' | 'bad'
}) {
  const Icon = tone === 'good' ? Check : X
  return (
    <Card>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <ul className="mt-3 space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink-soft">
            <Icon
              className={
                'mt-0.5 h-4 w-4 shrink-0 ' +
                (tone === 'good' ? 'text-accent-strong' : 'text-ink-muted')
              }
            />
            {item}
          </li>
        ))}
      </ul>
    </Card>
  )
}

export default function ArchitectureDetail() {
  const { id } = useParams<{ id: string }>()

  // Scroll to top on id change.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [id])

  const arch = id ? ARCHITECTURES[id as RagArchitectureId] : undefined

  const nav = useMemo(() => {
    if (!arch) return { prev: undefined, next: undefined }
    const i = ARCHITECTURE_ORDER.indexOf(arch.id)
    return {
      prev: i > 0 ? ARCHITECTURES[ARCHITECTURE_ORDER[i - 1]] : undefined,
      next:
        i < ARCHITECTURE_ORDER.length - 1
          ? ARCHITECTURES[ARCHITECTURE_ORDER[i + 1]]
          : undefined,
    }
  }, [arch])

  // Services each code sample touches, derived from the walkthrough steps that
  // reference it — so a sample's freshness badge reflects its actual APIs.
  const sampleServices = useMemo(() => {
    const map = new Map<string, Set<AwsServiceId>>()
    if (!arch) return map
    for (const step of arch.walkthrough) {
      if (!step.codeSampleId) continue
      const set = map.get(step.codeSampleId) ?? new Set<AwsServiceId>()
      step.awsServiceIds.forEach((s) => set.add(s))
      map.set(step.codeSampleId, set)
    }
    return map
  }, [arch])

  const archVerification = useMemo(
    () => (arch ? verificationForServices(arch.awsServiceIds) : null),
    [arch],
  )

  const groupedRefs = useMemo(() => {
    if (!arch) return []
    const groups = new Map<ReferenceKind, typeof arch.references>()
    for (const ref of arch.references) {
      const list = groups.get(ref.kind)
      if (list) list.push(ref)
      else groups.set(ref.kind, [ref])
    }
    return [...groups.entries()]
  }, [arch])

  if (!arch) return <NotFound />

  return (
    <div className="mx-auto max-w-content px-4 py-10 sm:px-6">
      {/* Breadcrumb */}
      <Link
        to="/catalog"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Catalog
      </Link>

      {/* Header */}
      <header className="mt-4 max-w-3xl">
        <div className="flex items-center gap-3">
          <Pill variant="difficulty">{DIFFICULTY_LABELS[arch.difficulty]}</Pill>
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: arch.accentColor }}
            aria-hidden="true"
          />
        </div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          {arch.name}
        </h1>
        <p className="mt-3 text-lg text-ink-muted">{arch.tagline}</p>
        <p className="mt-6 leading-relaxed text-ink">{arch.summary}</p>
        <p className="mt-3 leading-relaxed text-ink-soft">
          {arch.technicalSummary}
        </p>
      </header>

      {/* Synced walkthrough — the centerpiece */}
      <section className="mt-14" aria-label="Guided walkthrough">
        <Eyebrow>How it works</Eyebrow>
        <h2 className="mb-6 mt-2 text-2xl font-bold tracking-tight text-ink">
          Guided walkthrough
        </h2>
        <SyncedWalkthrough
          architecture={arch}
          verification={archVerification ?? undefined}
        />
        <div className="mt-6 max-w-xl">
          <DrawioExport source={arch} name={arch.name} />
        </div>
      </section>

      {/* When to use / not */}
      <section className="mt-16 grid gap-4 lg:grid-cols-2">
        <ListCard title="When to use it" items={arch.whenToUse} tone="good" />
        <ListCard
          title="When not to use it"
          items={arch.whenNotToUse}
          tone="bad"
        />
      </section>

      {/* Enterprise considerations */}
      <section className="mt-6">
        <Callout variant="warning" title="Enterprise considerations">
          <ul className="list-disc space-y-1.5 pl-4">
            {arch.enterpriseConsiderations.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </Callout>
      </section>

      {/* Meridian tie-in — only for patterns that are actually a Meridian stage. */}
      {arch.meridianStage ? (
      <section className="mt-12">
        <Card
          eyebrow={<Eyebrow>How it solves Meridian</Eyebrow>}
          className="bg-accent/[0.04]"
        >
          <h3 className="text-xl font-semibold text-ink">
            {arch.meridianStage.stageTitle}
          </h3>
          <p className="mt-2 leading-relaxed text-ink-soft">
            {arch.meridianStage.whatItAdds}
          </p>
          {arch.meridianStage.narrative ? (
            <p className="mt-2 leading-relaxed text-ink-muted">
              {arch.meridianStage.narrative}
            </p>
          ) : null}
          <Link
            to="/use-case"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent-strong hover:underline"
          >
            See the full Meridian progression
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      </section>
      ) : null}

      {/* Failure modes */}
      {(() => {
        const prevents = failureModesPreventedBy(arch.id)
        const vulnerable = failureModesAffecting(arch.id)
        if (prevents.length === 0 && vulnerable.length === 0) return null
        return (
          <section className="mt-16">
            <Eyebrow>Failure modes</Eyebrow>
            <h2 className="mb-6 mt-2 text-2xl font-bold tracking-tight text-ink">
              What it prevents — and what to still watch
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="font-mono text-[11px] uppercase tracking-wide text-emerald-700">
                  Prevents
                </p>
                {prevents.length ? (
                  <ul className="mt-2 space-y-1.5">
                    {prevents.map((f) => (
                      <li key={f.id}>
                        <Link
                          to="/failure-modes"
                          className="text-sm text-ink-soft hover:text-accent-strong hover:underline"
                        >
                          {f.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-ink-muted">
                    This is a foundational pattern — later patterns prevent more.
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <p className="font-mono text-[11px] uppercase tracking-wide text-amber-700">
                  Still vulnerable to
                </p>
                {vulnerable.length ? (
                  <ul className="mt-2 space-y-1.5">
                    {vulnerable.map((f) => (
                      <li key={f.id}>
                        <Link
                          to="/failure-modes"
                          className="text-sm text-ink-soft hover:text-accent-strong hover:underline"
                        >
                          {f.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-ink-muted">
                    Nothing major on our list — this is the hardened end-state.
                  </p>
                )}
              </div>
            </div>
          </section>
        )
      })()}

      {/* AWS building blocks */}
      <section className="mt-16">
        <Eyebrow>AWS building blocks</Eyebrow>
        <h2 className="mb-6 mt-2 text-2xl font-bold tracking-tight text-ink">
          What it’s built from
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {arch.awsServiceIds.map((sid) => {
            const svc = AWS_SERVICES[sid]
            return (
              <div
                key={sid}
                className="rounded-xl border border-hairline bg-neutral-0 p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-ink">{svc.name}</h3>
                  <Pill variant={serviceVariant(svc.category)}>
                    {svc.category}
                  </Pill>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {svc.oneLiner}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  <span className="font-mono text-[11px] uppercase tracking-wide">
                    When —{' '}
                  </span>
                  {svc.whenToUse}
                </p>
                {atlasRefFor(sid) ? (
                  <div className="mt-3">
                    <AtlasLink atlas={atlasRefFor(sid)!.atlas} topicId={atlasRefFor(sid)!.topicId}>
                      Learn the concept
                    </AtlasLink>
                  </div>
                ) : null}
                <div className="mt-3 border-t border-hairline pt-2">
                  <FreshnessBadge verification={VERIFICATION[sid]} />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Full code samples */}
      <section className="mt-16">
        <Eyebrow>Just the code</Eyebrow>
        <h2 className="mb-2 mt-2 text-2xl font-bold tracking-tight text-ink">
          Reference implementations
        </h2>
        <p className="mb-4 max-w-2xl text-sm text-ink-muted">
          Every sample is reference-only — the app never executes code. Treat
          fast-moving SDK/CLI syntax as a shape to verify against current AWS
          docs.
        </p>
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <ExportScaffold
            composition={compositionFromPattern(arch.id)}
            label="Export starter project"
          />
          {notebooksForPattern(arch.id).length > 0 ? (
            <Link
              to={`/notebooks/${notebooksForPattern(arch.id)[0].id}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-strong hover:underline"
            >
              Open as a notebook
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
        <div className="flex flex-col gap-8">
          {arch.codeSamples.map((sample) => (
            <div key={sample.id}>
              <h3 className="mb-2 text-base font-semibold text-ink">
                {sample.title}
              </h3>
              <CodeBlock
                language={sample.language}
                code={sample.code}
                filename={sample.filename}
                caption={sample.explanation}
                verification={
                  verificationForServices([
                    ...(sampleServices.get(sample.id) ?? []),
                  ]) ?? undefined
                }
                annotations={sample.annotations}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Related videos + real-world use cases (each renders nothing if none match) */}
      <section className="mt-12 space-y-10">
        <RelatedUseCases patternId={arch.id} title="In the wild" />
        <RelatedVideos patternId={arch.id} title="Watch" />
      </section>

      {/* References */}
      <section className="mt-16">
        <Eyebrow>References &amp; docs</Eyebrow>
        <h2 className="mb-6 mt-2 text-2xl font-bold tracking-tight text-ink">
          Curated, real AWS references
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {groupedRefs.map(([kind, refs]) => (
            <div key={kind}>
              <p className="mb-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-ink-muted">
                <BookOpen className="h-3.5 w-3.5" />
                {REFERENCE_KIND_LABELS[kind]}
              </p>
              <ul className="space-y-2">
                {refs.map((ref) => (
                  <li key={ref.url}>
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-start gap-1.5 text-sm text-accent-strong hover:underline"
                    >
                      <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {ref.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Prev / Next */}
      <nav className="mt-16 grid gap-4 border-t border-hairline pt-8 sm:grid-cols-2">
        {nav.prev ? (
          <Link
            to={`/architecture/${nav.prev.id}`}
            className="group rounded-xl border border-hairline bg-neutral-0 p-5 transition-shadow hover:shadow-md"
          >
            <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-ink-muted">
              <ArrowLeft className="h-3.5 w-3.5" />
              Previous
            </span>
            <p className="mt-1 font-semibold text-ink">{nav.prev.name}</p>
          </Link>
        ) : (
          <span />
        )}
        {nav.next ? (
          <Link
            to={`/architecture/${nav.next.id}`}
            className="group rounded-xl border border-hairline bg-neutral-0 p-5 text-right transition-shadow hover:shadow-md"
          >
            <span className="flex items-center justify-end gap-1.5 font-mono text-[11px] uppercase tracking-wide text-ink-muted">
              Next
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
            <p className="mt-1 font-semibold text-ink">{nav.next.name}</p>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  )
}
