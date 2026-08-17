import { useEffect, useMemo, useRef, useState } from 'react'
import type { ThemedToken } from 'shiki'
import { Check, Copy, FileCode2, Lock } from 'lucide-react'
import clsx from 'clsx'
import { tokenizeCode, type SupportedLang } from '../../lib/highlighter'
import type { VerificationRecord } from '../../data/verification'
import type { CodeAnnotation } from '../../types'
import { Info, X } from 'lucide-react'
import FreshnessBadge from '../FreshnessBadge'

/** A single line number, or an inclusive `[start, end]` range. */
export type LineRange = number | [number, number]

export interface CodeBlockProps {
  language: SupportedLang
  code: string
  /** Optional filename shown in the tab bar. */
  filename?: string
  /** Lines to visually emphasize (1-based). Numbers and ranges both allowed. */
  highlightLines?: LineRange[]
  /** Optional caption rendered beneath the block. */
  caption?: string
  /**
   * Cap the code area height (e.g. "420px") to make it scroll vertically.
   * When set, changing `highlightLines` scrolls the first highlighted line
   * into view — used by the synced walkthrough.
   */
  maxHeight?: string
  /** Optional freshness/verified badge (from the verification layer). */
  verification?: VerificationRecord
  /** Optional line-level annotations for "explain this line". */
  annotations?: CodeAnnotation[]
  /** Called with a diagram component id (or null) as annotations open/close. */
  onAnnotationOpen?: (componentId: string | null) => void
  className?: string
}

/** Expand an annotation's lineRange into the set of lines it covers. */
function annotationLines(a: CodeAnnotation): number[] {
  if (Array.isArray(a.lineRange)) {
    const [s, e] = a.lineRange
    const out: number[] = []
    for (let i = Math.min(s, e); i <= Math.max(s, e); i++) out.push(i)
    return out
  }
  return [a.lineRange]
}

const LANG_LABELS: Record<SupportedLang, string> = {
  python: 'Python',
  typescript: 'TypeScript',
  bash: 'bash',
  json: 'JSON',
}

/** Expand ranges/numbers into a fast lookup set of highlighted line numbers. */
function toLineSet(ranges?: LineRange[]): Set<number> {
  const set = new Set<number>()
  if (!ranges) return set
  for (const r of ranges) {
    if (Array.isArray(r)) {
      const [start, end] = r
      for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
        set.add(i)
      }
    } else {
      set.add(r)
    }
  }
  return set
}

/** Map Shiki's fontStyle bitfield to inline CSS. */
function fontStyle(style?: number) {
  if (!style) return undefined
  return {
    fontStyle: style & 1 ? ('italic' as const) : undefined,
    fontWeight: style & 2 ? 700 : undefined,
    textDecoration: style & 4 ? ('underline' as const) : undefined,
  }
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard unavailable — no-op */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'Copied' : 'Copy code'}
      className={clsx(
        'inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors',
        'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-0',
        copied
          ? 'text-accent-strong'
          : 'text-ink-muted hover:bg-neutral-100 hover:text-ink',
      )}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

/**
 * The workhorse code surface: syntax-highlighted, line-numbered, copyable, with
 * per-line emphasis for the synced diagram↔code feature. Never executes code —
 * it renders a subtle "reference implementation" label to make that explicit.
 */
