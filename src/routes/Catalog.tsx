import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Route as RouteIcon } from 'lucide-react'
import type { AwsServiceId, DifficultyTier } from '../types'
import {
  ARCHITECTURE_FAMILIES,
  ARCHITECTURE_LIST,
  ARCHITECTURE_ORDER,
} from '../data/architectures'
import { AWS_SERVICES } from '../data/services'
import { Button, Eyebrow, Pill } from '../components/ui'
import RagDiagram from '../components/diagram/RagDiagram'
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_ORDER,
  difficultyRank,
  serviceVariant,
} from '../lib/display'

type SortMode = 'path' | 'difficulty'
type DifficultyFilter = DifficultyTier | 'all'
type ServiceFilter = AwsServiceId | 'all'

// Services worth filtering by (appear across multiple patterns).
const FILTERABLE_SERVICES: AwsServiceId[] = [
  'bedrock_kb_managed',
  'bedrock_kb_customer_managed',
  'agentcore_gateway',
  'agentcore_memory',
  'agentcore_runtime',
  'bedrock_guardrails',
  'opensearch_serverless',
  'neptune',
  'mcp',
  'strands_sdk',
]

const orderIndex = (id: string) => ARCHITECTURE_ORDER.indexOf(id as never)

export default function Catalog() {
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all')
  const [service, setService] = useState<ServiceFilter>('all')
  const [sort, setSort] = useState<SortMode>('path')

  const architectures = useMemo(() => {
    let list = ARCHITECTURE_LIST.filter((a) => {
      if (difficulty !== 'all' && a.difficulty !== difficulty) return false
      if (service !== 'all' && !a.awsServiceIds.includes(service)) return false
      return true
    })
    list = [...list].sort((a, b) =>
      sort === 'path'
        ? orderIndex(a.id) - orderIndex(b.id)
        : difficultyRank(a.difficulty) - difficultyRank(b.difficulty) ||
          orderIndex(a.id) - orderIndex(b.id),
    )
    return list
  }, [difficulty, service, sort])

  // Group into catalog subsections, dropping any family the filters emptied.
  const groups = useMemo(
    () =>
      ARCHITECTURE_FAMILIES.map((f) => ({
        ...f,
        items: architectures.filter((a) => a.family === f.id),
      })).filter((g) => g.items.length > 0),
    [architectures],
  )

  const resetToPath = () => {
    setDifficulty('all')
    setService('all')
    setSort('path')
  }

  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:px-6">
      <header className="max-w-3xl">
        <Eyebrow>The catalog</Eyebrow>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Reference architectures, foundational to production.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">
          {ARCHITECTURE_LIST.length} patterns across two families: retrieval
          architectures that answer from your data, and agentic data
          engineering that builds the pipeline underneath it. Filter by
          difficulty or AWS building block, or follow the recommended path.
        </p>
      </header>

      {/* Controls */}
      <div className="mt-8 flex flex-wrap items-end gap-x-6 gap-y-4 rounded-xl border border-hairline bg-neutral-0 p-4">
        {/* Difficulty */}
        <fieldset>
          <legend className="mb-1.5 font-mono text-[11px] uppercase tracking-wide text-ink-muted">
            Difficulty
          </legend>
          <div className="flex flex-wrap gap-1">
            {(['all', ...DIFFICULTY_ORDER] as DifficultyFilter[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                aria-pressed={difficulty === d}
                className={
                  'rounded-md px-2.5 py-1 text-sm font-medium transition-colors ' +
                  (difficulty === d
                    ? 'bg-ink text-neutral-0'
                    : 'text-ink-muted hover:bg-neutral-100 hover:text-ink')
                }
              >
                {d === 'all' ? 'All' : DIFFICULTY_LABELS[d]}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Service */}
        <div>
          <label
            htmlFor="service-filter"
            className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-ink-muted"
          >
            AWS service
          </label>
          <select
            id="service-filter"
            value={service}
            onChange={(e) => setService(e.target.value as ServiceFilter)}
            className="h-9 rounded-md border border-hairline bg-neutral-0 px-2.5 text-sm text-ink focus-visible:ring-2 focus-visible:ring-accent"
          >
            <option value="all">All services</option>
            {FILTERABLE_SERVICES.map((id) => (
              <option key={id} value={id}>
                {AWS_SERVICES[id].name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div>
          <label
            htmlFor="sort-mode"
            className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-ink-muted"
          >
            Sort
          </label>
          <select
            id="sort-mode"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="h-9 rounded-md border border-hairline bg-neutral-0 px-2.5 text-sm text-ink focus-visible:ring-2 focus-visible:ring-accent"
          >
            <option value="path">Learning path</option>
            <option value="difficulty">Difficulty</option>
          </select>
        </div>

        <div className="ml-auto">
          <Button variant="subtle" size="sm" onClick={resetToPath}>
            <RouteIcon className="h-4 w-4" />
            Recommended path
          </Button>
        </div>
      </div>

      <p className="mt-3 text-sm text-ink-muted" aria-live="polite">
        Showing {architectures.length} of {ARCHITECTURE_LIST.length} patterns.
      </p>

      {/* Gallery */}
      {architectures.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-hairline p-10 text-center text-ink-muted">
          No patterns match those filters.{' '}
          <button
            type="button"
            onClick={resetToPath}
            className="font-medium text-accent-strong hover:underline"
          >
            Reset
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-12">
          {groups.map((group) => (
            <section key={group.id} aria-labelledby={`family-${group.id}`}>
              <div className="border-b border-hairline pb-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2
                    id={`family-${group.id}`}
                    className="font-display text-xl font-semibold text-ink"
                  >
                    {group.title}
                  </h2>
                  <span className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
                    {group.items.length} pattern{group.items.length === 1 ? '' : 's'}
                  </span>
                </div>
                <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-ink-soft">
                  {group.blurb}
                </p>
              </div>

              <ul className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {group.items.map((arch) => (
                  <li key={arch.id}>
                    <Link
                      to={`/architecture/${arch.id}`}
                      className="group flex h-full flex-col overflow-hidden rounded-xl border border-hairline bg-neutral-0 transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <div
                        className="h-28 overflow-hidden border-b border-hairline bg-neutral-50 p-2"
                        aria-hidden="true"
                      >
                        <RagDiagram architecture={arch} />
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-display text-lg font-semibold text-ink">
                            {arch.name}
                          </h3>
                          <Pill variant="difficulty">
                            {DIFFICULTY_LABELS[arch.difficulty]}
                          </Pill>
                        </div>
                        <p className="mt-1 text-sm text-ink-muted">{arch.tagline}</p>

                        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                          {arch.meridianStage?.whatItAdds ?? arch.summary}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {arch.awsServiceIds.slice(0, 4).map((id) => (
                            <Pill key={id} variant={serviceVariant(AWS_SERVICES[id].category)}>
                              {AWS_SERVICES[id].name}
                            </Pill>
                          ))}
                          {arch.awsServiceIds.length > 4 ? (
                            <Pill>+{arch.awsServiceIds.length - 4}</Pill>
                          ) : null}
                        </div>

                        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent-strong">
                          Explore pattern
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
