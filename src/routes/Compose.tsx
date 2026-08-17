import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, Bookmark, FolderOpen, Save } from 'lucide-react'
import type { RagArchitectureId } from '../types'
import { ARCHITECTURE_LIST, ARCHITECTURES } from '../data/architectures'
import { Button, Callout, Eyebrow } from '../components/ui'
import RagDiagram from '../components/diagram/RagDiagram'
import CodeBlock from '../components/code/CodeBlock'
import ExportScaffold from '../components/ExportScaffold'
import { NotebookText } from 'lucide-react'
import {
  FLAVORS,
  FLAVOR_LIST,
  buildNotebookFromComposition,
} from '../data/notebookTemplates'
import { downloadNotebook } from '../notebooks/compile'
import {
  DATA_SOURCE_LABELS,
  DEFAULT_COMPOSITION,
  MANAGED_ONLY_SOURCES,
  compositionFromPattern,
  type DataSource,
  type RagComposition,
} from '../compose/composition'
import {
  calloutVariantFor,
  diagnose,
  nearestPattern,
  normalizeComposition,
} from '../compose/rules'
import { compositionToDiagram, nodesForControl } from '../compose/diagram'
import { generateCode } from '../compose/generateCode'
import { verificationForServices } from '../data/verification'
import type { AwsServiceId } from '../types'

const SAVED_KEY = 'genarchitect:compose:saved'

interface SavedComposition {
  name: string
  composition: RagComposition
}

function loadSaved(): SavedComposition[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]')
  } catch {
    return []
  }
}

/* --- small control primitives --------------------------------------------- */
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-hairline bg-neutral-0 p-4">
      <legend className="px-1 font-mono text-[11px] uppercase tracking-wide text-ink-muted">
        {title}
      </legend>
      <div className="mt-1 flex flex-col gap-3">{children}</div>
    </fieldset>
  )
}

function Toggle({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  hint?: string
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3">
      <span>
        <span className="text-sm font-medium text-ink">{label}</span>
        {hint ? (
          <span className="block text-xs text-ink-muted">{hint}</span>
        ) : null}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-[color:rgb(var(--accent))]"
      />
    </label>
  )
}

function Radio<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-ink">{label}</p>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={
              'rounded-md px-2.5 py-1 text-sm font-medium transition-colors ' +
              (value === o.value
                ? 'bg-ink text-neutral-0'
                : 'text-ink-muted hover:bg-neutral-100 hover:text-ink')
            }
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export interface ComposeProps {
  initialComposition?: RagComposition
}

