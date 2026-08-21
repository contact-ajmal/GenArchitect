/**
 * ============================================================================
 * GenArchitect — content model (the content contract)
 * ============================================================================
 *
 * The entire app is data-driven from these types. The flow is:
 *
 *   1. Content lives in `src/data/` as typed objects (RagArchitecture,
 *      MeridianScenario, the AwsService registry, code samples).
 *   2. Components in `src/components/` and route screens render that content —
 *      they hold no domain knowledge of their own.
 *   3. The signature interaction — the synced diagram <-> code walkthrough —
 *      is expressed entirely by data:
 *        - `WalkthroughStep.diagramComponentIds` says which diagram nodes light
 *          up for a step, and
 *        - `WalkthroughStep.codeHighlightRange` (or, symmetrically,
 *          `CodeSample.highlightForStep[stepId]`) says which code lines
 *          emphasize for that same step.
 *      So "step 3 highlights these diagram nodes AND these code lines" is a
 *      pure content statement — no bespoke wiring per architecture.
 *
 * This file is types + JSDoc only. No runtime values.
 */

/* ----------------------------------------------------------------------------
 * Primitive id + shared aliases
 * -------------------------------------------------------------------------- */

/** Stable id of a walkthrough step (unique within one architecture). */
export type StepId = string

/** Stable id of a code sample (unique within one architecture). */
export type CodeSampleId = string

/** Stable id of a diagram component / node (unique within one architecture). */
export type DiagramComponentId = string

/**
 * A single 1-based line number, or an inclusive `[start, end]` range.
 * Mirrors the `LineRange` accepted by the CodeBlock component.
 */
export type LineRange = number | [number, number]

/** An ordered collection of line highlights (numbers and/or ranges). */
export type LineRanges = LineRange[]

/* ----------------------------------------------------------------------------
 * 1. RAG architectures taught by the app
 * -------------------------------------------------------------------------- */

/**
 * The catalog of RAG patterns GenArchitect teaches, ordered roughly from
 * foundational to production-grade. See Phase 3 for the authored content.
 */
export type RagArchitectureId =
  | 'naive_rag'
  | 'managed_kb_rag'
  | 'hybrid_rerank_rag'
  | 'agentic_rag'
  | 'multi_kb_agentic_rag'
  | 'graph_rag'
  | 'memory_augmented_rag'
  | 'multi_agent_rag'
  | 'guardrailed_secure_rag'

/** How much architectural maturity a pattern demands to run well. */
export type DifficultyTier =
  | 'foundational'
  | 'intermediate'
  | 'advanced'
  | 'production'

/* ----------------------------------------------------------------------------
 * 2. AWS / AgentCore / Strands building blocks
 * -------------------------------------------------------------------------- */

/** Broad grouping used to filter and color-code service references. */
export type AwsServiceCategory =
  | 'agentcore'
  | 'bedrock'
  | 'storage'
  | 'vector'
  | 'security'
  | 'observability'
  | 'framework'

/**
 * The typed set of building blocks the app references. Each id maps to exactly
 * one {@link AwsService} record in the data registry.
 */
export type AwsServiceId =
  // Amazon Bedrock AgentCore
  | 'agentcore_runtime'
  | 'agentcore_memory'
  | 'agentcore_gateway'
  | 'agentcore_identity'
  | 'agentcore_browser'
  | 'agentcore_code_interpreter'
  | 'agentcore_observability'
  | 'agentcore_evaluations'
  | 'agentcore_policy'
  // Amazon Bedrock
  | 'bedrock_kb_managed'
  | 'bedrock_kb_customer_managed'
  | 'bedrock_foundation_models'
  | 'bedrock_guardrails'
  // Vector / storage
  | 'opensearch_serverless'
  | 'aurora_pgvector'
  | 'neptune'
  | 's3'
  // Security / observability
  | 'iam'
  | 'cloudwatch'
  // Agent frameworks
  | 'strands_sdk'
  | 'strands_agents_tools'
  | 'mcp'

/**
 * A single building block: an AWS service, an AgentCore capability, or a
 * Strands/MCP framework piece. Authored once in the data registry and
 * referenced by id everywhere else.
 */
export interface AwsService {
  id: AwsServiceId
  /** Human-facing name, e.g. "AgentCore Runtime" or "OpenSearch Serverless". */
  name: string
  category: AwsServiceCategory
  /** One-sentence description of what it is. */
  oneLiner: string
  /** One-sentence guidance on when to reach for it. */
  whenToUse: string
  /**
   * True when this service's APIs/CLI/SDK surface changes often — screens
   * should render a "verify against current AWS docs" callout beside it.
   */
  verifyAgainstDocs?: boolean
}

