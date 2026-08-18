import { Fragment, useMemo } from 'react'
import type { ReactNode } from 'react'
import { Download, Eye } from 'lucide-react'
import type { NotebookDefinition } from '../../notebooks/model'
import { downloadNotebook, notebookCells } from '../../notebooks/compile'
import { verificationForServices } from '../../data/verification'
import { track } from '../../lib/analytics'
import { Button, Callout } from '../ui'
import CodeBlock from '../code/CodeBlock'

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/** Minimal inline markdown: **bold**, `code`, [text](url). */
function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  let rest = text
  let key = 0
  const patterns: [RegExp, (m: RegExpMatchArray) => ReactNode][] = [
    [/`([^`]+)`/, (m) => <code key={key} className="rounded bg-neutral-100 px-1 py-0.5 font-mono text-[0.85em]">{m[1]}</code>],
    [/\*\*([^*]+)\*\*/, (m) => <strong key={key} className="font-semibold text-ink">{m[1]}</strong>],
    [/\[([^\]]+)\]\(([^)]+)\)/, (m) => <a key={key} href={m[2]} target="_blank" rel="noreferrer" className="text-accent-strong hover:underline">{m[1]}</a>],
  ]
  while (rest.length) {
    let best: { index: number; len: number; node: ReactNode } | null = null
    for (const [re, make] of patterns) {
      const m = rest.match(re)
      if (m && m.index !== undefined) {
        if (!best || m.index < best.index) {
          best = { index: m.index, len: m[0].length, node: make(m) }
        }
      }
    }
    if (!best) {
      out.push(<Fragment key={key++}>{rest}</Fragment>)
      break
    }
    if (best.index > 0) out.push(<Fragment key={key++}>{rest.slice(0, best.index)}</Fragment>)
    out.push(<Fragment key={key++}>{best.node}</Fragment>)
    rest = rest.slice(best.index + best.len)
  }
  return out
}

/** Block-level markdown: headings, blockquotes (admonitions), lists, paragraphs. */
function Markdown({ source }: { source: string }) {
  const lines = source.split('\n')
  const blocks: ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]
    if (line.trim() === '') {
      i++
      continue
    }
    // Heading
    const h = line.match(/^(#{1,4})\s+(.*)$/)
    if (h) {
      const level = h[1].length
      const text = h[2]
      const id = slug(text)
      const cls =
        level === 1
          ? 'mt-2 text-2xl font-bold tracking-tight text-ink'
          : level === 2
            ? 'mt-6 text-xl font-semibold text-ink scroll-mt-24'
            : 'mt-4 text-base font-semibold text-ink'
      blocks.push(
        <div key={key++} id={id} className={cls}>
          {renderInline(text)}
        </div>,
      )
      i++
      continue
    }
    // Blockquote (admonition)
    if (line.startsWith('>')) {
      const quote: string[] = []
      while (i < lines.length && lines[i].startsWith('>')) {
        quote.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      blocks.push(
        <div
          key={key++}
          className="my-3 rounded-lg border-l-4 border-amber-300 bg-amber-50 px-4 py-2 text-sm leading-relaxed text-ink-soft"
        >
          {quote.map((q, qi) => (
            <p key={qi} className={q.trim() === '' ? 'h-2' : ''}>
              {renderInline(q)}
            </p>
          ))}
        </div>,
      )
      continue
    }
    // List
    if (line.match(/^[-*]\s+/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^[-*]\s+/)) {
        items.push(lines[i].replace(/^[-*]\s+/, ''))
        i++
      }
      blocks.push(
        <ul key={key++} className="my-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink-soft">
          {items.map((it, ii) => (
            <li key={ii}>{renderInline(it)}</li>
          ))}
        </ul>,
      )
      continue
    }
    // Paragraph
    const para: string[] = []
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].match(/^(#{1,4}\s|>|[-*]\s)/)) {
      para.push(lines[i])
      i++
    }
    blocks.push(
      <p key={key++} className="my-2 text-sm leading-relaxed text-ink-soft">
        {renderInline(para.join(' '))}
      </p>,
    )
  }
  return <>{blocks}</>
}

export interface NotebookPreviewProps {
  def: NotebookDefinition
}

export default function NotebookPreview({ def }: NotebookPreviewProps) {
  const cells = useMemo(() => notebookCells(def), [def])

  const outline = useMemo(
    () =>
      cells.flatMap((c) =>
        c.kind === 'markdown'
          ? c.source
              .split('\n')
              .filter((l) => l.startsWith('## '))
              .map((l) => l.replace(/^##\s+/, ''))
          : [],
      ),
    [cells],
  )

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_14rem]">
      <div className="min-w-0 order-2 lg:order-1">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-hairline bg-neutral-50 px-4 py-2">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-ink-muted">
            <Eye className="h-3.5 w-3.5" />
            Preview — cells are never executed here
          </span>
          <Button
            size="sm"
            onClick={() => {
              track('notebook_download', { id: def.id, title: def.title })
              downloadNotebook(def)
            }}
          >
            <Download className="h-4 w-4" />
            Download .ipynb
          </Button>
        </div>

        <div className="flex flex-col gap-1">
          {cells.map((cell, i) => {
            if (cell.kind === 'markdown') {
              return (
                <div key={i} className="px-1">
                  <Markdown source={cell.source} />
                </div>
              )
            }
            const verify = cell.verifyServices
              ? verificationForServices(cell.verifyServices)
              : null
            return (
              <div key={i} className="my-2">
                {cell.costWarning ? (
                  <div className="mb-2">
                    <Callout variant="cost" title="Cost warning">
                      Running this cell creates billable AWS resources — remove
                      them in the cleanup section.
                    </Callout>
                  </div>
                ) : null}
                <CodeBlock
                  language={cell.language}
                  code={cell.source}
                  verification={verify ?? undefined}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Outline */}
      <nav
        aria-label="Notebook sections"
        className="order-1 lg:order-2 lg:sticky lg:top-24 lg:self-start"
      >
        <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-ink-muted">
          Sections
        </p>
        <ol className="flex flex-col gap-1 text-sm">
          {outline.map((title) => (
            <li key={title}>
              <a
                href={`#${slug(title)}`}
                className="block rounded-md px-2 py-1 text-ink-muted transition-colors hover:bg-neutral-100 hover:text-ink"
              >
                {title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  )
}