export default function Compose({ initialComposition }: ComposeProps) {
  const location = useLocation()
  const seeded = (location.state as { composition?: RagComposition } | null)
    ?.composition

  const [comp, setComp] = useState<RagComposition>(
    () => initialComposition ?? seeded ?? DEFAULT_COMPOSITION,
  )
  const [highlighted, setHighlighted] = useState<string[]>([])
  const [activeFile, setActiveFile] = useState(0)
  const [saved, setSaved] = useState<SavedComposition[]>(() => loadSaved())
  const [notebookFlavor, setNotebookFlavor] = useState('meridian')
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const diagram = useMemo(() => compositionToDiagram(comp), [comp])
  const files = useMemo(() => generateCode(comp), [comp])
  const codeVerification = useMemo(() => {
    const ids = [
      ...new Set(
        diagram.layers
          .map((l) => l.awsServiceId)
          .filter((x): x is AwsServiceId => Boolean(x)),
      ),
    ]
    return verificationForServices(ids)
  }, [diagram])
  const diagnostics = useMemo(() => diagnose(comp), [comp])
  const nearest = useMemo(() => nearestPattern(comp), [comp])

  const fileIndex = Math.min(activeFile, files.length - 1)

  function update(patch: Partial<RagComposition>, control?: string) {
    setComp((prev) => normalizeComposition({ ...prev, ...patch }))
    if (control) {
      const nodes = nodesForControl(control)
      if (nodes.length) {
        setHighlighted(nodes)
        if (clearTimer.current) clearTimeout(clearTimer.current)
        clearTimer.current = setTimeout(() => setHighlighted([]), 1500)
      }
    }
  }

  useEffect(
    () => () => {
      if (clearTimer.current) clearTimeout(clearTimer.current)
    },
    [],
  )

  function saveComposition() {
    const entry = { name: comp.name || 'Untitled', composition: comp }
    const next = [
      entry,
      ...saved.filter((s) => s.name !== entry.name),
    ].slice(0, 20)
    setSaved(next)
    localStorage.setItem(SAVED_KEY, JSON.stringify(next))
  }

  const toggleSource = (src: DataSource, on: boolean) => {
    const set = new Set(comp.dataSources)
    if (on) set.add(src)
    else set.delete(src)
    update({ dataSources: [...set] }, 'dataSources')
  }

  const customerManaged = comp.knowledgeBase === 'customer_managed'

  return (
    <div className="mx-auto max-w-content px-4 py-10 sm:px-6">
      <header className="max-w-3xl">
        <Eyebrow>The composer</Eyebrow>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Compose your own RAG
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">
          Assemble an architecture from components and watch the diagram and
          idiomatic Strands/AgentCore reference code assemble live. Everything is
          reference-only — verify exact syntax against current AWS docs.
        </p>
      </header>

      {/* Preset + save/load bar */}
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-hairline bg-neutral-0 p-3">
        <label className="flex items-center gap-2 text-sm">
          <Bookmark className="h-4 w-4 text-ink-muted" />
          <span className="text-ink-muted">Start from a pattern</span>
          <select
            value=""
            onChange={(e) => {
              if (e.target.value)
                setComp(
                  compositionFromPattern(e.target.value as RagArchitectureId),
                )
            }}
            className="h-9 rounded-md border border-hairline bg-neutral-0 px-2 text-sm text-ink"
          >
            <option value="">Choose…</option>
            {ARCHITECTURE_LIST.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>

        <input
          value={comp.name}
          onChange={(e) => update({ name: e.target.value })}
          aria-label="Composition name"
          className="h-9 min-w-[10rem] flex-1 rounded-md border border-hairline bg-neutral-50 px-3 text-sm text-ink"
        />
        <Button size="sm" variant="subtle" onClick={saveComposition}>
          <Save className="h-4 w-4" />
          Save
        </Button>
        <ExportScaffold composition={comp} size="sm" />
        <span className="inline-flex items-center gap-1">
          <select
            value={notebookFlavor}
            onChange={(e) => setNotebookFlavor(e.target.value)}
            aria-label="Notebook use case"
            className="h-8 rounded-md border border-hairline bg-neutral-0 px-2 text-xs text-ink"
          >
            {FLAVOR_LIST.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            variant="subtle"
            onClick={() =>
              downloadNotebook(
                buildNotebookFromComposition(comp, FLAVORS[notebookFlavor]),
              )
            }
          >
            <NotebookText className="h-4 w-4" />
            Notebook
          </Button>
        </span>
        {saved.length > 0 ? (
          <label className="flex items-center gap-2 text-sm">
            <FolderOpen className="h-4 w-4 text-ink-muted" />
            <select
              value=""
              onChange={(e) => {
                const found = saved.find((s) => s.name === e.target.value)
                if (found) setComp(found.composition)
              }}
              className="h-9 rounded-md border border-hairline bg-neutral-0 px-2 text-sm text-ink"
            >
              <option value="">Open saved…</option>
              {saved.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        {/* LEFT — controls */}
        <div className="flex flex-col gap-4">
          <Group title="Knowledge &amp; sources">
            <Radio
              label="Knowledge base"
              value={comp.knowledgeBase}
              onChange={(v) => update({ knowledgeBase: v }, 'knowledgeBase')}
              options={[
                { value: 'managed_kb', label: 'Managed KB' },
                { value: 'customer_managed', label: 'Customer-managed' },
              ]}
            />
            {customerManaged ? (
              <Radio
                label="Vector store"
                value={comp.vectorStore}
                onChange={(v) => update({ vectorStore: v })}
                options={[
                  { value: 'opensearch_serverless', label: 'OpenSearch' },
                  { value: 'aurora_pgvector', label: 'Aurora pgvector' },
                  { value: 'neptune', label: 'Neptune' },
                ]}
              />
            ) : null}
            <div>
              <p className="mb-1.5 text-sm font-medium text-ink">Data sources</p>
              <div className="flex flex-col gap-1.5">
                {(Object.keys(DATA_SOURCE_LABELS) as DataSource[]).map((src) => {
                  const managedOnly = MANAGED_ONLY_SOURCES.includes(src)
                  const disabled = managedOnly && customerManaged
                  return (
                    <label
                      key={src}
                      className={
                        'flex items-center gap-2 text-sm ' +
                        (disabled ? 'opacity-40' : 'cursor-pointer')
                      }
                    >
                      <input
                        type="checkbox"
                        disabled={disabled}
                        checked={comp.dataSources.includes(src)}
                        onChange={(e) => toggleSource(src, e.target.checked)}
                        className="h-4 w-4 accent-[color:rgb(var(--accent))]"
                      />
                      {DATA_SOURCE_LABELS[src]}
                      {managedOnly ? (
                        <span className="font-mono text-[10px] text-ink-muted">
                          managed-KB
                        </span>
                      ) : null}
                    </label>
                  )
                })}
              </div>
            </div>
          </Group>

          <Group title="Retrieval">
            <Radio
              label="Retrieval mode"
              value={comp.retrievalMode}
              onChange={(v) => update({ retrievalMode: v }, 'retrievalMode')}
              options={[
                { value: 'retrieve_single', label: 'Single-shot' },
                { value: 'agentic_retrieval', label: 'Agentic' },
              ]}
            />
            <Toggle
              label="Reranking"
              hint="Over-fetch + rerank for precision"
              checked={comp.reranking}
              onChange={(v) => update({ reranking: v }, 'reranking')}
            />
            <Toggle
              label="Multiple knowledge bases"
              hint="Route across KBs via Gateway"
              checked={comp.multiKb}
              onChange={(v) => update({ multiKb: v }, 'multiKb')}
            />
            <Toggle
              label="Graph-augmented"
              hint="Relationship traversal (Neptune)"
              checked={comp.graphAugmented}
              onChange={(v) => update({ graphAugmented: v }, 'graphAugmented')}
            />
          </Group>

          <Group title="Reasoning &amp; memory">
            <Radio
              label="Orchestration"
              value={comp.orchestration}
              onChange={(v) => update({ orchestration: v }, 'orchestration')}
              options={[
                { value: 'single_agent', label: 'Single agent' },
                { value: 'multi_agent', label: 'Multi-agent' },
              ]}
            />
            <Radio
              label="Memory"
              value={comp.memory}
              onChange={(v) => update({ memory: v }, 'memory')}
              options={[
                { value: 'none', label: 'None' },
                { value: 'session', label: 'Session' },
                { value: 'long_term', label: 'Long-term' },
              ]}
            />
          </Group>

          <Group title="Security">
            <Toggle
              label="Bedrock Guardrails"
              hint="PII, denied topics, grounding"
              checked={comp.guardrails}
              onChange={(v) => update({ guardrails: v }, 'guardrails')}
            />
            <Radio
              label="Access control"
              value={comp.accessControl}
              onChange={(v) => update({ accessControl: v }, 'accessControl')}
              options={[
                { value: 'none', label: 'None' },
                { value: 'document_acls', label: 'Per-user ACLs' },
              ]}
            />
            <Toggle
              label="AgentCore Gateway"
              hint="Expose tools/KBs as MCP with central auth"
              checked={comp.gateway}
              onChange={(v) => update({ gateway: v }, 'gateway')}
            />
          </Group>

          <Group title="Deploy &amp; operate">
            <Radio
              label="Deploy target"
              value={comp.deployTarget}
              onChange={(v) => update({ deployTarget: v }, 'deployTarget')}
              options={[
                { value: 'local', label: 'Local' },
                { value: 'agentcore_runtime', label: 'AgentCore Runtime' },
              ]}
            />
            <Toggle
              label="Observability"
              hint="Traces/metrics to CloudWatch"
              checked={comp.observability}
              onChange={(v) => update({ observability: v }, 'observability')}
            />
            <Toggle
              label="Evaluations"
              hint="LLM-as-judge quality gate"
              checked={comp.evaluations}
              onChange={(v) => update({ evaluations: v }, 'evaluations')}
            />
          </Group>
        </div>

        {/* RIGHT — diagram + code + diagnostics */}
        <div className="flex min-w-0 flex-col gap-5">
          {/* Nearest pattern */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent/[0.05] p-4">
            <p className="text-sm text-ink-soft">
              <span className="font-mono text-[11px] uppercase tracking-wide text-accent-strong">
                Resembles —{' '}
              </span>
              <strong className="text-ink">
                {ARCHITECTURES[nearest.id].name}
              </strong>{' '}
              · {nearest.reason}
            </p>
            <Link
              to={`/architecture/${nearest.id}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-strong hover:underline"
            >
              Deep dive
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Diagram */}
          <div className="overflow-hidden rounded-xl border border-hairline bg-neutral-0 p-3">
            <RagDiagram
              architecture={diagram}
              highlightedComponentIds={highlighted}
            />
          </div>

          {/* Diagnostics */}
          {diagnostics.length > 0 ? (
            <div className="flex flex-col gap-2">
              {diagnostics.map((d) => (
                <Callout key={d.id} variant={calloutVariantFor(d.level)}>
                  {d.message}
                </Callout>
              ))}
            </div>
          ) : null}

          {/* Generated code */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Eyebrow>Generated reference code</Eyebrow>
            </div>
            <Callout variant="warning" title="Reference implementation">
              Generated code teaches the shape. Verify exact SDK/CLI/API syntax
              against current AWS documentation before running anything.
            </Callout>
            <div className="mt-3 flex flex-wrap gap-1 border-b border-hairline">
              {files.map((f, i) => (
                <button
                  key={f.filename}
                  type="button"
                  onClick={() => setActiveFile(i)}
                  aria-pressed={i === fileIndex}
                  className={
                    '-mb-px border-b-2 px-3 py-1.5 font-mono text-xs transition-colors ' +
                    (i === fileIndex
                      ? 'border-accent text-ink'
                      : 'border-transparent text-ink-muted hover:text-ink')
                  }
                >
                  {f.filename}
                </button>
              ))}
            </div>
            <div className="mt-3">
              <CodeBlock
                key={files[fileIndex].filename}
                language={files[fileIndex].language}
                code={files[fileIndex].code}
                filename={files[fileIndex].filename}
                verification={codeVerification ?? undefined}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
