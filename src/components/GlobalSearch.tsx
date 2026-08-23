import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, Search } from 'lucide-react'
import clsx from 'clsx'
import { flattenTopics } from '../atlas/types'
import { STRANDS_SECTIONS } from '../data/atlas/strands'
import { AGENTCORE_SECTIONS } from '../data/atlas/agentcore'
import { RETRIEVAL_SECTIONS } from '../data/atlas/retrieval'
import { ARCHITECTURE_LIST } from '../data/architectures'
import { FEATURED_NOTEBOOKS } from '../data/notebookTemplates'
import { FAILURE_MODES } from '../data/failureModes'
import { VIDEOS } from '../lib/videos'
import { INDUSTRY_LABELS, USE_CASES } from '../lib/usecases'
import { hasDeepDive } from '../data/caseStudies'

type Kind = 'Atlas' | 'Pattern' | 'Notebook' | 'Failure mode' | 'Video' | 'Case study'

interface Item {
  kind: Kind
  title: string
  subtitle: string
  to: string
  haystack: string
}

const KIND_ORDER: Kind[] = ['Atlas', 'Pattern', 'Notebook', 'Failure mode', 'Video', 'Case study']

function buildIndex(): Item[] {
  const items: Item[] = []
  for (const topic of [
    ...flattenTopics(STRANDS_SECTIONS),
    ...flattenTopics(AGENTCORE_SECTIONS),
    ...flattenTopics(RETRIEVAL_SECTIONS),
  ]) {
    items.push({
      kind: 'Atlas',
      title: topic.title,
      subtitle: topic.oneLiner,
      to: `/${topic.atlasId}/${topic.id}`,
      haystack: `${topic.title} ${topic.oneLiner} ${topic.tags.join(' ')}`.toLowerCase(),
    })
  }
  for (const a of ARCHITECTURE_LIST) {
    items.push({ kind: 'Pattern', title: a.name, subtitle: a.tagline, to: `/architecture/${a.id}`, haystack: `${a.name} ${a.tagline}`.toLowerCase() })
  }
  for (const n of FEATURED_NOTEBOOKS) {
    items.push({ kind: 'Notebook', title: n.title, subtitle: n.flavor.industry, to: `/notebooks/${n.id}`, haystack: `${n.title} ${n.flavor.name} ${n.flavor.industry}`.toLowerCase() })
  }
  for (const f of FAILURE_MODES) {
    items.push({ kind: 'Failure mode', title: f.title, subtitle: f.symptom, to: '/failure-modes', haystack: `${f.title} ${f.symptom}`.toLowerCase() })
  }
  for (const v of VIDEOS) {
    items.push({ kind: 'Video', title: v.title, subtitle: v.channelName, to: `/videos?v=${v.id}`, haystack: `${v.title} ${v.channelName} ${v.topics.join(' ')}`.toLowerCase() })
  }
  for (const u of USE_CASES) {
    // A deep dive is a real destination; without one the best we can do is
    // land on the library pre-filtered to the company.
    const to = hasDeepDive(u.id)
      ? `/use-cases/${u.id}`
      : `/use-cases?q=${encodeURIComponent(u.company)}`
    const subtitle = hasDeepDive(u.id)
      ? `${INDUSTRY_LABELS[u.industry]} · architecture deep dive`
      : INDUSTRY_LABELS[u.industry]
    items.push({ kind: 'Case study', title: `${u.company} — ${u.title}`, subtitle, to, haystack: `${u.company} ${u.title} ${u.summary} ${u.services.join(' ')}`.toLowerCase() })
  }
  return items
}

export default function GlobalSearch() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const index = useMemo(buildIndex, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return [] as Item[]
    return index.filter((it) => it.haystack.includes(q)).slice(0, 40)
  }, [index, query])

  // Group results while keeping a flat, keyboard-navigable order.
  const flat = useMemo(() => {
    const out: Item[] = []
    for (const kind of KIND_ORDER) out.push(...results.filter((r) => r.kind === kind))
    return out
  }, [results])

  // Global open shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(true)
      }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-search', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-search', onOpen)
    }
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0)
    else {
      setQuery('')
      setActive(0)
    }
  }, [open])

  useEffect(() => setActive(0), [query])

  if (!open) return null

  const go = (to: string) => {
    setOpen(false)
    navigate(to)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false)
    else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(flat.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter' && flat[active]) {
      e.preventDefault()
      go(flat[active].to)
    }
  }

  let flatIdx = -1

  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center bg-ink/40 p-4 pt-[10vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Search GenArchitect"
      onClick={() => setOpen(false)}
    >
      <div
        className="flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-hairline bg-neutral-0 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-2 border-b border-hairline px-4 py-3">
          <Search className="h-4 w-4 text-ink-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search atlases, patterns, notebooks, failure modes…"
            aria-label="Search"
            className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
          />
          <kbd className="rounded border border-hairline px-1.5 py-0.5 font-mono text-[10px] text-ink-muted">esc</kbd>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-2">
          {query && flat.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-ink-muted">No matches.</p>
          ) : null}
          {!query ? (
            <p className="px-3 py-6 text-center text-sm text-ink-muted">
              Type to search. Use ↑ ↓ to move, ↵ to open.
            </p>
          ) : null}

          {KIND_ORDER.map((kind) => {
            const group = results.filter((r) => r.kind === kind)
            if (group.length === 0) return null
            return (
              <div key={kind} className="mb-2">
                <p className="px-3 py-1 font-mono text-[10px] uppercase tracking-wide text-ink-muted">
                  {kind}
                </p>
                <ul>
                  {group.map((it) => {
                    flatIdx += 1
                    const isActive = flatIdx === active
                    return (
                      <li key={it.to + it.title}>
                        <button
                          type="button"
                          onClick={() => go(it.to)}
                          className={clsx(
                            'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left',
                            isActive ? 'bg-neutral-100' : 'hover:bg-neutral-50',
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-ink">{it.title}</span>
                            <span className="block truncate text-xs text-ink-muted">{it.subtitle}</span>
                          </span>
                          {isActive ? <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-ink-muted" /> : null}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
