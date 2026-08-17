import type { AwsServiceId } from '../types'

/**
 * ============================================================================
 * Atlas content model — the Strands and AgentCore visual documentation atlases.
 * ============================================================================
 *
 * CRITICAL RULE — read before authoring any content:
 *
 *   ALL explanation prose in the atlases MUST be ORIGINAL — written in our own
 *   words. NEVER copy documentation text from AWS or Strands. Link to the
 *   canonical docs (via `docUrl`) for exact syntax and API detail.
 *
 * This is both a LEGAL requirement (the docs are copyrighted; original
 * explanation + linking is defensible, copying is not) and a MAINTENANCE
 * strategy (a concept atlas with freshness metadata ages gracefully; a doc
 * mirror is stale on arrival). Coverage is tracked explicitly via CoverageMap
 * so "complete coverage" is a verifiable claim, not a vibe.
 */

export type AtlasId = 'strands' | 'agentcore'

export type CoverageStatus = 'full' | 'overview' | 'planned'

/* ----------------------------------------------------------------------------
 * Visual payloads — one per visual treatment. A topic names its treatment and
 * carries the typed data that drives the corresponding primitive component.
 * -------------------------------------------------------------------------- */

export interface ConceptNode {
  id: string
  label: string
  sublabel?: string
  detail?: string
  /** Normalized position in a 0–100 viewBox. */
  x: number
  y: number
  accent?: string
}

export interface ConceptEdge {
  from: string
  to: string
  label?: string
  dashed?: boolean
}

/** Optional selector that highlights subsets of nodes (e.g. Gateway targets). */
export interface ConceptSelector {
  label: string
  options: {
    id: string
    label: string
    highlightNodeIds: string[]
    note: string
  }[]
}

export interface LoopStage {
  id: string
  label: string
  plain: string
  technical?: string
  /** A short "message" traveling through this stage of the loop. */
  message?: string
}

export interface FlowStep {
  id: string
  label: string
  plain: string
  technical?: string
  codeSampleId?: string
}

export interface MatrixCell {
  text: string
  tone?: 'good' | 'bad' | 'neutral'
}

export interface MatrixRow {
  label: string
  cells: (string | MatrixCell)[]
  note?: string
}

export interface DecisionNode {
  id: string
  /** A branch node poses a question with options; a leaf gives a recommendation. */
  question?: string
  options?: { label: string; next: DecisionNode }[]
  recommendation?: string
  reasoning?: string
}

export interface StackLayer {
  id: string
  label: string
  role: string
  detail?: string
  topicId?: string
  accent?: string
}

export interface TraceSpan {
  id: string
  label: string
  detail: string
  /** Indentation depth (0 = root). */
  depth: number
  kind?: 'entrypoint' | 'auth' | 'gateway' | 'tool' | 'model' | 'memory' | 'response'
  note?: string
}

export interface TimelineStage {
  id: string
  label: string
  plain: string
  technical?: string
}

export type AtlasVisual =
  | { kind: 'none'; reason: string }
  | {
      kind: 'concept_diagram'
      nodes: ConceptNode[]
      edges: ConceptEdge[]
      selector?: ConceptSelector
      height?: number
    }
  | { kind: 'animated_loop'; stages: LoopStage[] }
  | { kind: 'flow_walkthrough'; steps: FlowStep[] }
  | { kind: 'comparison_matrix'; columns: string[]; rows: MatrixRow[] }
  | { kind: 'decision_tree'; root: DecisionNode }
  | { kind: 'layered_stack'; layers: StackLayer[] }
  | { kind: 'sequence_trace'; spans: TraceSpan[] }
  | { kind: 'lifecycle_timeline'; stages: TimelineStage[] }

export type AtlasVisualKind = AtlasVisual['kind']

/* ----------------------------------------------------------------------------
 * Topics & sections.
 * -------------------------------------------------------------------------- */

/** An inline reference code sample owned by an atlas topic. */
export interface AtlasCodeSample {
  id: string
  title: string
  language: 'python' | 'typescript' | 'bash' | 'json'
  filename?: string
  code: string
  /** Services whose syntax may drift (drives the freshness badge). */
  verifyServices?: AwsServiceId[]
}

export interface AtlasTopic {
  id: string
  atlasId: AtlasId
  sectionId: string
  title: string
  oneLiner: string
  whyItMatters: string
  /** Original prose, dual-register: plain for a newcomer, technical for depth. */
  explanation: { plain: string; technical: string }
  visual: AtlasVisual
  codeSamples?: AtlasCodeSample[]
  relatedTopicIds?: string[]
  /** Where this is applied elsewhere in the app (deep cross-links). */
  appliedIn?: { label: string; to: string }[]
  /** Canonical documentation link — required, real URL only. */
  docUrl: string
  /** Ties into the Phase 13 freshness layer. */
  verificationId?: AwsServiceId
  coverageStatus: CoverageStatus
  tags: string[]
}

export interface AtlasSection {
  id: string
  atlasId: AtlasId
  title: string
  order: number
  blurb: string
  topics: AtlasTopic[]
}

/* ----------------------------------------------------------------------------
 * Coverage — makes "everything is covered" auditable.
 * -------------------------------------------------------------------------- */

export interface CoverageEntry {
  sectionTitle: string
  topicTitle: string
  status: CoverageStatus
  docUrl: string
}

export function buildCoverageMap(sections: AtlasSection[]): CoverageEntry[] {
  return sections.flatMap((s) =>
    s.topics.map((t) => ({
      sectionTitle: s.title,
      topicTitle: t.title,
      status: t.coverageStatus,
      docUrl: t.docUrl,
    })),
  )
}

/** Flatten sections to an ordered topic list (for prev/next + search). */
export function flattenTopics(sections: AtlasSection[]): AtlasTopic[] {
  return [...sections]
    .sort((a, b) => a.order - b.order)
    .flatMap((s) => s.topics)
}
