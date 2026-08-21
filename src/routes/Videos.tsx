import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Clock, Search } from 'lucide-react'
import type { VideoEntry, VideoLevel, VideoTopic, TrustTier } from '../types'
import { Callout, Eyebrow } from '../components/ui'
import VideoCard from '../components/video/VideoCard'
import VideoPlayer from '../components/video/VideoPlayer'
import { Button } from '../components/ui'
import { BRAND } from '../config/brand'

const PAGE = 48
import {
  CURATION,
  FOCUS_LABEL,
  GENERATED_AT,
  VIDEOS,
  collectionVideos,
  daysSinceRefresh,
  isFocusVideo,
  relativeTime,
} from '../lib/videos'

const TOPICS: VideoTopic[] = [
  'agentcore', 'strands', 'rag', 'bedrock', 'vector-search',
  'guardrails', 'observability', 'multi-agent', 'well-architected', 'genai-general',
]
/** 'focus' is the default lens (see FOCUS_TOPICS); 'all' opens the whole library. */
type TopicFilter = VideoTopic | 'all' | 'focus'

const LEVELS: VideoLevel[] = ['intro', 'deep-dive', 'demo', 'talk']
const TIERS: TrustTier[] = ['official', 'curated', 'community']
const STALE_DAYS = 10

export default function Videos() {
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState<TopicFilter>('focus')
  const [level, setLevel] = useState<VideoLevel | 'all'>('all')
  const [tier, setTier] = useState<TrustTier | 'all'>('all')
  const [channel, setChannel] = useState<string>('all')
  const [sort, setSort] = useState<'newest' | 'relevance'>('newest')
  const [active, setActive] = useState<VideoEntry | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [params, setParams] = useSearchParams()

  // Deep-open a specific video via ?v=<id> (used by global search).
  useEffect(() => {
    const v = params.get('v')
    if (!v) return
    const found = VIDEOS.find((x) => x.id === v)
    if (found) setActive(found)
    params.delete('v')
    setParams(params, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const channels = useMemo(
    () => [...new Set(VIDEOS.map((v) => v.channelName))].sort(),
    [],
  )

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
    let list = VIDEOS.filter((v) => {
      if (topic === 'focus') {
        if (!isFocusVideo(v)) return false
      } else if (topic !== 'all' && !v.topics.includes(topic)) return false
      if (level !== 'all' && v.level !== level) return false
      if (tier !== 'all' && v.trustTier !== tier) return false
      if (channel !== 'all' && v.channelName !== channel) return false
      if (q && !`${v.title} ${v.channelName} ${v.topics.join(' ')}`.toLowerCase().includes(q)) return false
      return true
    })
    if (sort === 'newest' || !q) {
      list = list.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
    }
    return list
  }, [query, topic, level, tier, channel, sort])

  const collections = useMemo(
    () =>
      CURATION.collections
        .map((c) => ({ ...c, items: collectionVideos(c.videoIds) }))
        .filter((c) => c.items.length > 0),
    [],
  )

  const [shown, setShown] = useState(PAGE)
  useEffect(() => setShown(PAGE), [query, topic, level, tier, channel, sort])

  const stale = daysSinceRefresh() > STALE_DAYS
  const hasFilters = Boolean(query) || topic !== 'focus' || level !== 'all' || tier !== 'all' || channel !== 'all'

  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:px-6">
      <header className="max-w-3xl">
        <Eyebrow>Video library</Eyebrow>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Curated talks, demos &amp; deep dives
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">
          Talks, demos, and deep dives on AWS agentic architecture, Amazon
          Bedrock AgentCore, Strands, and RAG — refreshed daily from trusted
          channels.
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs text-ink-muted">
          <Clock className="h-3.5 w-3.5" />
          {VIDEOS.length > 0 ? `Last refreshed ${relativeTime(GENERATED_AT)}` : 'Not yet refreshed'}
        </p>
      </header>

      {stale && VIDEOS.length > 0 ? (
        <div className="mt-5 max-w-2xl">
          <Callout variant="note" title="Content may be out of date">
            The library hasn’t refreshed in over {STALE_DAYS} days. The scheduled
            job may be paused or failing.
          </Callout>
        </div>
      ) : null}

      {/* Search */}
      <div className="relative mt-8 max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            if (e.target.value) setSort('relevance')
          }}
          placeholder="Search videos…  ( press / )"
          aria-label="Search videos"
          className="h-10 w-full rounded-lg border border-hairline bg-neutral-0 pl-9 pr-3 text-sm text-ink focus-visible:ring-2 focus-visible:ring-accent"
        />
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-end gap-x-5 gap-y-3">
        <Select
          label="Topic"
          value={topic}
          onChange={(v) => setTopic(v as TopicFilter)}
          options={['focus', 'all', ...TOPICS]}
          labels={{ focus: FOCUS_LABEL }}
        />
        <Select label="Level" value={level} onChange={(v) => setLevel(v as VideoLevel | 'all')} options={['all', ...LEVELS]} />
        <Select label="Source" value={tier} onChange={(v) => setTier(v as TrustTier | 'all')} options={['all', ...TIERS]} />
        <Select label="Channel" value={channel} onChange={setChannel} options={['all', ...channels]} />
        <Select label="Sort" value={sort} onChange={(v) => setSort(v as 'newest' | 'relevance')} options={['newest', 'relevance']} />
      </div>

      {/* Collections (only when not filtering) */}
      {!hasFilters && collections.length > 0 ? (
        <div className="mt-10 space-y-8">
          {collections.map((c) => (
            <section key={c.id}>
              <h2 className="mb-3 font-display text-lg font-semibold text-ink">{c.title}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {c.items.slice(0, 4).map((v) => (
                  <VideoCard key={v.id} video={v} onOpen={setActive} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}

      {/* Grid */}
      <div className="mt-10">
        <p className="mb-3 text-sm text-ink-muted" aria-live="polite">
          {results.length} video{results.length === 1 ? '' : 's'}
          {topic === 'focus' ? (
            <>
              {' '}on {FOCUS_LABEL}.{' '}
              <button
                type="button"
                onClick={() => setTopic('all')}
                className="font-medium text-accent-strong hover:underline focus-visible:ring-2 focus-visible:ring-accent"
              >
                Browse the whole library
              </button>
            </>
          ) : null}
        </p>
        {VIDEOS.length === 0 ? (
          <div className="rounded-xl border border-dashed border-hairline p-10 text-center text-ink-muted">
            No videos yet. The daily refresh will populate this library once
            channels are verified in the registry.
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-xl border border-dashed border-hairline p-10 text-center text-ink-muted">
            No videos match those filters.
          </div>
        ) : (
          <>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {results.slice(0, shown).map((v) => (
                <li key={v.id}>
                  <VideoCard video={v} onOpen={setActive} />
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
          Videos are embedded from their original sources via YouTube’s player.
          GenArchitect does not host or own this content; all rights remain with
          the respective creators. The channel is always shown and every video
          links back to its source.
        </p>
        <p>{BRAND.disclaimer}</p>
      </div>

      <VideoPlayer video={active} onClose={() => setActive(null)} />
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
  labels,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  labels?: Record<string, string>
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
            {labels?.[o] ?? (o === 'all' ? 'All' : o)}
          </option>
        ))}
      </select>
    </div>
  )
}
