import { useMemo, useState } from 'react'
import clsx from 'clsx'
import type { VectorFilter, VectorPoint } from '../../atlas/types'

export interface VectorSpaceProps {
  query: { label: string; x: number; y: number }
  points: VectorPoint[]
  topK: number
  filter?: VectorFilter
  groups?: { id: string; label: string }[]
  note?: string
}

const W = 760
const H = 420
const ACCENT = 'rgb(20 184 166)'
const GROUP_COLORS = [
  'rgb(20 184 166)',
  'rgb(99 102 241)',
  'rgb(217 119 6)',
  'rgb(219 39 119)',
  'rgb(5 150 105)',
]

/**
 * A projected vector space: documents as points, the query as a diamond, and
 * the top-k neighbours joined to it.
 *
 * The positions and similarities are authored, not computed — the app embeds
 * nothing in the browser, and pretending otherwise would be a lie dressed as a
 * demo. What the picture is honest about is the shape of the thing: nearness
 * means similarity, and a metadata filter changes which points are even
 * eligible before distance is considered.
 */
export default function VectorSpace({
  query,
  points,
  topK,
  filter,
  groups,
  note,
}: VectorSpaceProps) {
  const [filterOn, setFilterOn] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const colorFor = useMemo(() => {
    const index = new Map((groups ?? []).map((g, i) => [g.id, GROUP_COLORS[i % GROUP_COLORS.length]]))
    return (p: VectorPoint) => (p.group ? index.get(p.group) ?? ACCENT : ACCENT)
  }, [groups])

  const eligible = useMemo(() => {
    if (!filterOn || !filter) return points
    return points.filter((p) => p.meta?.[filter.key] === filter.value)
  }, [filterOn, filter, points])

  const neighbours = useMemo(
    () =>
      [...eligible].sort((a, b) => b.similarity - a.similarity).slice(0, topK),
    [eligible, topK],
  )
  const neighbourIds = new Set(neighbours.map((n) => n.id))

  const px = (x: number, y: number) => ({
    cx: 40 + (x / 100) * (W - 80),
    cy: 30 + (y / 100) * (H - 90),
  })
  const q = px(query.x, query.y)
  const active = activeId ? points.find((p) => p.id === activeId) : null

  /** Neighbours lost to the filter — the point of the toggle. */
  const unfiltered = [...points].sort((a, b) => b.similarity - a.similarity).slice(0, topK)
  const dropped = unfiltered.filter((p) => !neighbourIds.has(p.id))

  return (
    <div>
      {filter ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
            Metadata filter
          </span>
          <button
            type="button"
            onClick={() => setFilterOn((v) => !v)}
            aria-pressed={filterOn}
            className={clsx(
              'rounded-md border px-2.5 py-1 font-mono text-xs font-medium transition-colors',
              'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
              filterOn
                ? 'border-accent bg-accent/10 text-ink'
                : 'border-hairline text-ink-muted hover:text-ink',
            )}
          >
            {filter.label}
          </button>
          <span className="text-xs text-ink-muted">
            {filterOn
              ? `${eligible.length} of ${points.length} chunks eligible`
              : 'off — every chunk is eligible'}
          </span>
        </div>
      ) : null}

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full rounded-xl border border-hairline bg-neutral-0"
        role="img"
        aria-label={`Projected vector space with ${points.length} chunks and the top ${topK} neighbours of the query`}
      >
        {/* faint grid, to read as a space rather than a chart */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={`v${i}`}
            x1={40 + (i * (W - 80)) / 4}
            y1={24}
            x2={40 + (i * (W - 80)) / 4}
            y2={H - 60}
            className="stroke-neutral-100"
            strokeWidth={1}
          />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <line
            key={`h${i}`}
            x1={40}
            y1={30 + (i * (H - 90)) / 3}
            x2={W - 40}
            y2={30 + (i * (H - 90)) / 3}
            className="stroke-neutral-100"
            strokeWidth={1}
          />
        ))}

        {/* query → neighbour links, labelled with similarity */}
        {neighbours.map((n) => {
          const p = px(n.x, n.y)
          return (
            <g key={`edge-${n.id}`}>
              <line
                x1={q.cx}
                y1={q.cy}
                x2={p.cx}
                y2={p.cy}
                stroke={ACCENT}
                strokeWidth={1.5}
                strokeOpacity={0.55}
              />
              <text
                x={(q.cx + p.cx) / 2}
                y={(q.cy + p.cy) / 2 - 4}
                textAnchor="middle"
                className="fill-ink-muted font-mono"
                fontSize={10}
              >
                {n.similarity.toFixed(2)}
              </text>
            </g>
          )
        })}

        {/* points */}
        {points.map((p) => {
          const { cx, cy } = px(p.x, p.y)
          const isNeighbour = neighbourIds.has(p.id)
          const excluded = filterOn && !eligible.some((e) => e.id === p.id)
          const color = colorFor(p)
          return (
            <g
              key={p.id}
              tabIndex={0}
              role="button"
              aria-label={`${p.label}, similarity ${p.similarity.toFixed(2)}${
                isNeighbour ? ', retrieved' : ''
              }`}
              onMouseEnter={() => setActiveId(p.id)}
              onMouseLeave={() => setActiveId(null)}
              onFocus={() => setActiveId(p.id)}
              onBlur={() => setActiveId(null)}
              className="cursor-pointer focus-visible:outline-none"
            >
              {isNeighbour ? (
                <circle cx={cx} cy={cy} r={11} fill={color} fillOpacity={0.16} />
              ) : null}
              <circle
                cx={cx}
                cy={cy}
                r={isNeighbour ? 6.5 : 4.5}
                fill={excluded ? 'rgb(226 232 240)' : color}
                stroke={activeId === p.id ? color : 'transparent'}
                strokeWidth={2}
              />
              <text
                x={cx}
                y={cy - 12}
                textAnchor="middle"
                className={clsx(
                  'font-mono',
                  excluded ? 'fill-neutral-400' : 'fill-ink-soft',
                )}
                fontSize={10}
              >
                {p.label}
              </text>
            </g>
          )
        })}

        {/* the query */}
        <g>
          <rect
            x={q.cx - 8}
            y={q.cy - 8}
            width={16}
            height={16}
            transform={`rotate(45 ${q.cx} ${q.cy})`}
            fill="rgb(15 23 42)"
          />
          <text
            x={q.cx}
            y={q.cy + 26}
            textAnchor="middle"
            className="fill-ink font-mono font-semibold"
            fontSize={11}
          >
            {query.label}
          </text>
        </g>
      </svg>

      {/* legend */}
      {groups?.length ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          {groups.map((g, i) => (
            <span key={g.id} className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: GROUP_COLORS[i % GROUP_COLORS.length] }}
              />
              {g.label}
            </span>
          ))}
        </div>
      ) : null}

      {/* what the picture is currently saying */}
      <div className="mt-3 rounded-lg border border-hairline bg-neutral-50 px-4 py-3">
        {active ? (
          <p className="text-sm text-ink">
            <span className="font-mono text-xs text-ink-muted">{active.label}</span>{' '}
            — similarity {active.similarity.toFixed(2)}
            {active.meta
              ? ` · ${Object.entries(active.meta)
                  .map(([k, v]) => `${k}=${v}`)
                  .join(' · ')}`
              : ''}
          </p>
        ) : (
          <p className="text-sm text-ink-soft">
            Retrieving top {topK}:{' '}
            <span className="font-mono text-xs">
              {neighbours.map((n) => n.label).join(', ')}
            </span>
            {filterOn && dropped.length ? (
              <>
                {' '}— the filter dropped{' '}
                <span className="font-mono text-xs">
                  {dropped.map((d) => d.label).join(', ')}
                </span>
                , so lower-scoring chunks took their place.
              </>
            ) : null}
          </p>
        )}
      </div>

      {note ? <p className="mt-2 text-sm text-ink-soft">{note}</p> : null}
    </div>
  )
}
