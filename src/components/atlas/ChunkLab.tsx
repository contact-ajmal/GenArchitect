import { useMemo, useState } from 'react'
import { AlertTriangle, FileText } from 'lucide-react'
import clsx from 'clsx'
import type { ChunkPiece, ChunkStrategy } from '../../atlas/types'

export interface ChunkLabProps {
  document: { title: string; body: string }
  strategies: ChunkStrategy[]
}

/**
 * The chunking lab — one document, several splitting rules, switchable.
 *
 * Every strategy carries the literal text of each chunk rather than offsets
 * into the document, so what you read on screen is exactly the string that
 * would be embedded. That is the whole teaching point: a fixed-size rule that
 * cuts a sentence in half looks fine as a config value and obviously wrong as
 * a chunk. Overlap is drawn as a tinted lead-in so repeated text is visible
 * rather than described.
 */
export default function ChunkLab({ document, strategies }: ChunkLabProps) {
  const [activeId, setActiveId] = useState(strategies[0]?.id)
  const strategy =
    strategies.find((s) => s.id === activeId) ?? strategies[0]

  const { roots, childrenByParent } = useMemo(() => {
    const kids = new Map<string, ChunkPiece[]>()
    for (const c of strategy.chunks) {
      if (!c.parentId) continue
      const list = kids.get(c.parentId) ?? []
      list.push(c)
      kids.set(c.parentId, list)
    }
    return {
      roots: strategy.chunks.filter((c) => !c.parentId),
      childrenByParent: kids,
    }
  }, [strategy])

  const embedded = strategy.chunks.filter(
    (c) => !childrenByParent.has(c.id) || c.parentId,
  )
  const totalTokens = embedded.reduce((sum, c) => sum + c.tokens, 0)
  const avgTokens = embedded.length
    ? Math.round(totalTokens / embedded.length)
    : 0
  const warnings = strategy.chunks.filter((c) => c.warning)

  return (
    <div>
      {/* Strategy switcher — pointless with a single strategy, so it hides. */}
      <div
        className={clsx(
          'flex flex-wrap items-center gap-2',
          strategies.length < 2 && 'hidden',
        )}
      >
        <span className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
          Strategy
        </span>
        {strategies.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveId(s.id)}
            aria-pressed={s.id === strategy.id}
            className={clsx(
              'rounded-md border px-2.5 py-1 text-sm font-medium transition-colors',
              'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1',
              s.id === strategy.id
                ? 'border-accent bg-accent/10 text-ink'
                : 'border-hairline text-ink-muted hover:text-ink',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* The rule being applied */}
      <div
        className={clsx(
          'rounded-lg border border-hairline bg-neutral-50 px-4 py-3',
          strategies.length > 1 && 'mt-3',
        )}
      >
        <p className="text-sm text-ink">{strategy.rule}</p>
        {strategy.config ? (
          <p className="mt-1 font-mono text-[11px] text-ink-muted">
            {strategy.config}
          </p>
        ) : null}
      </div>

      {/* The source document, collapsed by default so the split leads */}
      <details className="group mt-3">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-accent-strong hover:underline">
          <FileText className="h-4 w-4" aria-hidden="true" />
          Source document — {document.title}
        </summary>
        <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-hairline bg-neutral-0 p-4 font-mono text-[12px] leading-relaxed text-ink-soft">
          {document.body}
        </pre>
      </details>

      {/* The chunks */}
      <ol className="mt-4 flex flex-col gap-2.5">
        {roots.map((chunk) => {
          const kids = childrenByParent.get(chunk.id)
          if (!kids) return <ChunkCard key={chunk.id} chunk={chunk} />
          return (
            <li key={chunk.id} className="rounded-xl border border-accent/30 bg-accent/[0.04] p-3">
              <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
                {chunk.label} — parent, {chunk.tokens} tok
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                Not embedded. Returned whole when one of its children is hit.
              </p>
              <ol className="mt-2.5 flex flex-col gap-2">
                {kids.map((kid) => (
                  <ChunkCard key={kid.id} chunk={kid} nested />
                ))}
              </ol>
            </li>
          )
        })}
      </ol>

      {/* What this strategy costs and buys */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-hairline bg-neutral-0 px-4 py-3">
          <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
            {embedded.length} chunk{embedded.length === 1 ? '' : 's'} embedded
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {avgTokens} tokens average
            {warnings.length
              ? ` · ${warnings.length} carrying a caveat`
              : ' · no split warnings'}
          </p>
        </div>
        <div className="rounded-lg border border-hairline bg-neutral-0 px-4 py-3">
          <p className="font-mono text-[11px] uppercase tracking-wide text-emerald-700">
            Buys you
          </p>
          <p className="mt-1 text-sm text-ink-soft">{strategy.benefit}</p>
        </div>
      </div>

      {strategy.caveat ? (
        <p className="mt-3 flex items-start gap-2 text-sm text-amber-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{strategy.caveat}</span>
        </p>
      ) : null}

      {strategy.retrievedNote ? (
        <p className="mt-2 text-sm text-ink-soft">
          <span className="font-medium text-ink">On a hit: </span>
          {strategy.retrievedNote}
        </p>
      ) : null}
    </div>
  )
}

/** One chunk, with its repeated lead-in tinted so overlap is visible. */
function ChunkCard({ chunk, nested }: { chunk: ChunkPiece; nested?: boolean }) {
  const overlap = chunk.overlapChars ?? 0
  const lead = overlap > 0 ? chunk.text.slice(0, overlap) : ''
  const rest = overlap > 0 ? chunk.text.slice(overlap) : chunk.text

  return (
    <li
      className={clsx(
        'rounded-lg border bg-neutral-0 p-3',
        nested ? 'border-hairline' : 'border-hairline',
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
          {chunk.label}
        </span>
        <span className="font-mono text-[11px] text-ink-muted">
          {chunk.tokens} tok
        </span>
      </div>

      <p className="mt-1.5 whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-ink">
        {lead ? (
          <span
            className="rounded-sm bg-accent/15 decoration-accent/40 underline decoration-dotted underline-offset-2"
            title={chunk.leadInNote ?? 'Repeated from the previous chunk'}
          >
            {lead}
          </span>
        ) : null}
        {rest}
      </p>

      {overlap > 0 ? (
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wide text-ink-muted">
          {chunk.leadInNote ??
            `Tinted lead-in = ${overlap} characters repeated from the previous chunk`}
        </p>
      ) : null}

      {chunk.warning ? (
        <p className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-700">
          <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{chunk.warning}</span>
        </p>
      ) : null}
    </li>
  )
}
