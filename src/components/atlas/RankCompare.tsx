import { useMemo } from 'react'
import { ArrowDown, ArrowRight, ArrowUp, Target } from 'lucide-react'
import clsx from 'clsx'
import type { RankedItem } from '../../atlas/types'

export interface RankCompareProps {
  firstStageLabel: string
  rerankedLabel: string
  items: RankedItem[]
  takeaway: string
}

/**
 * The same candidates ranked twice, side by side, with score bars and the
 * movement each one made.
 *
 * Both orderings are derived from the scores rather than authored, so the
 * arrows can never disagree with the bars. The answer-bearing chunk is marked,
 * because the argument for a reranker is not that scores change — it is that
 * the chunk holding the answer was outside the top few and is now inside it.
 */
export default function RankCompare({
  firstStageLabel,
  rerankedLabel,
  items,
  takeaway,
}: RankCompareProps) {
  const { first, reranked, moveById } = useMemo(() => {
    const first = [...items].sort((a, b) => b.firstScore - a.firstScore)
    const reranked = [...items].sort((a, b) => b.rerankScore - a.rerankScore)
    const firstPos = new Map(first.map((it, i) => [it.id, i]))
    const moves = new Map(
      reranked.map((it, i) => [it.id, (firstPos.get(it.id) ?? i) - i]),
    )
    return { first, reranked, moveById: moves }
  }, [items])

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Column
          label={firstStageLabel}
          items={first}
          scoreOf={(it) => it.firstScore}
        />
        <Column
          label={rerankedLabel}
          items={reranked}
          scoreOf={(it) => it.rerankScore}
          moveById={moveById}
        />
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-lg border border-accent/30 bg-accent/[0.06] px-4 py-3 text-sm text-ink">
        <Target className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong" aria-hidden="true" />
        <span>{takeaway}</span>
      </p>
    </div>
  )
}

function Column({
  label,
  items,
  scoreOf,
  moveById,
}: {
  label: string
  items: RankedItem[]
  scoreOf: (it: RankedItem) => number
  moveById?: Map<string, number>
}) {
  return (
    <div className="rounded-xl border border-hairline bg-neutral-0 p-3">
      <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
        {label}
      </p>
      <ol className="mt-2 flex flex-col gap-1.5">
        {items.map((it, i) => {
          const score = scoreOf(it)
          const move = moveById?.get(it.id) ?? 0
          return (
            <li
              key={it.id}
              className={clsx(
                'rounded-md px-2 py-1.5',
                it.answerBearing ? 'bg-accent/[0.08] ring-1 ring-accent/30' : 'bg-neutral-50',
              )}
            >
              <div className="flex items-center gap-2">
                <span className="w-4 shrink-0 text-right font-mono text-[11px] text-ink-muted">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink">
                  {it.label}
                  {it.answerBearing ? (
                    <span className="ml-1.5 text-[10px] uppercase tracking-wide text-accent-strong">
                      answer
                    </span>
                  ) : null}
                </span>
                {moveById ? <Move delta={move} /> : null}
                <span className="shrink-0 font-mono text-[11px] text-ink-muted">
                  {score.toFixed(2)}
                </span>
              </div>
              <div
                className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-200"
                role="presentation"
              >
                <div
                  className={clsx(
                    'h-full rounded-full',
                    it.answerBearing ? 'bg-accent' : 'bg-neutral-400',
                  )}
                  style={{ width: `${Math.max(2, Math.round(score * 100))}%` }}
                />
              </div>
              {it.note ? (
                <p className="mt-1 text-[11px] text-ink-muted">{it.note}</p>
              ) : null}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/** Positions gained or lost against the first-stage ordering. */
function Move({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span
        className="inline-flex shrink-0 items-center font-mono text-[10px] text-ink-muted"
        aria-label="unchanged"
      >
        <ArrowRight className="h-3 w-3" aria-hidden="true" />0
      </span>
    )
  }
  const up = delta > 0
  return (
    <span
      className={clsx(
        'inline-flex shrink-0 items-center font-mono text-[10px]',
        up ? 'text-emerald-700' : 'text-amber-700',
      )}
      aria-label={`${up ? 'up' : 'down'} ${Math.abs(delta)} places`}
    >
      {up ? (
        <ArrowUp className="h-3 w-3" aria-hidden="true" />
      ) : (
        <ArrowDown className="h-3 w-3" aria-hidden="true" />
      )}
      {Math.abs(delta)}
    </span>
  )
}
