import type {
  ArchitectureFamily,
  RagArchitecture,
  RagArchitectureId,
} from '../../types'
import { naiveRag } from './naive_rag'
import { managedKbRag } from './managed_kb_rag'
import { hybridRerankRag } from './hybrid_rerank_rag'
import { agenticRag } from './agentic_rag'
import { multiKbAgenticRag } from './multi_kb_agentic_rag'
import { graphRag } from './graph_rag'
import { memoryAugmentedRag } from './memory_augmented_rag'
import { multiAgentRag } from './multi_agent_rag'
import { guardrailedSecureRag } from './guardrailed_secure_rag'
import { agenticDataOps } from './agentic_data_ops'

/**
 * Every RAG architecture, keyed by id. This is the catalog the app renders.
 * The order below is the teaching progression (foundational → production) and
 * matches the Meridian scenario stages.
 */
export const ARCHITECTURES: Record<RagArchitectureId, RagArchitecture> = {
  naive_rag: naiveRag,
  managed_kb_rag: managedKbRag,
  hybrid_rerank_rag: hybridRerankRag,
  agentic_rag: agenticRag,
  multi_kb_agentic_rag: multiKbAgenticRag,
  graph_rag: graphRag,
  memory_augmented_rag: memoryAugmentedRag,
  multi_agent_rag: multiAgentRag,
  guardrailed_secure_rag: guardrailedSecureRag,
  agentic_data_ops: agenticDataOps,
}

/** The catalog in teaching order — convenient for lists and navigation. */
export const ARCHITECTURE_LIST: RagArchitecture[] = [
  naiveRag,
  managedKbRag,
  hybridRerankRag,
  agenticRag,
  multiKbAgenticRag,
  graphRag,
  memoryAugmentedRag,
  multiAgentRag,
  guardrailedSecureRag,
  agenticDataOps,
]

/** Ordered list of ids (teaching progression). */
export const ARCHITECTURE_ORDER: RagArchitectureId[] = ARCHITECTURE_LIST.map(
  (a) => a.id,
)

/** Architectures in one family, in teaching order. */
export function architecturesInFamily(family: ArchitectureFamily): RagArchitecture[] {
  return ARCHITECTURE_LIST.filter((a) => a.family === family)
}

/**
 * Catalog subsections, in display order. Titles and blurbs live here so the
 * catalog page stays presentational.
 */
export const ARCHITECTURE_FAMILIES: {
  id: ArchitectureFamily
  title: string
  blurb: string
}[] = [
  {
    id: 'rag',
    title: 'RAG architectures',
    blurb:
      'Nine retrieval patterns, foundational to production. Each one builds on the last, and together they are the progression the Meridian scenario walks through.',
  },
  {
    id: 'agentic-data-engineering',
    title: 'Agentic data engineering',
    blurb:
      'Agents that build the pipeline rather than answer from it — generating transformation code, quality gates and governance for a data lake, with a human approving the output.',
  },
]
