import { useState } from 'react'
import clsx from 'clsx'
import type { MatrixCell, MatrixRow } from '../../atlas/types'

export interface ComparisonMatrixProps {
  columns: string[]
  rows: MatrixRow[]
}

function cellOf(c: string | MatrixCell): MatrixCell {
  return typeof c === 'string' ? { text: c } : c
}

const TONE: Record<NonNullable<MatrixCell['tone']>, string> = {
  good: 'text-emerald-700',
  bad: 'text-amber-700',
  neutral: 'text-ink-soft',
}

/** A scannable comparison table with hover-highlighted columns and per-row notes. */
export default function ComparisonMatrix({ columns, rows }: ComparisonMatrixProps) {
  const [hoverCol, setHoverCol] = useState<number | null>(null)

  return (
    <div className="overflow-x-auto rounded-xl border border-hairline">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-neutral-50">
            <th className="sticky left-0 z-10 bg-neutral-50 px-4 py-2.5 text-left font-mono text-[11px] uppercase tracking-wide text-ink-muted">
              &nbsp;
            </th>
            {columns.map((col, i) => (
              <th
                key={col}
                onMouseEnter={() => setHoverCol(i)}
                onMouseLeave={() => setHoverCol(null)}
                className={clsx(
                  'px-4 py-2.5 text-left font-display text-sm font-semibold text-ink',
                  hoverCol === i && 'bg-accent/[0.06]',
                )}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-hairline align-top">
              <th
                scope="row"
                className="sticky left-0 z-10 bg-neutral-0 px-4 py-3 text-left text-sm font-medium text-ink"
              >
                {row.label}
                {row.note ? (
                  <span className="mt-1 block font-normal text-xs text-ink-muted">
                    {row.note}
                  </span>
                ) : null}
              </th>
              {row.cells.map((c, i) => {
                const cell = cellOf(c)
                return (
                  <td
                    key={i}
                    onMouseEnter={() => setHoverCol(i)}
                    onMouseLeave={() => setHoverCol(null)}
                    className={clsx(
                      'px-4 py-3 leading-relaxed',
                      cell.tone ? TONE[cell.tone] : 'text-ink-soft',
                      hoverCol === i && 'bg-accent/[0.04]',
                    )}
                  >
                    {cell.text}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
