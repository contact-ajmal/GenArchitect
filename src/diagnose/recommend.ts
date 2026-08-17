import type { RagArchitectureId } from '../types'
import {
  DEFAULT_COMPOSITION,
  type RagComposition,
} from '../compose/composition'
import { normalizeComposition } from '../compose/rules'
import type { AnswerMap } from './flow'
import { REQUIRED_IDS } from './flow'

/**
 * Deterministic mapping engine. Scores the nine patterns against the answers
 * and returns a ranked, fully-traceable recommendation: the specific answers
 * that drove each pattern's score are recorded as `reasons`.
 */

export interface PatternScore {
  id: RagArchitectureId
  score: number
  reasons: string[]
}

export interface Recommendation {
  ranked: PatternScore[]
  recommended: PatternScore
  runnerUp?: PatternScore
  whatWouldChange: string
  composition: RagComposition
}

type Contribution = { id: RagArchitectureId; points: number; reason: string }

function contributions(a: AnswerMap): Contribution[] {
  const c: Contribution[] = []
  const add = (id: RagArchitectureId, points: number, reason: string) =>
    c.push({ id, points, reason })

  // Access control is a strong gate toward managed + secure.
  if (a.access === 'per_user') {
    add('guardrailed_secure_rag', 6, 'per-user document access needs retrieval-time ACLs, guardrails, and audit')
    add('managed_kb_rag', 3, 'document-level ACLs are enforced by a Managed Knowledge Base')
  } else {
    add('managed_kb_rag', 1, 'no per-user access simplifies the knowledge layer')
  }

  // Sources.
  if (a.sources === 'single') {
    add('managed_kb_rag', 1, 'a single source maps cleanly to one Managed KB')
    add('naive_rag', 1, 'a single small source can start as a hand-built pipeline')
  } else if (a.sources === 'multiple') {
    add('managed_kb_rag', 2, 'a few sources connect via native connectors')
    add('hybrid_rerank_rag', 1, 'more sources raise the value of precise retrieval')
  } else if (a.sources === 'many_diff_permissions') {
    add('multi_kb_agentic_rag', 5, 'many sources with different permissions call for separate KBs routed via Gateway')
    add('guardrailed_secure_rag', 2, 'differing permissions reinforce access control and audit')
  }

  // Query complexity.
  if (a.complexity === 'simple') {
    add('managed_kb_rag', 1, 'simple lookups need only single-shot retrieval')
  } else if (a.complexity === 'multi_hop') {
    add('agentic_rag', 5, 'multi-step questions need the agent to plan and retrieve repeatedly')
    if (a.sources === 'many_diff_permissions')
      add('multi_kb_agentic_rag', 2, 'multi-hop across many sources favors routed agentic retrieval')
  } else if (a.complexity === 'relationship') {
    if (a.graphConfirm !== 'semantic')
      add('graph_rag', 6, 'relationship/traversal questions need a knowledge graph')
    else add('agentic_rag', 2, 'relationship-ish but mostly semantic — agentic retrieval may suffice')
  }

  // Corpus scale → precision.
  if (a.corpusScale === 'large' || a.corpusScale === 'massive') {
    add('hybrid_rerank_rag', 3, 'a large corpus makes hybrid search + reranking important for precision')
  }

  // Memory.
  if (a.memory === 'user_memory') {
    add('memory_augmented_rag', 5, 'remembering the user across sessions is long-term memory alongside RAG')
  }

  // Actions + review.
  if (a.actions === 'take_actions') {
    add('multi_agent_rag', 4, 'taking actions benefits from specialist agents')
    if (a.review === 'review')
      add('multi_agent_rag', 3, 'a required review step is the core reason to go multi-agent')
  }

  // Priority.
  if (a.priority === 'speed_cost') {
    add('managed_kb_rag', 1, 'prioritizing speed & cost favors simpler single-shot retrieval')
    add('hybrid_rerank_rag', 1, 'reranking is a cheap precision win before adding agents')
  } else if (a.priority === 'capability') {
    add('agentic_rag', 2, 'prioritizing capability favors agentic retrieval')
    add('multi_agent_rag', 1, 'capability focus tolerates multi-agent complexity')
  }

  return c
}

export function recommend(a: AnswerMap): Recommendation | null {
  if (!REQUIRED_IDS.every((id) => a[id])) return null

  const byId = new Map<RagArchitectureId, PatternScore>()
  for (const { id, points, reason } of contributions(a)) {
    const cur = byId.get(id) ?? { id, score: 0, reasons: [] }
    cur.score += points
    cur.reasons.push(reason)
    byId.set(id, cur)
  }

  const ranked = [...byId.values()].sort((x, y) => y.score - x.score)
  const recommended = ranked[0]
  const runnerUp = ranked[1]

  const whatWouldChange = runnerUp
    ? `${patternName(runnerUp.id)} is the close runner-up — it would move ahead if, for example, ${flipHint(a)}.`
    : 'Answer a few more questions to sharpen the recommendation.'

  return {
    ranked,
    recommended,
    runnerUp,
    whatWouldChange,
    composition: deriveComposition(a),
  }
}

function patternName(id: RagArchitectureId): string {
  return id
    .replace(/_/g, ' ')
    .replace(/\brag\b/i, 'RAG')
    .replace(/\bkb\b/i, 'KB')
    .replace(/^\w/, (m) => m.toUpperCase())
}

function flipHint(a: AnswerMap): string {
  if (a.complexity === 'simple') return 'your questions were multi-step'
  if (a.access !== 'per_user') return 'you needed per-user access control'
  if (a.memory !== 'user_memory') return 'you needed cross-session memory'
  if (a.actions !== 'take_actions') return 'the assistant also had to take actions'
  return 'your priorities shifted from speed toward capability'
}

/** Seed a composition from the answers so "compose this" opens a live draft. */
export function deriveComposition(a: AnswerMap): RagComposition {
  const c: RagComposition = { ...DEFAULT_COMPOSITION, name: 'From diagnosis' }

  const relationship = a.complexity === 'relationship' && a.graphConfirm !== 'semantic'
  c.graphAugmented = relationship
  c.knowledgeBase = relationship ? 'customer_managed' : 'managed_kb'
  if (relationship) c.vectorStore = 'neptune'

  c.dataSources =
    a.sources === 'single' ? ['s3'] : ['s3', 'sharepoint', 'confluence']
  c.multiKb = a.sources === 'many_diff_permissions'

  c.retrievalMode =
    a.complexity === 'multi_hop' || a.sources === 'many_diff_permissions'
      ? 'agentic_retrieval'
      : 'retrieve_single'
  c.reranking = a.corpusScale === 'large' || a.corpusScale === 'massive'

  c.memory = a.memory === 'user_memory' ? 'long_term' : 'none'
  c.orchestration = a.actions === 'take_actions' ? 'multi_agent' : 'single_agent'

  c.accessControl = a.access === 'per_user' ? 'document_acls' : 'none'
  c.guardrails = a.access === 'per_user' || a.actions === 'take_actions'
  c.gateway = c.multiKb

  const productionish = a.access === 'per_user' || a.actions === 'take_actions'
  c.observability = productionish
  c.evaluations = productionish
  c.deployTarget = productionish ? 'agentcore_runtime' : 'local'

  return normalizeComposition(c)
}