/* ----------------------------------------------------------------------------
 * 3. Diagram model
 * -------------------------------------------------------------------------- */

/**
 * The canonical layers of a RAG diagram, top-to-bottom-ish. Every
 * {@link DiagramComponent} belongs to exactly one layer; screens render
 * components grouped by layer.
 */
export type LayerId =
  | 'sources'
  | 'ingestion'
  | 'index'
  | 'retrieval'
  | 'augmentation'
  | 'generation'
  | 'guardrails'
  | 'memory'
  | 'orchestration'
  | 'observability'

/**
 * A single node in an architecture diagram. `id` is what
 * {@link WalkthroughStep.diagramComponentIds} references to light nodes up.
 */
export interface DiagramComponent {
  id: DiagramComponentId
  /** Short label rendered inside the node. */
  label: string
  /** Which diagram layer this node sits in. */
  layer: LayerId
  /** The functional role, e.g. "embedder", "retriever", "reranker", "policy". */
  role: string
  /** Optional link to the concrete AWS/framework service this node maps to. */
  awsServiceId?: AwsServiceId
  /** Optional short annotation shown on hover / beside the node. */
  note?: string
}

/* ----------------------------------------------------------------------------
 * 5. Code samples
 * -------------------------------------------------------------------------- */

/** Languages the app ships samples in (matches the CodeBlock component). */
export type CodeLanguage = 'python' | 'typescript' | 'bash' | 'json'

/**
 * A reference implementation snippet (Strands + AgentCore). Samples can be tied
 * to walkthrough steps via {@link CodeSample.highlightForStep} — the map's keys
 * are {@link StepId}s and the values are the line ranges to emphasize for that
 * step, powering the diagram <-> code sync from the code side.
 */
/**
 * A line-level annotation for the "explain this line" feature. `lineRange` is a
 * single 1-based line or an inclusive `[start, end]`. When `mapsToDiagramComponentId`
 * is set and a diagram is present, opening the annotation highlights that node.
 */
export interface CodeAnnotation {
  lineRange: LineRange
  whatItDoes: string
  technicalNote?: string
  mapsToDiagramComponentId?: DiagramComponentId
  docUrl?: string
  verifyAgainstDocs?: boolean
}

export interface CodeSample {
  id: CodeSampleId
  title: string
  language: CodeLanguage
  /** Optional filename shown in the CodeBlock tab bar. */
  filename?: string
  /** The source itself. Reference only — the app never executes it. */
  code: string
  /**
   * Per-step line emphasis: `{ [stepId]: LineRanges }`. Optional because not
   * every sample participates in a stepped walkthrough.
   */
  highlightForStep?: Record<StepId, LineRanges>
  /** Prose explaining what the sample demonstrates. */
  explanation: string
  /** Optional line-level annotations for the "explain this line" feature. */
  annotations?: CodeAnnotation[]
}

/* ----------------------------------------------------------------------------
 * 6. Walkthrough steps (the ordered "how it works" tour)
 * -------------------------------------------------------------------------- */

/**
 * One step of an architecture's guided tour. This is the heart of the
 * diagram <-> code sync: a step names the diagram nodes that light up
 * (`diagramComponentIds`) and, in the same breath, the code lines that
 * emphasize (`codeHighlightRange`) within `codeSampleId`.
 */
export interface WalkthroughStep {
  id: StepId
  /** 1-based position in the walkthrough. */
  order: number
  title: string
  /** Plain-language explanation for a non-specialist decision-maker. */
  plainExplanation: string
  /** The deeper, precise explanation for an architect. */
  technicalDetail: string
  /** Diagram nodes that should highlight while this step is active. */
  diagramComponentIds: DiagramComponentId[]
  /** The code sample this step refers to, if any. */
  codeSampleId?: CodeSampleId
  /** Code lines to emphasize within `codeSampleId` for this step. */
  codeHighlightRange?: LineRanges
  /** AWS/framework services exercised in this step. */
  awsServiceIds: AwsServiceId[]
  /** Optional enterprise tradeoffs surfaced at this step. */
  tradeoffs?: string[]
  /** Optional security considerations for this step. */
  securityNotes?: string[]
  /** Optional cost considerations for this step. */
  costNotes?: string[]
}

/* ----------------------------------------------------------------------------
 * 7. The core content object
 * -------------------------------------------------------------------------- */

/** How a pattern advances the shared Meridian scenario. */
export interface MeridianStageLink {
  /** The scenario stage this pattern corresponds to, e.g. "Ground answers". */
  stageTitle: string
  /** What adopting THIS pattern adds to the Meridian solution. */
  whatItAdds: string
  /** Optional longer narrative tying the pattern to Meridian's needs. */
  narrative?: string
}

