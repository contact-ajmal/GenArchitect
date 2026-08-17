import { useEffect, useMemo, useRef, useState } from 'react'
import { Download, FileText, Package, X } from 'lucide-react'
import type { RagComposition } from '../compose/composition'
import {
  buildScaffold,
  downloadBlob,
  scaffoldRootName,
  zipScaffold,
  type ScaffoldFile,
} from '../export/scaffold'
import { FLAVORS, buildNotebookFromComposition } from '../data/notebookTemplates'
import { compileToFileMap } from '../notebooks/compile'
import { Button } from './ui'
import CodeBlock from './code/CodeBlock'

export interface ExportScaffoldProps {
  composition: RagComposition
  /** Button variant for the trigger. */
  variant?: 'primary' | 'subtle'
  size?: 'sm' | 'md'
  label?: string
}

/**
 * "Export this" — previews the generated project as a file tree and downloads it
 * as a .zip (client-side, via jszip). Reuses the composer's code generation.
 */
export default function ExportScaffold({
  composition,
  variant = 'subtle',
  size = 'md',
  label = 'Export scaffold',
}: ExportScaffoldProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [busy, setBusy] = useState(false)
  const [includeNotebook, setIncludeNotebook] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  const files = useMemo(() => {
    const base = buildScaffold(composition)
    if (!includeNotebook) return base
    const def = buildNotebookFromComposition(composition, FLAVORS.meridian)
    const nb: ScaffoldFile[] = Object.entries(compileToFileMap(def)).map(
      ([path, content]) => ({ path, content, language: 'json' as const }),
    )
    return [...base, ...nb]
  }, [composition, includeNotebook])
  const activeFile = files[Math.min(active, files.length - 1)]

  // Move focus into the dialog on open; restore it on close (Esc handled too).
  useEffect(() => {
    if (!open) return
    returnFocusRef.current = document.activeElement as HTMLElement
    dialogRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      returnFocusRef.current?.focus?.()
    }
  }, [open])

  async function download() {
    setBusy(true)
    try {
      const root = scaffoldRootName(composition)
      const blob = await zipScaffold(files, root)
      downloadBlob(blob, `${root}.zip`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>
        <Package className="h-4 w-4" />
        {label}
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Export reference scaffold"
          onClick={() => setOpen(false)}
        >
          <div
            ref={dialogRef}
            tabIndex={-1}
            className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-hairline bg-neutral-0 shadow-xl focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-hairline px-5 py-3">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                <Package className="h-4 w-4 text-accent-strong" />
                Reference scaffold
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-ink-muted hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 sm:grid-cols-[13rem_minmax(0,1fr)]">
              {/* File tree */}
              <nav
                aria-label="Files"
                className="border-b border-hairline p-2 sm:border-b-0 sm:border-r"
              >
                <ul className="flex flex-col gap-0.5">
                  {files.map((f, i) => (
                    <li key={f.path}>
                      <button
                        type="button"
                        onClick={() => setActive(i)}
                        aria-current={i === active ? 'true' : undefined}
                        className={
                          'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left font-mono text-xs transition-colors ' +
                          (i === active
                            ? 'bg-neutral-100 text-ink'
                            : 'text-ink-muted hover:bg-neutral-100 hover:text-ink')
                        }
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{f.path}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Preview */}
              <div className="min-w-0 overflow-auto p-4">
                <CodeBlock
                  key={activeFile.path}
                  language={activeFile.language}
                  code={activeFile.content}
                  filename={activeFile.path}
                  maxHeight="52vh"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline bg-neutral-50 px-5 py-3">
              <label className="flex items-center gap-2 text-xs text-ink-soft">
                <input
                  type="checkbox"
                  checked={includeNotebook}
                  onChange={(e) => setIncludeNotebook(e.target.checked)}
                  className="h-4 w-4 accent-[color:rgb(var(--accent))]"
                />
                Include a Jupyter notebook
              </label>
              <p className="max-w-xs text-xs text-ink-muted">
                Reference scaffold — not production-hardened. Placeholders only.
              </p>
              <Button onClick={download} disabled={busy}>
                <Download className="h-4 w-4" />
                {busy ? 'Zipping…' : 'Download .zip'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
