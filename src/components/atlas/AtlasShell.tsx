import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ExternalLink,
  ListChecks,
  Menu,
  Search,
} from 'lucide-react'
import clsx from 'clsx'
import type { AtlasId, AtlasSection, AtlasTopic } from '../../atlas/types'
import { flattenTopics } from '../../atlas/types'
import { VERIFICATION } from '../../data/verification'
import { verificationForServices } from '../../data/verification'
import { Callout, Eyebrow, Pill } from '../ui'
import CodeBlock from '../code/CodeBlock'
import FreshnessBadge from '../FreshnessBadge'
import RelatedVideos from '../video/RelatedVideos'
import AtlasVisualView from './AtlasVisual'

export interface AtlasShellProps {
  atlasId: AtlasId
  title: string
  tagline: string
  sections: AtlasSection[]
  activeTopicId?: string
}

const COVERAGE_LABEL: Record<string, string> = {
  full: 'Full',
  overview: 'Overview',
  planned: 'Planned',
}

export default function AtlasShell({
  atlasId,
  title,
  tagline,
  sections,
  activeTopicId,
}: AtlasShellProps) {
  const [query, setQuery] = useState('')
  const [navOpen, setNavOpen] = useState(false)

  const ordered = useMemo(() => flattenTopics(sections), [sections])
  const byId = useMemo(() => new Map(ordered.map((t) => [t.id, t])), [ordered])
  const topic = activeTopicId ? byId.get(activeTopicId) : undefined

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null
    return ordered.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.oneLiner.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q)),
    )
  }, [query, ordered])

  const idx = topic ? ordered.findIndex((t) => t.id === topic.id) : -1
  const prev = idx > 0 ? ordered[idx - 1] : undefined
  const next = idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : undefined

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center justify-between">
            <Link to={`/${atlasId}`} className="font-display text-lg font-bold text-ink">
              {title}
            </Link>
            <button
              type="button"
              onClick={() => setNavOpen((v) => !v)}
              className="rounded-md p-1.5 text-ink-muted hover:bg-neutral-100 lg:hidden"
              aria-label="Toggle contents"
              aria-expanded={navOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-ink-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search this atlas"
              aria-label="Search this atlas"
              className="h-9 w-full rounded-md border border-hairline bg-neutral-0 pl-8 pr-2 text-sm text-ink focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>

          <Link
            to={`/${atlasId}/coverage`}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent-strong hover:underline"
          >
            <ListChecks className="h-4 w-4" />
            Coverage map
          </Link>

          <nav
            aria-label={`${title} contents`}
            className={clsx('mt-4', !navOpen && 'hidden lg:block')}
          >
            {matches ? (
              <ul className="flex flex-col gap-0.5">
                {matches.map((t) => (
                  <SidebarLink key={t.id} atlasId={atlasId} topic={t} active={t.id === activeTopicId} />
                ))}
                {matches.length === 0 ? (
                  <li className="px-2 py-1 text-sm text-ink-muted">No matches.</li>
                ) : null}
              </ul>
            ) : (
              <div className="flex flex-col gap-4">
                {sections.map((s) => (
                  <div key={s.id}>
                    <p className="px-2 font-mono text-[11px] uppercase tracking-wide text-ink-muted">
                      {s.title}
                    </p>
                    <ul className="mt-1 flex flex-col gap-0.5">
                      {s.topics.map((t) => (
                        <SidebarLink key={t.id} atlasId={atlasId} topic={t} active={t.id === activeTopicId} />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </nav>
        </aside>

        {/* Content */}
        <main className="min-w-0">
          {topic ? (
            <TopicView atlasId={atlasId} atlasTitle={title} topic={topic} byId={byId} prev={prev} next={next} />
          ) : (
            <Landing atlasId={atlasId} title={title} tagline={tagline} sections={sections} />
          )}
        </main>
      </div>
    </div>
  )
}

function SidebarLink({
  atlasId,
  topic,
  active,
}: {
  atlasId: AtlasId
  topic: AtlasTopic
  active: boolean
}) {
  return (
    <li>
      <Link
        to={`/${atlasId}/${topic.id}`}
        aria-current={active ? 'page' : undefined}
        className={clsx(
          'block rounded-md px-2 py-1.5 text-sm transition-colors',
          active
            ? 'bg-neutral-100 font-medium text-ink'
            : 'text-ink-muted hover:bg-neutral-100 hover:text-ink',
        )}
      >
        {topic.title}
      </Link>
    </li>
  )
}

function Landing({
  atlasId,
  title,
  tagline,
  sections,
}: {
  atlasId: AtlasId
  title: string
  tagline: string
  sections: AtlasSection[]
}) {
  return (
    <div>
      <Eyebrow>Visual atlas</Eyebrow>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">{tagline}</p>

      <div className="mt-6 max-w-2xl">
        <Callout variant="note" title="Original explanations — not copied docs">
          Everything here is written in our own words and taught visually. Follow
          the “Read the official docs” link on any topic for exact syntax and API
          detail. GenArchitect is not affiliated with, sponsored by, or endorsed
          by {atlasId === 'agentcore' ? 'AWS' : 'the Strands project'}.
        </Callout>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <div key={s.id} className="rounded-xl border border-hairline bg-neutral-0 p-5">
            <h2 className="font-display text-lg font-semibold text-ink">{s.title}</h2>
            <p className="mt-1 text-sm text-ink-soft">{s.blurb}</p>
            <ul className="mt-3 flex flex-col gap-1">
              {s.topics.map((t) => (
                <li key={t.id}>
                  <Link
                    to={`/${atlasId}/${t.id}`}
                    className="text-sm text-ink-muted hover:text-accent-strong hover:underline"
                  >
                    {t.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

function TopicView({
  atlasId,
  atlasTitle,
  topic,
  byId,
  prev,
  next,
}: {
  atlasId: AtlasId
  atlasTitle: string
  topic: AtlasTopic
  byId: Map<string, AtlasTopic>
  prev?: AtlasTopic
  next?: AtlasTopic
}) {
  const verification = topic.verificationId
    ? VERIFICATION[topic.verificationId]
    : null

  return (
    <article>
      <Link
        to={`/${atlasId}`}
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        {atlasTitle}
      </Link>

      <div className="mt-3 flex items-center gap-2">
        <Pill variant={topic.coverageStatus === 'full' ? 'managed' : 'neutral'}>
          {COVERAGE_LABEL[topic.coverageStatus]} coverage
        </Pill>
      </div>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        {topic.title}
      </h1>
      <p className="mt-2 text-lg text-ink-muted">{topic.oneLiner}</p>

      <div className="mt-4">
        <Callout variant="tip" title="Why it matters">
          {topic.whyItMatters}
        </Callout>
      </div>

      {/* Visual */}
      {topic.visual.kind !== 'none' ? (
        <div className="mt-8 rounded-xl border border-hairline bg-neutral-0 p-5">
          <AtlasVisualView visual={topic.visual} atlasId={atlasId} codeSamples={topic.codeSamples} />
        </div>
      ) : null}

      {/* Explanation */}
      <div className="mt-8 max-w-2xl">
        <p className="text-[15px] leading-relaxed text-ink">{topic.explanation.plain}</p>
        <p className="mt-3 leading-relaxed text-ink-soft">{topic.explanation.technical}</p>
      </div>

      {/* Code samples */}
      {topic.codeSamples && topic.codeSamples.length ? (
        <div className="mt-8 flex flex-col gap-6">
          {topic.codeSamples.map((s) => (
            <div key={s.id}>
              <h3 className="mb-2 text-sm font-semibold text-ink">{s.title}</h3>
              <CodeBlock
                language={s.language === 'typescript' ? 'typescript' : s.language}
                code={s.code}
                filename={s.filename}
                verification={
                  s.verifyServices
                    ? (verificationForServices(s.verifyServices) ?? undefined)
                    : undefined
                }
              />
            </div>
          ))}
        </div>
      ) : null}

      {/* Applied in + related */}
      {(topic.appliedIn?.length || topic.relatedTopicIds?.length) ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {topic.appliedIn?.length ? (
            <div className="rounded-xl border border-hairline bg-neutral-0 p-5">
              <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
                Where it’s applied
              </p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {topic.appliedIn.map((a) => (
                  <li key={a.to}>
                    <Link to={a.to} className="text-sm text-accent-strong hover:underline">
                      {a.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {topic.relatedTopicIds?.length ? (
            <div className="rounded-xl border border-hairline bg-neutral-0 p-5">
              <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
                Related topics
              </p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {topic.relatedTopicIds.map((rid) => {
                  const r = byId.get(rid)
                  return r ? (
                    <li key={rid}>
                      <Link to={`/${atlasId}/${rid}`} className="text-sm text-accent-strong hover:underline">
                        {r.title}
                      </Link>
                    </li>
                  ) : null
                })}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Official docs */}
      <div className="mt-8 rounded-xl border border-hairline bg-neutral-50 p-5">
        <a
          href={topic.docUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 font-medium text-accent-strong hover:underline"
        >
          <BookOpen className="h-4 w-4" />
          Read the official docs
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        {verification ? (
          <div className="mt-2">
            <FreshnessBadge verification={verification} />
          </div>
        ) : null}
      </div>

      {/* Related talks (renders nothing if none match) */}
      <div className="mt-8">
        <RelatedVideos atlasTopicId={topic.id} title="Related talks" />
      </div>

      {/* Prev / next */}
      <nav className="mt-10 grid gap-4 border-t border-hairline pt-6 sm:grid-cols-2">
        {prev ? (
          <Link to={`/${atlasId}/${prev.id}`} className="rounded-xl border border-hairline bg-neutral-0 p-4 transition-shadow hover:shadow-md">
            <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-ink-muted">
              <ArrowLeft className="h-3.5 w-3.5" />
              Previous
            </span>
            <p className="mt-1 font-semibold text-ink">{prev.title}</p>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link to={`/${atlasId}/${next.id}`} className="rounded-xl border border-hairline bg-neutral-0 p-4 text-right transition-shadow hover:shadow-md">
            <span className="flex items-center justify-end gap-1.5 font-mono text-[11px] uppercase tracking-wide text-ink-muted">
              Next
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
            <p className="mt-1 font-semibold text-ink">{next.title}</p>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  )
}
