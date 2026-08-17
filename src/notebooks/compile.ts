import { verificationForServices } from '../data/verification'
import { downloadBlob } from '../export/scaffold'
import { assembleNotebook } from './sections'
import { md, type CodeCell, type NotebookCell, type NotebookDefinition } from './model'

/**
 * Compile a NotebookDefinition to a valid nbformat-4 .ipynb JSON object. Adds
 * the standard framing (title, honesty, credentials) and injects cost/verify
 * admonitions around flagged cells. Never executes anything.
 */

interface IpynbCell {
  id?: string
  cell_type: 'markdown' | 'code'
  metadata: Record<string, unknown>
  source: string[]
  execution_count?: null
  outputs?: unknown[]
}

export interface Ipynb {
  cells: IpynbCell[]
  metadata: {
    kernelspec: { display_name: string; language: string; name: string }
    language_info: { name: string }
  }
  nbformat: 4
  nbformat_minor: 5
}

/** nbformat wants source as an array of lines, each ending in \n except last. */
function toSourceArray(text: string): string[] {
  const t = text.replace(/\n$/, '')
  const lines = t.split('\n')
  return lines.map((l, i) => (i < lines.length - 1 ? l + '\n' : l))
}

function mdCell(source: string): IpynbCell {
  return { cell_type: 'markdown', metadata: {}, source: toSourceArray(source) }
}

function codeCell(text: string): IpynbCell {
  return {
    cell_type: 'code',
    metadata: {},
    execution_count: null,
    outputs: [],
    source: toSourceArray(text),
  }
}

const COST_ADMONITION =
  '> 💸 **Cost warning** — running this cell creates billable AWS resources. Tear them down in the cleanup section when you are done.'

function verifyAdmonition(cell: CodeCell): string | null {
  if (!cell.verifyServices || cell.verifyServices.length === 0) return null
  const rec = verificationForServices(cell.verifyServices)
  if (!rec) return null
  return `> ⚠️ **Verify against current AWS docs** — this syntax can drift (${rec.volatility}). [Canonical docs](${rec.sourceUrl})`
}

function framingCells(def: NotebookDefinition): NotebookCell[] {
  const prereqs = def.prerequisites.map((p) => `- ${p}`).join('\n')
  return [
    md(
      `# ${def.title}

${def.description}

**Pattern:** \`${def.patternId}\` · **Use case:** ${def.flavor.name} (${def.flavor.industry}) · **Difficulty:** ${def.difficulty} · **Est. time:** ${def.estimatedTime}`,
    ),
    md(
      `> **Reference implementation — read before running.**
>
> - This notebook is a **reference implementation** for learning. Verify every command against the **current AWS documentation** — Bedrock, AgentCore, and Strands syntax changes.
> - **Running cells creates billable AWS resources** (knowledge bases, models, and — if you deploy — a runtime). The final **cleanup** section removes them.
> - **No secrets here.** Credentials come from your environment; cells use **placeholders only**.
> - GenArchitect is an independent educational project and is **not affiliated with, sponsored by, or endorsed by AWS**.

### Prerequisites
${prereqs}`,
    ),
  ]
}

/** The full ordered cell list (framing + body) — shared by compile and preview. */
export function notebookCells(def: NotebookDefinition): NotebookCell[] {
  return [...framingCells(def), ...assembleNotebook(def.composition, def.flavor)]
}

export function compileNotebook(def: NotebookDefinition): Ipynb {
  const all: NotebookCell[] = notebookCells(def)

  const cells: IpynbCell[] = []
  for (const cell of all) {
    if (cell.kind === 'markdown') {
      cells.push(mdCell(cell.source))
      continue
    }
    // Code cell: cost admonition before, verify admonition after.
    if (cell.costWarning) cells.push(mdCell(COST_ADMONITION))
    const prefix = cell.language === 'bash' ? '%%bash\n' : ''
    cells.push(codeCell(prefix + cell.source))
    const verify = verifyAdmonition(cell)
    if (verify) cells.push(mdCell(verify))
  }

  // Stable per-cell ids (nbformat 4.5+).
  cells.forEach((c, i) => {
    c.id = `cell-${i}`
  })

  return {
    cells,
    metadata: {
      kernelspec: { display_name: 'Python 3', language: 'python', name: 'python3' },
      language_info: { name: 'python' },
    },
    nbformat: 4,
    nbformat_minor: 5,
  }
}

/** Structural nbformat validation — for the dev-time check. */
export function validateNotebook(nb: Ipynb): string[] {
  const errors: string[] = []
  if (nb.nbformat !== 4) errors.push('nbformat must be 4')
  if (!Array.isArray(nb.cells)) errors.push('cells must be an array')
  if (!nb.metadata?.kernelspec) errors.push('missing metadata.kernelspec')
  nb.cells?.forEach((c, i) => {
    if (c.cell_type !== 'markdown' && c.cell_type !== 'code')
      errors.push(`cell ${i}: invalid cell_type`)
    if (!Array.isArray(c.source)) errors.push(`cell ${i}: source must be an array`)
    if (c.cell_type === 'code' && !('outputs' in c))
      errors.push(`cell ${i}: code cell missing outputs`)
  })
  return errors
}

export function notebookToJson(def: NotebookDefinition): string {
  return JSON.stringify(compileNotebook(def), null, 1)
}

/** Compile and download as [id].ipynb (client-side). */
export function downloadNotebook(def: NotebookDefinition): void {
  const blob = new Blob([notebookToJson(def)], { type: 'application/x-ipynb+json' })
  downloadBlob(blob, `${def.id}.ipynb`)
}

/** For Phase 17 scaffold export to optionally include a notebook. */
export function compileToFileMap(def: NotebookDefinition): Record<string, string> {
  return { [`${def.id}.ipynb`]: notebookToJson(def) }
}
