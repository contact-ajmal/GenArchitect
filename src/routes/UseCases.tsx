import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import type { Industry, RagArchitectureId, UseCaseEntry } from '../types'
import { Eyebrow } from '../components/ui'
import { BRAND } from '../config/brand'
import UseCaseCard from '../components/usecase/UseCaseCard'
import {
  INDUSTRY_LABELS,
  USE_CASES,
  industriesInUse,
  servicesInUse,
} from '../lib/usecases'
import { ARCHITECTURE_LIST } from '../data/architectures'

const PATTERNS = ARCHITECTURE_LIST.map((a) => ({ id: a.id, name: a.name }))

export default function UseCases() {
  const [params] = useSearchParams()
  const [query, setQuery] = useState(() => params.get('q') ?? '')
  const [industry, setIndustry] = useState<Industry | 'all'>('all')
  const [service, setService] = useState<string>('all')
  const [pattern, setPattern] = useState<RagArchitectureId | 'all'>('all')
  const searchRef = useRef<HTMLInputElement>(null)

  const industries = useMemo(industriesInUse, [])
  const services = useMemo(servicesInUse, [])

  // "/" focuses search (unless already typing).
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
    const list = USE_CASES.filter((u) => {
      if (industry !== 'all' && u.industry !== industry) return false
      if (service !== 'all' && !u.services.includes(service)) return false
      if (pattern !== 'all' && !u.relatedPatternIds?.includes(pattern)) return false
      if (
        q &&
        !`${u.company} ${u.title} ${u.summary} ${u.services.join(' ')} ${u.agentPattern ?? ''}`
          .toLowerCase()
          .includes(q)
      )
        return false
      return true
    })
    // Featured first, then alphabetical by company.
    return list.sort((a, b) => {
      if (!!a.featured !== !!b.featured) return a.featured ? -1 : 1
      return a.company.localeCompare(b.company)
    })
  }, [query, industry, service, pattern])

  const featured = useMemo(() => USE_CASES.filter((u) => u.featured).slice(0, 4), [])
  const hasFilters = query || industry !== 'all' || service !== 'all' || pattern !== 'all'

  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:px-6">
      <header className="max-w-3xl">
        <Eyebrow>Case studies</Eyebrow>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          GenAI agents in the wild
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">
          Real, publicly-documented deployments of GenAI agents and RAG systems
          on AWS — across {industries.length} industries. Each card links to its
          original source; filter by industry, AWS service, or the architecture
          it maps to.
        </p>
      </header>

      {/* Search */}
      <div className="relative mt-8 max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search companies, services, use cases…  ( press / )"
          aria-label="Search use cases"
          className="h-10 w-full rounded-lg border border-hairline bg-neutral-0 pl-9 pr-3 text-sm text-ink focus-visible:ring-2 focus-visible:ring-accent"
        />
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-end gap-x-5 gap-y-3">
        <Select
          label="Industry"
          value={industry}
          onChange={(v) => setIndustry(v as Industry | 'all')}
          options={['all', ...industries]}
          renderOption={(o) => (o === 'all' ? 'All' : INDUSTRY_LABELS[o as Industry])}
        />
        <Select
          label="AWS service"
          value={service}
          onChange={setService}
          options={['all', ...services]}
        />
        <Select
          label="Architecture"
          value={pattern}
          onChange={(v) => setPattern(v as RagArchitectureId | 'all')}
          options={['all', ...PATTERNS.map((p) => p.id)]}
          renderOption={(o) => (o === 'all' ? 'All' : PATTERNS.find((p) => p.id === o)?.name ?? o)}
        />
      </div>

      {/* Featured (only when not filtering) */}
      {!hasFilters && featured.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 font-display text-lg font-semibold text-ink">Featured</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((u) => (
              <UseCaseCard key={u.id} useCase={u} compact />
            ))}
          </div>
        </section>
      ) : null}

      {/* Grid */}
      <div className="mt-10">
        <p className="mb-3 text-sm text-ink-muted" aria-live="polite">
          {results.length} case stud{results.length === 1 ? 'y' : 'ies'}
        </p>
        {results.length === 0 ? (
          <div className="rounded-xl border border-dashed border-hairline p-10 text-center text-ink-muted">
            No case studies match those filters.
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((u: UseCaseEntry) => (
              <li key={u.id}>
                <UseCaseCard useCase={u} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Attribution + non-affiliation */}
      <div className="mt-10 space-y-2 border-t border-hairline pt-6 text-xs leading-relaxed text-ink-muted">
        <p>
          These are publicly-documented deployments, curated by hand from AWS
          case studies and announcements. GenArchitect stores only a short
          original summary and factual details; every card links back to the
          original source, where the full story and any metrics can be verified.
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
  renderOption,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  renderOption?: (o: string) => string
}) {
  return (
    <div>
      <label className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-ink-muted">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 max-w-[13rem] rounded-md border border-hairline bg-neutral-0 px-2 text-sm text-ink focus-visible:ring-2 focus-visible:ring-accent"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {renderOption ? renderOption(o) : o === 'all' ? 'All' : o}
          </option>
        ))}
      </select>
    </div>
  )
}
