import type { RagArchitecture, RagArchitectureId } from '../types'
import { ARCHITECTURES } from '../data/architectures'

/**
 * The composition model — a typed snapshot of a user's choices across the RAG
 * decision space. This is the single source of truth the /compose studio, the
 * diagram derivation, and the code generator all read from. It never executes
 * anything; it only describes an architecture.
 */

export type KnowledgeBaseKind = 'managed_kb' | 'customer_managed'
export type VectorStore =
  | 'opensearch_serverless'
  | 'aurora_pgvector'
  | 'neptune'
export type DataSource =
  | 's3'
  | 'sharepoint'
  | 'confluence'
  | 'google_drive'
  | 'onedrive'
  | 'web_crawler'
export type RetrievalMode = 'retrieve_single' | 'agentic_retrieval'
export type MemoryMode = 'none' | 'session' | 'long_term'
export type Orchestration = 'single_agent' | 'multi_agent'
export type AccessControl = 'none' | 'document_acls'
export type DeployTarget = 'local' | 'agentcore_runtime'
export type ModelProviderKind = 'bedrock_claude'

export interface RagComposition {
  name: string
  knowledgeBase: KnowledgeBaseKind
  /** Relevant when knowledgeBase === 'customer_managed'. */
  vectorStore: VectorStore
  dataSources: DataSource[]
  retrievalMode: RetrievalMode
  reranking: boolean
  multiKb: boolean
  graphAugmented: boolean
  memory: MemoryMode
  orchestration: Orchestration
  guardrails: boolean
  accessControl: AccessControl
  gateway: boolean
  observability: boolean
  evaluations: boolean
  deployTarget: DeployTarget
  modelProvider: ModelProviderKind
}

/** Native connectors that are a Managed Knowledge Base feature (not S3). */
export const MANAGED_ONLY_SOURCES: DataSource[] = [
  'sharepoint',
  'confluence',
  'google_drive',
  'onedrive',
  'web_crawler',
]

export const DATA_SOURCE_LABELS: Record<DataSource, string> = {
  s3: 'Amazon S3',
  sharepoint: 'SharePoint',
  confluence: 'Confluence',
  google_drive: 'Google Drive',
  onedrive: 'OneDrive',
  web_crawler: 'Web crawler',
}

export const VECTOR_STORE_LABELS: Record<VectorStore, string> = {
  opensearch_serverless: 'OpenSearch Serverless',
  aurora_pgvector: 'Aurora PostgreSQL (pgvector)',
  neptune: 'Neptune Analytics',
}

export const DEFAULT_COMPOSITION: RagComposition = {
  name: 'My RAG architecture',
  knowledgeBase: 'managed_kb',
  vectorStore: 'opensearch_serverless',
  dataSources: ['s3'],
  retrievalMode: 'retrieve_single',
  reranking: false,
  multiKb: false,
  graphAugmented: false,
  memory: 'none',
  orchestration: 'single_agent',
  guardrails: false,
  accessControl: 'none',
  gateway: false,
  observability: false,
  evaluations: false,
  deployTarget: 'local',
  modelProvider: 'bedrock_claude',
}

/**
 * Seed a composition from one of the nine catalog patterns, so users can tweak
 * a known-good starting point instead of building from blank. Derived from the
 * pattern's actual awsServiceIds and id — deterministic, no guessing.
 */
export function compositionFromPattern(
  id: RagArchitectureId,
): RagComposition {
  const arch: RagArchitecture = ARCHITECTURES[id]
  const has = (s: string) => arch.awsServiceIds.includes(s as never)
  const base: RagComposition = { ...DEFAULT_COMPOSITION, name: arch.name }

  base.knowledgeBase = has('bedrock_kb_customer_managed')
    ? 'customer_managed'
    : 'managed_kb'
  if (has('neptune')) base.vectorStore = 'neptune'
  else if (has('aurora_pgvector')) base.vectorStore = 'aurora_pgvector'

  // Per-pattern shaping (the id is the ground truth for intent).
  switch (id) {
    case 'naive_rag':
      base.knowledgeBase = 'customer_managed'
      base.dataSources = ['s3']
      break
    case 'managed_kb_rag':
      base.dataSources = ['s3', 'sharepoint', 'confluence']
      break
    case 'hybrid_rerank_rag':
      base.dataSources = ['s3', 'sharepoint', 'confluence']
      base.reranking = true
      break
    case 'agentic_rag':
      base.retrievalMode = 'agentic_retrieval'
      break
    case 'multi_kb_agentic_rag':
      base.retrievalMode = 'agentic_retrieval'
      base.multiKb = true
      base.gateway = true
      base.dataSources = ['s3', 'sharepoint', 'confluence']
      break
    case 'graph_rag':
      base.knowledgeBase = 'customer_managed'
      base.vectorStore = 'neptune'
      base.graphAugmented = true
      break
    case 'memory_augmented_rag':
      base.memory = 'long_term'
      break
    case 'multi_agent_rag':
      base.orchestration = 'multi_agent'
      base.gateway = true
      base.deployTarget = 'agentcore_runtime'
      break
    case 'guardrailed_secure_rag':
      base.retrievalMode = 'agentic_retrieval'
      base.guardrails = true
      base.accessControl = 'document_acls'
      base.gateway = true
      base.observability = true
      base.evaluations = true
      base.deployTarget = 'agentcore_runtime'
      base.dataSources = ['s3', 'sharepoint', 'confluence']
      break
  }
  return base
}
