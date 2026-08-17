/**
 * The diagnose interview — a short, adaptive, deterministic questionnaire.
 * Dual-register: `question` is the plain ask; `help` teaches a non-expert why
 * it matters. Conditional questions (via `showIf`) make it branch.
 */

export type AnswerMap = Record<string, string>

export interface Choice {
  value: string
  label: string
}

export interface Question {
  id: string
  question: string
  help: string
  choices: Choice[]
  /** When present, the question only shows if this returns true. */
  showIf?: (a: AnswerMap) => boolean
}

export const QUESTIONS: Question[] = [
  {
    id: 'corpusScale',
    question: 'How large is your document corpus?',
    help: 'Bigger corpora make retrieval precision — hybrid search and reranking — matter more, because there are more near-miss passages to reject.',
    choices: [
      { value: 'small', label: 'Small (a few thousand docs)' },
      { value: 'large', label: 'Large (tens of thousands+)' },
      { value: 'massive', label: 'Massive (millions)' },
    ],
  },
  {
    id: 'sources',
    question: 'Where does the content live?',
    help: 'One source is simplest. Several sources with different owners and permissions push you toward multiple knowledge bases and routing.',
    choices: [
      { value: 'single', label: 'One place (e.g. S3)' },
      { value: 'multiple', label: 'A few sources' },
      { value: 'many_diff_permissions', label: 'Many, with different permissions' },
    ],
  },
  {
    id: 'access',
    question: 'Do different users need different access?',
    help: 'Per-user access must be enforced at retrieval time (document-level ACLs), not by filtering the answer afterwards. Managed KBs can enforce this from connector metadata.',
    choices: [
      { value: 'none', label: 'Everyone sees everything' },
      { value: 'per_user', label: 'Per-user document access' },
    ],
  },
  {
    id: 'complexity',
    question: 'What do the questions look like?',
    help: 'Simple lookups need one retrieval. Multi-part questions need the agent to plan and retrieve several times. Relationship questions need graph traversal.',
    choices: [
      { value: 'simple', label: 'Simple lookups' },
      { value: 'multi_hop', label: 'Multi-step / compound' },
      { value: 'relationship', label: 'How things relate (traversal)' },
    ],
  },
  {
    id: 'graphConfirm',
    question: 'Are answers mostly about connections between entities?',
    help: 'GraphRAG pays off when the answer depends on paths between entities (A governs B, B requires C), not just passages that look similar.',
    showIf: (a) => a.complexity === 'relationship',
    choices: [
      { value: 'traversal', label: 'Yes — traversal is central' },
      { value: 'semantic', label: 'Not really — mostly similarity' },
    ],
  },
  {
    id: 'memory',
    question: 'Should it remember users across sessions?',
    help: 'Memory ≠ RAG. Memory stores who the user is and what they asked before (to personalize) — never authoritative facts, which always come from retrieval.',
    choices: [
      { value: 'stateless', label: 'No — stateless Q&A' },
      { value: 'user_memory', label: 'Yes — remember role & history' },
    ],
  },
  {
    id: 'actions',
    question: 'Answer questions only, or also take actions?',
    help: 'Taking actions (drafting, opening tickets) raises the stakes and usually needs a review/approval step — which points toward multi-agent orchestration.',
    choices: [
      { value: 'answer_only', label: 'Answer only' },
      { value: 'take_actions', label: 'Also take limited actions' },
    ],
  },
  {
    id: 'review',
    question: 'Do those actions need a review or approval step?',
    help: 'A dedicated reviewer (e.g. a compliance-checker agent) gating answers is the core reason to adopt multi-agent orchestration.',
    showIf: (a) => a.actions === 'take_actions',
    choices: [
      { value: 'review', label: 'Yes — review before responding' },
      { value: 'no_review', label: 'No — direct answers are fine' },
    ],
  },
  {
    id: 'priority',
    question: 'What matters more right now?',
    help: 'Optimizing for speed and cost favors simpler, single-shot patterns. Optimizing for capability favors agentic, multi-hop, multi-agent designs that cost more.',
    choices: [
      { value: 'speed_cost', label: 'Speed & cost' },
      { value: 'capability', label: 'Capability & correctness' },
    ],
  },
]

/** Question ids that must be answered before a recommendation is produced. */
export const REQUIRED_IDS = [
  'corpusScale',
  'sources',
  'access',
  'complexity',
  'memory',
  'actions',
  'priority',
]

/** The questions to show given current answers (adaptive branching). */
export function visibleQuestions(answers: AnswerMap): Question[] {
  return QUESTIONS.filter((q) => !q.showIf || q.showIf(answers))
}
