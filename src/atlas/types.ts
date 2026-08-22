import type { AwsServiceId } from '../types'

/**
 * ============================================================================
 * Atlas content model — the Strands, AgentCore and Retrieval visual atlases.
 * ============================================================================
 *
 * CRITICAL RULE — read before authoring any content:
 *
 *   ALL explanation prose in the atlases MUST be ORIGINAL — written in our own
 *   words. NEVER copy documentation text from AWS, Strands, or a paper. Link
 *   to the canonical source (via `docUrl`) for exact syntax and API detail.
 *
 * This is both a LEGAL requirement (the docs are copyrighted; original
 * explanation + linking is defensible, copying is not) and a MAINTENANCE
 * strategy (a concept atlas with freshness metadata ages gracefully; a doc
 * mirror is stale on arrival). Coverage is tracked explicitly via CoverageMap
 * so "complete coverage" is a verifiable claim, not a vibe.
 */

export type AtlasId = 'strands' | 'agentcore' | 'retrieval'

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

/* --- Chunking lab ---------------------------------------------------------- */

/**
 * One chunk exactly as it would be embedded. The text is carried on the chunk
 * rather than derived from the document by offsets, because what teaches
 * chunking is seeing the literal string that becomes a vector — including the
 * sentence a fixed-size rule cut in half.
 */
export interface ChunkPiece {
  id: string
  label: string
  /** The exact text this chunk contains. */
  text: string
  /**
   * Leading characters of `text` to tint. Overlap from the previous chunk by
   * default; set `leadInNote` when it is something else, such as context
   * prepended at ingest.
   */
  overlapChars?: number
  /** Caption for the tinted lead-in, replacing the default overlap wording. */
  leadInNote?: string
  /** Approximate token count (authored — we do not tokenize in the browser). */
  tokens: number
  /** Per-chunk caveat, e.g. "splits mid-sentence". */
  warning?: string
  /** For hierarchical strategies: the parent chunk this child belongs to. */
  parentId?: string
}

/** One way of splitting the same document. */
export interface ChunkStrategy {
  id: string
  label: string
  /** The splitting rule in one line. */
  rule: string
  /** Config summary, e.g. "max 512 tokens - overlap 50". */
  config?: string
  benefit: string
  caveat?: string
  /** What the retriever hands the model on a hit (differs for hierarchical). */
  retrievedNote?: string
  chunks: ChunkPiece[]
}

/* --- Vector space ---------------------------------------------------------- */

export interface VectorPoint {
  id: string
  label: string
  /** Normalized position in a 0-100 projected space. */
  x: number
  y: number
  /** Drives the point color; must match a `groups` entry when present. */
  group?: string
  /** Metadata a filter can test, e.g. { dept: "claims" }. */
  meta?: Record<string, string>
  /** Similarity to the query, 0-1. Authored — the app computes no embeddings. */
  similarity: number
}

/** A metadata filter the viewer can toggle, to show pre-filtering in action. */
export interface VectorFilter {
  label: string
  key: string
  value: string
}

/* --- Rank comparison ------------------------------------------------------- */

export interface RankedItem {
  id: string
  label: string
  /** First-stage retrieval score, 0-1. */
  firstScore: number
  /** Score after reranking, 0-1. */
  rerankScore: number
  /** The chunk that actually answers the question. */
  answerBearing?: boolean
  note?: string
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
  | {
      kind: 'chunk_lab'
      /** The source document, shown above the split so the input is visible. */
      document: { title: string; body: string }
      strategies: ChunkStrategy[]
    }
  | {
      kind: 'vector_space'
      query: { label: string; x: number; y: number }
      points: VectorPoint[]
      /** How many neighbours the retriever asks for. */
      topK: number
      filter?: VectorFilter
      groups?: { id: string; label: string }[]
      note?: string
    }
  | {
      kind: 'rank_compare'
      firstStageLabel: string
      rerankedLabel: string
      items: RankedItem[]
      takeaway: string
    }

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
