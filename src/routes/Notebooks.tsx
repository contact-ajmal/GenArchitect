import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import JSZip from 'jszip'
import { ArrowRight, Download, Eye, Package, Wand2 } from 'lucide-react'
import type { AwsServiceId, DifficultyTier, RagArchitectureId } from '../types'
import { ARCHITECTURE_LIST, ARCHITECTURES } from '../data/architectures'
import { AWS_SERVICES } from '../data/services'
import {
  FEATURED_NOTEBOOKS,
  FLAVORS,
  FLAVOR_LIST,
  buildNotebookDefinition,
} from '../data/notebookTemplates'
import { downloadNotebook, notebookToJson } from '../notebooks/compile'
import { downloadBlob } from '../export/scaffold'
import { Button, Callout, Eyebrow, Pill } from '../components/ui'
import { DIFFICULTY_LABELS, DIFFICULTY_ORDER, difficultyRank } from '../lib/display'

const FEATURED_SERVICES = [
  ...new Set(FEATURED_NOTEBOOKS.flatMap((n) => n.awsServiceIds)),
]

async function downloadAllFeatured() {
  const zip = new JSZip()
  const folder = zip.folder('genarchitect-notebooks')!
  const readme = ['# GenArchitect — featured notebooks', '']
  for (const def of FEATURED_NOTEBOOKS) {
    folder.file(`${def.id}.ipynb`, notebookToJson(def))
    readme.push(`- \`${def.id}.ipynb\` — ${def.title}`)
  }
  readme.push(
    '',
    '> Reference implementations. Verify against current AWS docs; running cells creates billable resources. Not affiliated with AWS.',
  )
  folder.file('README.md', readme.join('\n') + '\n')
  const blob = await zip.generateAsync({ type: 'blob' })
  downloadBlob(blob, 'genarchitect-notebooks.zip')
}

