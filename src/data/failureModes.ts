import type { RagArchitectureId } from '../types'
import type { RagComposition } from '../compose/composition'

/**
 * The failure-mode lab — the real ways RAG breaks, each paired with a concrete
 * fix and a path to it (the pattern that solves it and a composer patch).
 * Teaching content; nothing here runs.
 */

export type Severity = 'medium' | 'high' | 'critical'

export interface FailureExample {
  query: string
  answer: string
}

export interface FailureMode {
  id: string
  title: string
  /** What the user sees. */
  symptom: string
  /** The architectural cause. */
  cause: string
  severity: Severity
  /** Patterns vulnerable to this failure. */
  affectedPatterns: RagArchitectureId[]
  /** The pattern whose diagram shows the fixing component. */
  fixArchitectureId: RagArchitectureId
  /** The component (in the fix architecture) that resolves it. */
  fixComponentId: string
  fix: string
  /** Seeds the composer with the corrected choice. */
  composePatch: Partial<RagComposition>
  before: FailureExample
  after: FailureExample
  /** How it manifests in the Meridian scenario. */
  meridian: string
}

export const FAILURE_MODES: FailureMode[] = [
  {
    id: 'no_reranking',
    title: 'No reranking → irrelevant chunks',
    symptom: 'Answers are vague or subtly wrong even though the right document exists.',
    cause:
      'Single-stage vector search returns near-miss passages; without a reranker, the model reasons over mediocre context.',
    severity: 'high',
    affectedPatterns: ['naive_rag', 'managed_kb_rag'],
    fixArchitectureId: 'hybrid_rerank_rag',
    fixComponentId: 'reranker',
    fix: 'Over-fetch candidates and add a reranker to keep only the most relevant passages.',
    composePatch: { reranking: true },
    before: {
      query: 'What’s the mileage reimbursement rate?',
      answer:
        'Reimbursement is provided for business travel per company policy. (Retrieved a generic travel page, not the rate table.)',
    },
    after: {
      query: 'What’s the mileage reimbursement rate?',
      answer:
        'The mileage reimbursement rate is $0.67/mile (Expense Policy §3.2). (Reranker surfaced the exact clause.)',
    },
    meridian:
      'A Meridian advisor gets a plausible but non-specific answer and has to dig manually — eroding trust in the assistant.',
  },
  {
    id: 'poor_chunking',
    title: 'Poor chunking → fragmented context',
    symptom: 'The assistant misses answers that are clearly in the documents.',
    cause:
      'Chunks split mid-section or mid-table, so the passage that answers the question is never retrievable as a unit.',
    severity: 'high',
    affectedPatterns: ['naive_rag', 'managed_kb_rag'],
    fixArchitectureId: 'hybrid_rerank_rag',
    fixComponentId: 'chunker',
    fix: 'Chunk along document structure (sections, tables) and re-sync on changes.',
    composePatch: { reranking: true },
    before: {
      query: 'How much notice is required to close an account?',
      answer:
        'I couldn’t find that in the documents. (The notice period was split across two chunks.)',
    },
    after: {
      query: 'How much notice is required to close an account?',
      answer: '30 days’ written notice is required (Account Terms §7).',
    },
    meridian:
      'Meridian’s policy PDFs are dense and tabular — naive fixed-size chunking silently drops the answers.',
  },
  {
    id: 'no_acls',
    title: 'No access control → data leakage',
    symptom: 'A user retrieves passages from documents they should never see.',
    cause:
      'Retrieval isn’t filtered by the user’s permissions, so any indexed content can surface to anyone.',
    severity: 'critical',
    affectedPatterns: ['naive_rag', 'managed_kb_rag', 'hybrid_rerank_rag', 'agentic_rag'],
    fixArchitectureId: 'guardrailed_secure_rag',
    fixComponentId: 'acl_filter',
    fix: 'Enforce per-user access at retrieval time with document-level ACLs (Managed KB metadata).',
    composePatch: { accessControl: 'document_acls', guardrails: true },
    before: {
      query: 'Summarize the pending litigation strategy.',
      answer:
        'The strategy is… (Retrieved restricted Legal documents for a user with no clearance.)',
    },
    after: {
      query: 'Summarize the pending litigation strategy.',
      answer:
        'You don’t have access to documents on this topic. (ACL filter excluded them at retrieval.)',
    },
    meridian:
      'The enterprise nightmare: a Meridian support agent retrieves restricted compliance or legal material — an audit and regulatory failure.',
  },
  {
    id: 'single_shot_multihop',
    title: 'Single-shot retrieval on multi-hop questions',
    symptom: 'Compound questions get half an answer.',
    cause:
      'One lookup can only address one facet; multi-part questions need several targeted retrievals.',
    severity: 'high',
    affectedPatterns: ['managed_kb_rag', 'hybrid_rerank_rag'],
    fixArchitectureId: 'agentic_rag',
    fixComponentId: 'retriever',
    fix: 'Switch to agentic retrieval so the agent decomposes and retrieves per sub-question.',
    composePatch: { retrievalMode: 'agentic_retrieval' },
    before: {
      query: 'Do EU contractors get the same limit as employees, and did it change in 2026?',
      answer:
        'The employee limit is €50/day. (Only answered the first half; never checked the 2026 change.)',
    },
    after: {
      query: 'Do EU contractors get the same limit as employees, and did it change in 2026?',
      answer:
        'Contractors share the €50/day limit (Policy §4), and it rose from €40 in the 2026 update (Changelog).',
    },
    meridian:
      'Meridian’s comparison questions across roles and policy versions need multi-hop retrieval to answer fully.',
  },
  {
    id: 'memory_as_rag',
    title: 'Memory used as RAG (or vice versa)',
    symptom: 'The assistant states stale “facts”, or forgets who the user is.',
    cause:
      'Confusing the two stores: treating memory as authoritative, or expecting retrieval to remember the user.',
    severity: 'high',
    affectedPatterns: ['memory_augmented_rag'],
    fixArchitectureId: 'memory_augmented_rag',
    fixComponentId: 'rag_retrieve',
    fix: 'Keep them separate: memory personalizes (role, history); retrieval grounds (current, cited facts).',
    composePatch: { memory: 'long_term' },
    before: {
      query: 'What’s my approval limit?',
      answer:
        'Your limit is €10,000. (Recited a value remembered from months ago — now outdated.)',
    },
    after: {
      query: 'What’s my approval limit?',
      answer:
        'As an EU-desk approver (from memory), your current limit is €15,000 (Policy §4, retrieved today).',
    },
    meridian:
      'Meridian must personalize by role while always grounding the number in current, cited policy — never in memory.',
  },
  {
    id: 'no_guardrails',
    title: 'No guardrails → unsafe output / PII leakage',
    symptom: 'The assistant emits sensitive data or answers out-of-scope requests.',
    cause: 'No input/output safety layer to redact PII or block disallowed topics.',
    severity: 'critical',
    affectedPatterns: ['naive_rag', 'managed_kb_rag', 'agentic_rag'],
    fixArchitectureId: 'guardrailed_secure_rag',
    fixComponentId: 'guardrails',
    fix: 'Add Bedrock Guardrails for PII redaction, denied topics, and grounding checks.',
    composePatch: { guardrails: true },
    before: {
      query: 'List customers with overdue balances and their SSNs.',
      answer: 'Here are the customers and SSNs: … (PII emitted verbatim.)',
    },
    after: {
      query: 'List customers with overdue balances and their SSNs.',
      answer:
        'I can share overdue balances, but personal identifiers are redacted per policy. (Guardrail blocked PII.)',
    },
    meridian:
      'In financial services, emitting PII or off-limits guidance is a compliance incident — guardrails are non-negotiable.',
  },
  {
    id: 'no_citations',
    title: 'No citations → unverifiable answers',
    symptom: 'Users can’t tell whether an answer is trustworthy.',
    cause: 'Retrieval returns text without source references, so nothing can be checked.',
    severity: 'medium',
    affectedPatterns: ['naive_rag'],
    fixArchitectureId: 'managed_kb_rag',
    fixComponentId: 'citations',
    fix: 'Use a Knowledge Base that returns passages with citations, and require the model to cite.',
    composePatch: { knowledgeBase: 'managed_kb' },
    before: {
      query: 'What’s the data-retention period?',
      answer: 'Seven years. (No source — is that current? from where?)',
    },
    after: {
      query: 'What’s the data-retention period?',
      answer: 'Seven years for EU client records (Data Retention Policy §2).',
    },
    meridian:
      'Meridian’s auditors require every answer to trace back to a specific source document.',
  },
  {
    id: 'stale_index',
    title: 'Stale index → outdated answers',
    symptom: 'Confidently wrong answers that cite an old version.',
    cause: 'No freshness strategy — the index isn’t re-synced when documents change.',
    severity: 'high',
    affectedPatterns: ['naive_rag', 'managed_kb_rag', 'hybrid_rerank_rag'],
    fixArchitectureId: 'hybrid_rerank_rag',
    fixComponentId: 'kb_index',
    fix: 'Define a re-sync cadence / incremental ingestion so the index reflects current documents.',
    composePatch: { reranking: true },
    before: {
      query: 'What’s the current travel meal cap?',
      answer: '$60/day (from a policy version superseded last quarter).',
    },
    after: {
      query: 'What’s the current travel meal cap?',
      answer: '$75/day (current Expense Policy §3.1, re-synced this week).',
    },
    meridian:
      'Meridian’s policies change on a schedule; a stale index makes the assistant authoritatively wrong.',
  },
  {
    id: 'no_observability',
    title: 'No observability/eval → you find out from users',
    symptom: 'Quality regressions ship silently; debugging a bad answer is guesswork.',
    cause: 'No tracing, metrics, or evaluations — you can’t see the agent’s steps or measure quality.',
    severity: 'high',
    affectedPatterns: ['naive_rag', 'managed_kb_rag', 'agentic_rag', 'multi_agent_rag'],
    fixArchitectureId: 'guardrailed_secure_rag',
    fixComponentId: 'observability',
    fix: 'Enable AgentCore Observability (traces to CloudWatch) and Evaluations to gate changes.',
    composePatch: { observability: true, evaluations: true, deployTarget: 'agentcore_runtime' },
    before: {
      query: '(a regression ships)',
      answer:
        'Answer quality drops after a prompt change — nobody notices until complaints arrive.',
    },
    after: {
      query: '(the same change)',
      answer:
        'The evaluation suite flags a groundedness drop before promotion, and a trace shows the failing retrieval step.',
    },
    meridian:
      'Meridian needs traces for audit and evaluations to prove quality before changes reach regulated users.',
  },
]

export function failureModesPreventedBy(id: RagArchitectureId): FailureMode[] {
  return FAILURE_MODES.filter((f) => f.fixArchitectureId === id)
}

export function failureModesAffecting(id: RagArchitectureId): FailureMode[] {
  return FAILURE_MODES.filter(
    (f) => f.affectedPatterns.includes(id) && f.fixArchitectureId !== id,
  )
}
