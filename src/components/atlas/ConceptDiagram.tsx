import { useMemo, useState } from 'react'
import clsx from 'clsx'
import type { ConceptEdge, ConceptNode, ConceptSelector } from '../../atlas/types'

export interface ConceptDiagramProps {
  nodes: ConceptNode[]
  edges: ConceptEdge[]
  selector?: ConceptSelector
  height?: number
}

const W = 800
const ACCENT = 'rgb(20 184 166)'

/**
 * An SVG concept map: positioned nodes + labeled relationships. Nodes are
 * clickable/focusable and reveal a short explanation. An optional selector
 * highlights subsets (e.g. Gateway target types) and updates a note.
 */
export default function ConceptDiagram({
  nodes,
  edges,
  selector,
  height = 360,
}: ConceptDiagramProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [option, setOption] = useState(0)

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])
  const px = (n: ConceptNode) => ({ cx: (n.x / 100) * W, cy: (n.y / 100) * height })

  const selectedOption = selector?.options[option]
  const highlighted = new Set(selectedOption?.highlightNodeIds ?? [])
  const active = activeId ? byId.get(activeId) : null

  return (
    <div>
      {selector ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
            {selector.label}
          </span>
          {selector.options.map((o, i) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setOption(i)}
              aria-pressed={i === option}
              className={clsx(
                'rounded-md border px-2.5 py-1 text-sm font-medium transition-colors',
                i === option
                  ? 'border-accent bg-accent/10 text-ink'
                  : 'border-hairline text-ink-muted hover:text-ink',
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      ) : null}

      <svg
        viewBox={`0 0 ${W} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label="Concept diagram"
      >
        {/* edges */}
        {edges.map((e, i) => {
          const a = byId.get(e.from)
          const b = byId.get(e.to)
          if (!a || !b) return null
          const p1 = px(a)
          const p2 = px(b)
          const dim = highlighted.size > 0 && !(highlighted.has(e.from) && highlighted.has(e.to))
          return (
            <g key={i} opacity={dim ? 0.2 : 1}>
              <line
                x1={p1.cx}
                y1={p1.cy}
                x2={p2.cx}
                y2={p2.cy}
                className="stroke-neutral-300"
                strokeWidth={1.5}
              />
              {e.label ? (
                <text
                  x={(p1.cx + p2.cx) / 2}
                  y={(p1.cy + p2.cy) / 2 - 4}
                  textAnchor="middle"
                  className="fill-ink-muted"
                  style={{ fontSize: 10 }}
                >
                  {e.label}
                </text>
              ) : null}
            </g>
          )
        })}

        {/* nodes */}
        {nodes.map((n) => {
          const { cx, cy } = px(n)
          const isActive = activeId === n.id
          const isHi = highlighted.has(n.id)
          const dim = highlighted.size > 0 && !isHi
          return (
            <foreignObject key={n.id} x={cx - 74} y={cy - 26} width={148} height={52}>
              <button
                type="button"
                onClick={() => setActiveId(isActive ? null : n.id)}
                aria-pressed={isActive}
                className={clsx(
                  'flex h-full w-full flex-col items-center justify-center rounded-lg border px-2 text-center transition-all',
                  dim ? 'opacity-35' : 'opacity-100',
                  isActive || isHi
                    ? 'border-transparent bg-neutral-0 shadow-[0_0_0_2px_rgb(20_184_166)]'
                    : 'border-hairline bg-neutral-0 hover:border-neutral-300',
                )}
                style={{ borderLeft: `3px solid ${n.accent ?? ACCENT}` }}
              >
                <span className="text-[12px] font-medium leading-tight text-ink">
                  {n.label}
                </span>
                {n.sublabel ? (
                  <span className="font-mono text-[9px] uppercase tracking-wide text-ink-muted">
                    {n.sublabel}
                  </span>
                ) : null}
              </button>
            </foreignObject>
          )
        })}
      </svg>

      {/* detail / note */}
      {selectedOption ? (
        <p className="mt-2 rounded-lg bg-accent/[0.06] px-3 py-2 text-sm text-ink-soft">
          {selectedOption.note}
        </p>
      ) : null}
      {active?.detail ? (
        <p className="mt-2 rounded-lg border border-hairline bg-neutral-50 px-3 py-2 text-sm text-ink-soft">
          <span className="font-medium text-ink">{active.label}:</span>{' '}
          {active.detail}
        </p>
      ) : (
        <p className="mt-2 text-xs text-ink-muted">Select a node to learn what it does.</p>
      )}
    </div>
  )
}