/** Kind of external reference — used for iconography and grouping. */
export type ReferenceKind =
  | 'aws-docs'
  | 'api-reference'
  | 'aws-blog'
  | 'workshop'
  | 'github'
  | 'whitepaper'

/** A curated, real external reference. URLs must be genuine AWS/vendor docs. */
export interface Reference {
  label: string
  url: string
  kind: ReferenceKind
}

/**
 * A complete RAG architecture entry — the primary content object. One of these
 * fully describes a pattern: its story for a decision-maker, its detail for an
 * architect, its diagram, its guided walkthrough, its reference code, and how
 * it fits the Meridian scenario.
 */
export interface RagArchitecture {
  id: RagArchitectureId
  name: string
  /** One-line positioning statement. */
  tagline: string
  difficulty: DifficultyTier

  /** Plain summary aimed at a decision-maker. */
  summary: string
  /** Precise summary aimed at an architect. */
  technicalSummary: string

  /** When this pattern is the right call. */
  whenToUse: string[]
  /** When to avoid it. */
  whenNotToUse: string[]
  /** Enterprise notes across security, cost, and operations. */
  enterpriseConsiderations: string[]

  /**
   * All diagram nodes for this architecture. Each carries its own `layer`, so
   * screens render them grouped by {@link LayerId}.
   */
  layers: DiagramComponent[]

  /** The ordered "how it works" tour. */
  walkthrough: WalkthroughStep[]

  /** Strands + AgentCore reference implementations referenced by the steps. */
  codeSamples: CodeSample[]

  /** How this pattern solves a stage of the Meridian use case. */
  meridianStage: MeridianStageLink

  /** AWS/framework services this architecture uses. */
  awsServiceIds: AwsServiceId[]

  /** Curated, real references (AWS docs, blogs, workshops — no fabricated URLs). */
  references: Reference[]

  /** Accent color for this architecture (CSS color or token reference). */
  accentColor: string
}

/* ----------------------------------------------------------------------------
 * 8. The shared enterprise scenario
 * -------------------------------------------------------------------------- */

/**
 * One stage of the Meridian journey, mapped to the architecture that unlocks
 * it — so the use case reads as a progression across patterns.
 */
export interface MeridianStage {
  architectureId: RagArchitectureId
  /** What advancing to this pattern adds to Meridian's solution. */
  whatItAdds: string
}

/**
 * The shared enterprise scenario every architecture is measured against.
 * Reading the stages in order tells the story of maturing a RAG system.
 */
export interface MeridianScenario {
  /** Narrative overview of the Meridian company and its problem. */
  overview: string
  /** Functional/business requirements the solution must meet. */
  requirements: string[]
  /** Hard constraints (regulatory, data-residency, latency, budget). */
  constraints: string[]
  /** The progression of patterns that build up the full solution. */
  stages: MeridianStage[]
}

/* ----------------------------------------------------------------------------
 * Video library (Phase 25–27) — populated by scripts/fetch-videos.mjs from
 * YouTube RSS (discovery) + the YouTube Data API (enrichment, CI-only).
 * We store metadata only — never full descriptions or transcripts.
 * -------------------------------------------------------------------------- */

export type VideoTopic =
  | 'agentcore'
  | 'strands'
  | 'rag'
  | 'bedrock'
  | 'vector-search'
  | 'guardrails'
  | 'observability'
  | 'multi-agent'
  | 'well-architected'
  | 'genai-general'

export type VideoLevel = 'intro' | 'deep-dive' | 'demo' | 'talk'

export type TrustTier = 'official' | 'curated' | 'community'

export interface VideoEntry {
  /** YouTube video id. */
  id: string
  title: string
  channelId: string
  channelName: string
  /** ISO date. */
  publishedAt: string
  /** Canonical watch URL. */
  url: string
  /** Human duration (e.g. "12:34"); absent when only RSS data is available. */
  duration?: string
  /** Thumbnail URL (official ytimg). */
  thumbnail: string
  topics: VideoTopic[]
  level: VideoLevel
  trustTier: TrustTier
  relatedPatternIds?: RagArchitectureId[]
  relatedAtlasTopicIds?: string[]
  /** Our own short summary (curated, original words) — never a copied description. */
  summary?: string
}

export interface VideoData {
  /** ISO timestamp of the last refresh run. */
  generatedAt: string
  videos: VideoEntry[]
}

export type ChannelCategory =
  | 'aws_official'
  | 'aws_events'
  | 'community'
  | 'framework'
  | 'general_ai'

