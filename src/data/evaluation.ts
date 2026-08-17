import type { CodeLanguage } from '../types'
import type { DiagramSource } from '../lib/layout'

/**
 * Content for the /evaluate primer — how enterprises know their RAG works.
 * Grounded in AgentCore Evaluations + Observability and CloudWatch. All example
 * traces and scorecards are clearly labeled SYNTHETIC, not real metrics.
 */

export interface RagMetric {
  id: string
  name: string
  plain: string
  technical: string
  badLooksLike: string
}

export const RAG_METRICS: RagMetric[] = [
  {
    id: 'retrieval_quality',
    name: 'Retrieval quality (precision/recall)',
    plain: 'Did we fetch the passages that actually contain the answer?',
    technical:
      'Precision = fraction of retrieved chunks that are relevant; recall = fraction of relevant chunks retrieved. Measured against a labeled set of query→relevant-passage pairs.',
    badLooksLike: 'The right document exists but never makes it into the context.',
  },
  {
    id: 'groundedness',
    name: 'Groundedness / faithfulness',
    plain: 'Is every claim in the answer supported by the retrieved context?',
    technical:
      'Score whether each statement is entailed by the provided passages (via NLI or an LLM judge). Low groundedness = hallucination.',
    badLooksLike: 'A confident answer that the sources don’t actually support.',
  },
  {
    id: 'citation_accuracy',
    name: 'Citation accuracy',
    plain: 'Do the citations point to passages that really support the claim?',
    technical:
      'Check that each cited source contains the supporting text; penalize fabricated or mismatched citations.',
    badLooksLike: 'Citations that look authoritative but point to the wrong passage.',
  },
  {
    id: 'answer_relevance',
    name: 'Answer relevance',
    plain: 'Does the answer actually address the question asked?',
    technical:
      'Judge whether the response resolves the user’s intent, independent of grounding — an answer can be grounded yet off-target.',
    badLooksLike: 'On-topic text that never answers the specific question.',
  },
  {
    id: 'latency',
    name: 'Latency',
    plain: 'How long does an answer take end to end?',
    technical:
      'Wall-clock time across retrieval, reranking, model calls, and tool hops. Agentic/multi-agent flows add hops.',
    badLooksLike: 'Unbounded agentic loops making p95 latency unpredictable.',
  },
  {
    id: 'cost_per_query',
    name: 'Cost per query',
    plain: 'What does one answer cost?',
    technical:
      'Sum of retrieval, reranking, model tokens, and tool invocations. Reranking large candidate sets and multi-hop retrieval dominate.',
    badLooksLike: 'Reranking every candidate at a high fetch count on every query.',
  },
  {
    id: 'safety_rate',
    name: 'Safety / guardrail hit rate',
    plain: 'How often do guardrails intervene — and is that right?',
    technical:
      'Rate of blocked/redacted inputs and outputs. Too high = over-blocking valid questions; leaks = filters too loose.',
    badLooksLike: 'Either valid questions blocked, or PII slipping through.',
  },
]

export interface TraceStep {
  label: string
  detail: string
  ms?: number
}

/** SYNTHETIC example trace of an agentic-retrieval answer. */
export const SAMPLE_TRACE: TraceStep[] = [
  { label: 'plan', detail: 'Decompose into 2 sub-questions', ms: 240 },
  { label: 'tool: retrieve', detail: '“EU contractor expense limit” → 5 passages', ms: 120 },
  { label: 'tool: retrieve', detail: '“2026 expense policy change” → 5 passages', ms: 110 },
  { label: 'rerank', detail: 'Keep top 3 of 10 candidates', ms: 90 },
  { label: 'generate', detail: 'Compose answer, cite 2 sources', ms: 910 },
  { label: 'guardrail', detail: 'Input/output check → passed', ms: 60 },
]

export interface Scorecard {
  label: string
  tone: 'good' | 'bad'
  scores: { metric: string; value: number }[]
  note: string
}

/** SYNTHETIC scorecards for a good vs a bad answer. */
export const SAMPLE_SCORECARDS: Scorecard[] = [
  {
    label: 'Good answer',
    tone: 'good',
    scores: [
      { metric: 'Groundedness', value: 0.95 },
      { metric: 'Relevance', value: 0.92 },
      { metric: 'Citation accuracy', value: 1.0 },
    ],
    note: 'Every claim supported and correctly cited — ship it.',
  },
  {
    label: 'Bad answer',
    tone: 'bad',
    scores: [
      { metric: 'Groundedness', value: 0.41 },
      { metric: 'Relevance', value: 0.7 },
      { metric: 'Citation accuracy', value: 0.33 },
    ],
    note: 'On-topic but ungrounded with mismatched citations — the trace shows a weak retrieval step to fix.',
  },
]

export interface EvalCodeFragment {
  language: CodeLanguage
  filename: string
  code: string
}

const BANNER = '# Reference implementation — verify exact syntax against current AWS docs.'

export const EVAL_ENABLEMENT: EvalCodeFragment[] = [
  {
    language: 'bash',
    filename: 'observability.sh',
    code: `${BANNER}
# AgentCore Observability emits OpenTelemetry traces + metrics to CloudWatch.
export AGENTCORE_OBSERVABILITY_ENABLED=true
`,
  },
  {
    language: 'bash',
    filename: 'evaluate.sh',
    code: `${BANNER}
# Score the agent against a labeled dataset (LLM-as-judge) before promoting.
aws bedrock-agentcore start-evaluation \\
  --agent-runtime-id "meridian-assistant" \\
  --dataset "s3://meridian-eval/policy-qa.jsonl"
`,
  },
]

/** The RAG evaluation loop as a diagram (reuses RagDiagram / the layout engine). */
export const EVAL_LOOP_DIAGRAM: DiagramSource = {
  name: 'RAG evaluation loop',
  accentColor: '#0EA5E9',
  layers: [
    { id: 'query', label: 'Query', layer: 'sources', role: 'input' },
    { id: 'retrieve', label: 'Retrieve', layer: 'retrieval', role: 'retriever', awsServiceId: 'bedrock_kb_managed' },
    { id: 'generate', label: 'Generate', layer: 'generation', role: 'generator', awsServiceId: 'bedrock_foundation_models' },
    { id: 'judge', label: 'Judge (LLM-as-judge)', layer: 'observability', role: 'evaluation', awsServiceId: 'agentcore_evaluations' },
    { id: 'trace', label: 'Trace', layer: 'observability', role: 'tracing', awsServiceId: 'agentcore_observability' },
    { id: 'metrics', label: 'Metrics', layer: 'observability', role: 'monitoring', awsServiceId: 'cloudwatch' },
    { id: 'improve', label: 'Improve', layer: 'orchestration', role: 'supervisor', note: 'iterate on the pattern' },
  ],
}
