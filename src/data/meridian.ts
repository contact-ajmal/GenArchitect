import type { MeridianScenario } from '../types'

/**
 * The shared enterprise scenario. Every architecture in the catalog is measured
 * against Meridian, and the `stages` array reads as a progression: each pattern
 * adds one capability on the road from a naive prototype to a secure, auditable,
 * observable agentic RAG assistant.
 */
export const MERIDIAN: MeridianScenario = {
  overview:
    'Meridian Financial Services runs an internal knowledge assistant for its advisors, client-support staff, and compliance officers. Answers must come from Meridian’s own documents — HR and expense policies, product and pricing sheets, and compliance/regulatory guidance — which live scattered across Amazon S3, SharePoint, and Confluence. The assistant has to be trustworthy (grounded, cited), respect who is allowed to see what, keep an audit trail, remember an employee’s role and prior questions, and gradually grow from answering questions to multi-step reasoning and a few safe actions.',

  requirements: [
    'Grounded answers with citations back to the exact source document and passage — no unsupported claims.',
    'Per-user access control: an employee only ever retrieves from documents they are authorized to see, enforced at retrieval time (document-level ACLs).',
    'Coverage across S3, SharePoint, and Confluence without building a bespoke connector for each.',
    'Full auditability: every answer traceable to its sources, tools, and the user who asked.',
    'Memory of an employee’s role, desk, and prior questions to personalize and shorten follow-ups — without treating memory as a source of truth.',
    'Route questions to the right corpus (policies vs. product vs. compliance) as the knowledge grows.',
    'Room to grow into multi-step reasoning and limited actions (e.g. draft a compliance summary, open a ticket) under review.',
  ],

  constraints: [
    'Data residency: all data and inference stay within Meridian’s AWS environment; no corpus or prompts sent to third-party model providers.',
    'Regulatory & audit: retain logs and traces sufficient to reconstruct any answer for compliance review.',
    'Cost control: retrieval, reranking, and multi-agent orchestration spend must be predictable and bounded.',
    'Safety: block unsafe or out-of-scope requests and redact sensitive information (PII) in inputs and outputs.',
  ],

  stages: [
    {
      architectureId: 'naive_rag',
      whatItAdds:
        'Establishes the baseline — embed a slice of policy docs and answer questions — so the team sees RAG working and, just as importantly, sees its gaps: no access control, weak retrieval, and hallucination risk.',
    },
    {
      architectureId: 'managed_kb_rag',
      whatItAdds:
        'Replaces the brittle hand-built pipeline with a Bedrock Managed Knowledge Base: native connectors to S3, SharePoint, and Confluence, managed parsing/embedding/indexing, and built-in citations.',
    },
    {
      architectureId: 'hybrid_rerank_rag',
      whatItAdds:
        'Sharpens retrieval precision with hybrid keyword+semantic search and reranking, plus a chunking and freshness strategy, so answers cite the right, current passages instead of near-misses.',
    },
    {
      architectureId: 'agentic_rag',
      whatItAdds:
        'Lets the assistant decide when and what to retrieve — multi-hop, intent-aware retrieval for complex questions — instead of always doing a single lookup.',
    },
    {
      architectureId: 'multi_kb_agentic_rag',
      whatItAdds:
        'Routes across separate Policies, Product, and Compliance knowledge bases via AgentCore Gateway, sending each sub-question to the right authoritative source.',
    },
    {
      architectureId: 'graph_rag',
      whatItAdds:
        'Adds relationship-aware retrieval for questions that need traversal — e.g. which products a policy governs, or how a regulation maps to Meridian’s internal controls.',
    },
    {
      architectureId: 'memory_augmented_rag',
      whatItAdds:
        'Gives the assistant durable memory of who the employee is (role, desk) and their prior questions, while still grounding every answer in current authoritative documents.',
    },
    {
      architectureId: 'multi_agent_rag',
      whatItAdds:
        'Coordinates specialist agents — retriever, synthesizer, and compliance-checker — on AgentCore Runtime for reliable, reviewable answers to high-stakes questions.',
    },
    {
      architectureId: 'guardrailed_secure_rag',
      whatItAdds:
        'The Meridian end-state: Bedrock Guardrails, document-level ACLs and IAM via Gateway, and AgentCore Observability + Evaluations for a secure, auditable, monitored assistant.',
    },
  ],
}