export interface ChannelEntry {
  /** YouTube channel id (UC...). Required — RSS needs the id, not the handle. */
  id: string
  name: string
  handle?: string
  category: ChannelCategory
  trustTier: TrustTier
  topics: string[]
  active: boolean
}

export interface VideoCollection {
  id: string
  title: string
  /** Manually-curated, ordered video ids. */
  videoIds: string[]
}

/** Industry sector for a real-world use case. */
export type Industry =
  | 'financial-services'
  | 'insurance'
  | 'healthcare'
  | 'life-sciences'
  | 'retail-ecommerce'
  | 'manufacturing'
  | 'telecom'
  | 'media-entertainment'
  | 'software-technology'
  | 'customer-service'
  | 'marketing-advertising'
  | 'professional-services'
  | 'public-sector'
  | 'energy-utilities'
  | 'travel-logistics'
  | 'cybersecurity'
  | 'cross-industry'

/**
 * A publicly-documented, real-world deployment of a GenAI agent / RAG system on
 * AWS. Curated by hand from public case studies — every entry carries a
 * verifiable sourceUrl. We store only our own short summary + facts, never
 * copied marketing copy.
 */
export interface UseCaseEntry {
  /** Stable slug. */
  id: string
  /** Organisation that deployed it. */
  company: string
  industry: Industry
  /** Short headline of what the agent does. */
  title: string
  /** Our own 1–2 sentence description (original words). */
  summary: string
  /** AWS services used (as named in the source). */
  services: string[]
  /** Short label for the agent shape, e.g. "Multi-agent", "RAG assistant". */
  agentPattern?: string
  relatedPatternIds?: RagArchitectureId[]
  relatedAtlasTopicIds?: string[]
  /** Quantified result, verbatim-safe short phrasing, e.g. "40% fewer escalations". */
  metric?: string
  region?: string
  /** e.g. "AWS case study", "AWS blog". */
  sourceName: string
  sourceUrl: string
  /** official = AWS-published; community = third-party write-up. */
  trustTier: 'official' | 'community'
  featured?: boolean
  /** Approximate year of the deployment/announcement. */
  year?: string
}

export interface UseCaseData {
  /** ISO timestamp this list was last curated. */
  generatedAt: string
  useCases: UseCaseEntry[]
}

export interface CurationData {
  collections: VideoCollection[]
  /** Overrides that always win over auto-classification, keyed by video id. */
  curatedOverrides: Record<string, Partial<VideoEntry>>
  /** Video ids to exclude from the library. */
  hidden: string[]
  /** Our own summaries, keyed by video id (original words only). */
  summaries: Record<string, string>
}

/* ----------------------------------------------------------------------------
 * Updates feed (Phase 28) — populated by scripts/fetch-updates.mjs from AWS's
 * public blog + What's New RSS feeds. Discovery only: we keep the headline, the
 * link, the date and a short syndicated excerpt, and always link back to AWS.
 * -------------------------------------------------------------------------- */

/** Broad shape of an update, used for filtering and for the card accent. */
export type UpdateKind = 'announcement' | 'blog'

/** Topic tags, deliberately a superset of VideoTopic so the two libraries agree. */
export type UpdateTopic = VideoTopic

export interface UpdateSource {
  /** Stable slug, e.g. "machine-learning". */
  id: string
  /** Display name, e.g. "AWS Machine Learning Blog". */
  name: string
  /** Public RSS URL. */
  feed: string
  kind: UpdateKind
  /**
   * When true, every item is kept. When false, an item must match the GenAI
   * keyword filter to survive. High-volume feeds should stay false.
   */
  keepAll: boolean
  active: boolean
  note?: string
}

export interface UpdateEntry {
  /** Stable slug derived from the canonical link. */
  id: string
  title: string
  /** Canonical URL on aws.amazon.com. */
  url: string
  /** ISO date. */
  publishedAt: string
  sourceId: string
  /** Display name of the originating feed. */
  sourceName: string
  kind: UpdateKind
  topics: UpdateTopic[]
  /** Short syndicated excerpt from the feed (trimmed). Attributed + linked. */
  excerpt?: string
  /** Author, when the feed provides one. */
  author?: string
  /** Our own note, from updates-curation.json. Original words only. */
  note?: string
  /** True when pinned by the curation layer. */
  pinned?: boolean
}

export interface UpdateData {
  /** ISO timestamp of the last refresh run. */
  generatedAt: string
  updates: UpdateEntry[]
}

export interface UpdateCuration {
  /** Ordered ids shown first, above the feed. */
  pinned: string[]
  /** Ids excluded entirely. */
  hidden: string[]
  /** id -> our own one-line take. */
  notes: Record<string, string>
}