export default function Notebooks() {
  const navigate = useNavigate()
  const [pattern, setPattern] = useState<RagArchitectureId | 'all'>('all')
  const [flavor, setFlavor] = useState<string>('all')
  const [difficulty, setDifficulty] = useState<DifficultyTier | 'all'>('all')
  const [service, setService] = useState<AwsServiceId | 'all'>('all')
  const [genPattern, setGenPattern] = useState<RagArchitectureId>('managed_kb_rag')
  const [genFlavor, setGenFlavor] = useState<string>('meridian')
  const [zipping, setZipping] = useState(false)

  const shown = useMemo(() => {
    return FEATURED_NOTEBOOKS.filter((n) => {
      if (pattern !== 'all' && n.patternId !== pattern) return false
      if (flavor !== 'all' && n.useCaseFlavorId !== flavor) return false
      if (difficulty !== 'all' && n.difficulty !== difficulty) return false
      if (service !== 'all' && !n.awsServiceIds.includes(service)) return false
      return true
    }).sort((a, b) => difficultyRank(a.difficulty) - difficultyRank(b.difficulty))
  }, [pattern, flavor, difficulty, service])

  const generate = () => {
    const def = buildNotebookDefinition(genPattern, FLAVORS[genFlavor])
    navigate(`/notebooks/${def.id}`)
  }

  return (
    <div className="mx-auto max-w-content px-4 py-12 sm:px-6">
      <header className="max-w-3xl">
        <Eyebrow>Notebook library</Eyebrow>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          End-to-end reference notebooks
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">
          Downloadable Jupyter notebooks — setup → knowledge base → agent →
          retrieval → evaluation → teardown — for every RAG pattern across real
          enterprise scenarios. Adapt them to your own corpus. They’re reference
          implementations: verify against current AWS docs, and running them
          creates billable resources.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            disabled={zipping}
            onClick={async () => {
              setZipping(true)
              try {
                await downloadAllFeatured()
              } finally {
                setZipping(false)
              }
            }}
          >
            <Package className="h-4 w-4" />
            {zipping ? 'Zipping…' : 'Download all featured'}
          </Button>
        </div>
      </header>

      {/* Filters */}
      <div className="mt-8 flex flex-wrap items-end gap-x-6 gap-y-4 rounded-xl border border-hairline bg-neutral-0 p-4">
        <Select
          label="Pattern"
          value={pattern}
          onChange={(v) => setPattern(v as RagArchitectureId | 'all')}
          options={[
            { value: 'all', label: 'All patterns' },
            ...ARCHITECTURE_LIST.map((a) => ({ value: a.id, label: a.name })),
          ]}
        />
        <Select
          label="Use case"
          value={flavor}
          onChange={setFlavor}
          options={[
            { value: 'all', label: 'All use cases' },
            ...FLAVOR_LIST.map((f) => ({ value: f.id, label: f.name })),
          ]}
        />
        <Select
          label="AWS service"
          value={service}
          onChange={(v) => setService(v as AwsServiceId | 'all')}
          options={[
            { value: 'all', label: 'All services' },
            ...FEATURED_SERVICES.map((id) => ({ value: id, label: AWS_SERVICES[id].name })),
          ]}
        />
        <fieldset>
          <legend className="mb-1.5 font-mono text-[11px] uppercase tracking-wide text-ink-muted">
            Difficulty
          </legend>
          <div className="flex flex-wrap gap-1">
            {(['all', ...DIFFICULTY_ORDER] as (DifficultyTier | 'all')[]).map((d) => (
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
      </div>

      <p className="mt-3 text-sm text-ink-muted" aria-live="polite">
        {shown.length} featured notebook{shown.length === 1 ? '' : 's'}.
      </p>

      {/* Gallery */}
      <ul className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((n) => (
          <li key={n.id}>
            <div className="flex h-full flex-col rounded-xl border border-hairline bg-neutral-0 p-5">
              <div className="flex flex-wrap items-center gap-1.5">
                <Pill variant="managed">{ARCHITECTURES[n.patternId].name}</Pill>
                <Pill variant="aws">{n.flavor.industry}</Pill>
                <Pill variant="difficulty">{DIFFICULTY_LABELS[n.difficulty]}</Pill>
              </div>
              <h2 className="mt-3 font-display text-lg font-semibold text-ink">
                {n.title}
              </h2>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-ink-soft">
                {n.description}
              </p>
              <p className="mt-3 font-mono text-[11px] text-ink-muted">
                {n.estimatedTime} · {n.awsServiceIds.length} AWS services
              </p>
              <div className="mt-4 flex gap-2">
                <Link to={`/notebooks/${n.id}`} className="flex-1">
                  <Button size="sm" variant="subtle" className="w-full">
                    <Eye className="h-4 w-4" />
                    Preview
                  </Button>
                </Link>
                <Button size="sm" onClick={() => downloadNotebook(n)}>
                  <Download className="h-4 w-4" />
                  .ipynb
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Generate any combination */}
      <section className="mt-14 rounded-2xl border border-hairline bg-neutral-0 p-6">
        <div className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-accent-strong" />
          <Eyebrow>Generate any combination</Eyebrow>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Every pattern × use case is generatable. Featured notebooks are curated;
          generated ones are mechanical assemblies from the same sections — still
          complete, just not hand-picked.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <Select
            label="Pattern"
            value={genPattern}
            onChange={(v) => setGenPattern(v as RagArchitectureId)}
            options={ARCHITECTURE_LIST.map((a) => ({ value: a.id, label: a.name }))}
          />
          <Select
            label="Use case"
            value={genFlavor}
            onChange={setGenFlavor}
            options={FLAVOR_LIST.map((f) => ({ value: f.id, label: f.name }))}
          />
          <Button onClick={generate}>
            Generate &amp; preview
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      <div className="mt-8">
        <Callout variant="note" title="Reference, not production">
          Notebooks compile from the same code fragments as the composer and the
          catalog — one source of truth. They’re reference implementations to
          adapt: verify syntax against current AWS docs, use placeholder
          credentials, and tear down billable resources when done.
        </Callout>
      </div>
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-ink-muted">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-md border border-hairline bg-neutral-0 px-2.5 text-sm text-ink focus-visible:ring-2 focus-visible:ring-accent"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
