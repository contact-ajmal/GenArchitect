import { useEffect, useMemo, useRef, useState } from 'react'
import { Clock, Pin, Search } from 'lucide-react'
import type { UpdateKind, UpdateTopic } from '../types'
import { Callout, Eyebrow, Button } from '../components/ui'
import UpdateCard from '../components/updates/UpdateCard'
import { BRAND } from '../config/brand'
import { relativeTime } from '../lib/videos'
import {
  PINNED_UPDATES,
  UPDATES,
  UPDATES_GENERATED_AT,
  UPDATE_SOURCES,
  UPDATE_TOPICS,
  daysSinceUpdateRefresh,
} from '../lib/updates'

const PAGE = 40
const STALE_DAYS = 4 // these feeds move daily, so staleness shows sooner than video
const KINDS: UpdateKind[] = ['blog', 'announcement']

export default function Updates() {
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState<UpdateTopic | 'all'>('all')
  const [kind, setKind] = useState<UpdateKind | 'all'>('all')
  const [source, setSource] = useState<string>('all')
  const [shown, setShown] = useState(PAGE)
  const searchRef = useRef<HTMLInputElement>(null)

  // "/" focuses search (unless already typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement
      const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
      if (e.key === '/' && !typing) {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return UPDATES.filter((u) => {
      if (topic !== 'all' && !u.topics.includes(topic)) return false
      if (kind !== 'all' && u.kind !== kind) return false
      if (source !== 'all' && u.sourceName !== source) return false
      if (q && !`${u.title} ${u.sourceName} ${u.excerpt ?? ''} ${u.topics.join(' ')}`.toLowerCase().includes(q)) {
        return false
      }
      return true
    })
  }, [query, topic, kind, source])

  useEffect(() => setShown(PAGE), [query, topic, kind, source])

  const stale = daysSinceUpdateRefresh() > STALE_DAYS
  const filtering = Boolean(query) || topic !== 'all' || kind !== 'all' || source !== 'all'

  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:px-6">
      <header className="max-w-3xl">
        <Eyebrow>Latest</Eyebrow>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          What&rsquo;s new across AWS GenAI
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">
          Launches, blog posts and deep dives on Bedrock, AgentCore, Strands and
          RAG &mdash; pulled daily from AWS&rsquo;s own feeds and filtered down
          to what actually concerns agentic architecture.
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted">
          <Clock className="h-3.5 w-3.5" />
          {UPDATES.length > 0 ? `Last refreshed ${relativeTime(UPDATES_GENERATED_AT)}` : 'Not yet refreshed'}
        </p>
      </header>

      {stale && UPDATES.length > 0 ? (
        <div className="mt-5 max-w-2xl">
          <Callout variant="note" title="Feed may be out of date">
            No refresh in over {STALE_DAYS} days. The scheduled job may be
            paused or failing.
          </Callout>
        </div>
      ) : null}

      {/* Pinned — the curation layer's front page. */}
      {!filtering && PINNED_UPDATES.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 inline-flex items-center gap-1.5 font-display text-lg font-semibold text-ink">
            <Pin className="h-4 w-4 text-accent-strong" />
            Worth your time
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {PINNED_UPDATES.map((u) => (
              <UpdateCard key={u.id} update={u} featured />
            ))}
          </div>
        </section>
      ) : null}

      {/* Search */}
      <div className="relative mt-8 max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search updates…  ( press / )"
          aria-label="Search updates"
          className="h-10 w-full rounded-lg border border-hairline bg-neutral-0 pl-9 pr-3 text-sm text-ink focus-visible:ring-2 focus-visible:ring-accent"
        />
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-end gap-x-5 gap-y-3">
        <Select label="Topic" value={topic} onChange={(v) => setTopic(v as UpdateTopic | 'all')} options={['all', ...UPDATE_TOPICS]} />
        <Select label="Type" value={kind} onChange={(v) => setKind(v as UpdateKind | 'all')} options={['all', ...KINDS]} />
        <Select label="Source" value={source} onChange={setSource} options={['all', ...UPDATE_SOURCES]} />
      </div>

      {/* Feed */}
      <div className="mt-8">
        <p className="mb-3 text-sm text-ink-muted" aria-live="polite">
          {results.length} update{results.length === 1 ? '' : 's'}
        </p>
        {UPDATES.length === 0 ? (
          <div className="rounded-xl border border-dashed border-hairline p-10 text-center text-ink-muted">
            No updates yet. The daily refresh will populate this feed on its
            next run.
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-xl border border-dashed border-hairline p-10 text-center text-ink-muted">
            No updates match those filters.
          </div>
        ) : (
          <>
            <ul className="space-y-3">
              {results.slice(0, shown).map((u) => (
                <li key={u.id}>
                  <UpdateCard update={u} />
                </li>
              ))}
            </ul>
            {results.length > shown ? (
              <div className="mt-8 text-center">
                <Button variant="subtle" onClick={() => setShown((n) => n + PAGE)}>
                  Show more ({results.length - shown} more)
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Attribution + non-affiliation */}
      <div className="mt-10 space-y-2 border-t border-hairline pt-6 text-xs leading-relaxed text-ink-muted">
        <p>
          Headlines and excerpts come from AWS&rsquo;s public RSS feeds and
          remain the work of their authors. GenArchitect links to the original
          on aws.amazon.com and never reproduces a full article. Sources are
          listed in <code className="font-mono">data/feeds.json</code>.
        </p>
        <p>{BRAND.disclaimer}</p>
      </div>
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <div>
      <label className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-ink-muted">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-md border border-hairline bg-neutral-0 px-2 text-sm text-ink focus-visible:ring-2 focus-visible:ring-accent"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o === 'all' ? 'All' : o}
          </option>
        ))}
      </select>
    </div>
  )
}