export default function CodeBlock({
  language,
  code,
  filename,
  highlightLines,
  caption,
  maxHeight,
  verification,
  annotations,
  onAnnotationOpen,
  className,
}: CodeBlockProps) {
  const [lines, setLines] = useState<ThemedToken[][] | null>(null)
  const [activeAnnot, setActiveAnnot] = useState<number | null>(null)
  const highlighted = useMemo(() => toLineSet(highlightLines), [highlightLines])
  const scrollRef = useRef<HTMLDivElement>(null)

  // Map each line number to the index of the annotation covering it.
  const lineToAnnot = useMemo(() => {
    const map = new Map<number, number>()
    annotations?.forEach((a, i) => {
      for (const ln of annotationLines(a)) if (!map.has(ln)) map.set(ln, i)
    })
    return map
  }, [annotations])

  function openAnnot(index: number) {
    setActiveAnnot(index)
    onAnnotationOpen?.(annotations?.[index]?.mapsToDiagramComponentId ?? null)
  }
  function closeAnnot() {
    setActiveAnnot(null)
    onAnnotationOpen?.(null)
  }
  // Trim a single trailing newline so we don't render a phantom last line.
  const source = useMemo(() => code.replace(/\n$/, ''), [code])

  // First highlighted line (for scroll-into-view).
  const firstHighlight = useMemo(() => {
    if (!highlighted.size) return null
    return Math.min(...highlighted)
  }, [highlighted])

  // Center the first highlighted line within the scroll area when it changes.
  useEffect(() => {
    const container = scrollRef.current
    if (!container || firstHighlight == null) return
    const line = container.querySelector<HTMLElement>(
      `[data-line="${firstHighlight}"]`,
    )
    if (!line) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const cRect = container.getBoundingClientRect()
    const lRect = line.getBoundingClientRect()
    const delta = lRect.top - cRect.top - container.clientHeight / 2 + lRect.height
    container.scrollBy({ top: delta, behavior: reduce ? 'auto' : 'smooth' })
  }, [firstHighlight, lines])

  useEffect(() => {
    let active = true
    tokenizeCode(source, language)
      .then((result) => {
        if (active) setLines(result.tokens)
      })
      .catch(() => {
        if (active) setLines(null)
      })
    return () => {
      active = false
    }
  }, [source, language])

  const gutterWidth = String(source.split('\n').length).length

  return (
    <figure
      className={clsx(
        'overflow-hidden rounded-xl border border-hairline bg-neutral-0',
        className,
      )}
    >
      {/* Tab / header bar */}
      <div className="flex items-center justify-between gap-3 border-b border-hairline bg-neutral-50 px-3 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          {filename ? (
            <>
              <FileCode2 className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
              <span className="truncate font-mono text-xs text-ink-soft">
                {filename}
              </span>
            </>
          ) : (
            <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-ink-muted">
              {LANG_LABELS[language]}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {filename ? (
            <span className="hidden font-mono text-[11px] font-medium uppercase tracking-wider text-ink-muted sm:inline">
              {LANG_LABELS[language]}
            </span>
          ) : null}
          <span
            className="hidden items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted sm:inline-flex"
            title="Reference only — this app never executes code"
          >
            <Lock className="h-3 w-3" />
            Reference
          </span>
          <CopyButton code={source} />
        </div>
      </div>

      {/* Code area */}
      <div
        ref={scrollRef}
        className={clsx('cb-scroll', maxHeight && 'overflow-y-auto')}
        style={maxHeight ? { maxHeight } : undefined}
      >
        <code className="cb-lines block py-3 font-mono">
          {lines
            ? lines.map((tokens, i) => {
                const lineNo = i + 1
                const annotIdx = lineToAnnot.get(lineNo)
                const isAnnot = annotIdx !== undefined
                const annotActive = isAnnot && activeAnnot === annotIdx
                return (
                  <span
                    key={lineNo}
                    className={clsx('cb-line', isAnnot && 'cb-annotated')}
                    data-line={lineNo}
                    data-hl={highlighted.has(lineNo) ? 'true' : undefined}
                    data-annot-active={annotActive ? 'true' : undefined}
                    role={isAnnot ? 'button' : undefined}
                    tabIndex={isAnnot ? 0 : undefined}
                    aria-expanded={isAnnot ? annotActive : undefined}
                    aria-label={
                      isAnnot ? `Explain line ${lineNo}` : undefined
                    }
                    onClick={
                      isAnnot
                        ? () =>
                            annotActive ? closeAnnot() : openAnnot(annotIdx)
                        : undefined
                    }
                    onKeyDown={
                      isAnnot
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              annotActive ? closeAnnot() : openAnnot(annotIdx)
                            } else if (e.key === 'Escape') {
                              closeAnnot()
                            }
                          }
                        : undefined
                    }
                  >
                    <span
                      className="cb-gutter"
                      style={{ minWidth: `${gutterWidth + 1}ch` }}
                      aria-hidden="true"
                    >
                      {isAnnot ? <span className="cb-annot-dot" /> : null}
                      {lineNo}
                    </span>
                    <span className="cb-code">
                      {tokens.length ? (
                        tokens.map((token, j) => (
                          <span
                            key={j}
                            style={{ color: token.color, ...fontStyle(token.fontStyle) }}
                          >
                            {token.content}
                          </span>
                        ))
                      ) : (
                        <span>{' '}</span>
                      )}
                    </span>
                  </span>
                )
              })
            : // Pre-highlight fallback: plain, still legible and copyable.
              source.split('\n').map((line, i) => (
                <span key={i} className="cb-line" data-line={i + 1}>
                  <span
                    className="cb-gutter"
                    style={{ minWidth: `${gutterWidth + 1}ch` }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <span className="cb-code text-ink-soft">
                    {line || ' '}
                  </span>
                </span>
              ))}
        </code>
      </div>

      {/* Explain-this-line panel */}
      {activeAnnot !== null && annotations?.[activeAnnot] ? (
        <div className="border-t border-hairline bg-accent/[0.04] px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-accent-strong">
              <Info className="h-3.5 w-3.5" />
              Explain this line
            </p>
            <button
              type="button"
              onClick={closeAnnot}
              aria-label="Close explanation"
              className="text-ink-muted hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink">
            {annotations[activeAnnot].whatItDoes}
          </p>
          {annotations[activeAnnot].technicalNote ? (
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              {annotations[activeAnnot].technicalNote}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            {annotations[activeAnnot].verifyAgainstDocs ? (
              <span className="font-mono uppercase tracking-wide text-amber-700">
                Verify against current AWS docs
              </span>
            ) : null}
            {annotations[activeAnnot].docUrl ? (
              <a
                href={annotations[activeAnnot].docUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-accent-strong hover:underline"
              >
                Documentation ↗
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      {verification ? (
        <div className="border-t border-hairline px-4 py-2">
          <FreshnessBadge verification={verification} />
        </div>
      ) : null}

      {caption ? (
        <figcaption className="border-t border-hairline px-4 py-2 text-xs text-ink-muted">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}
