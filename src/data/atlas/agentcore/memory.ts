import type { AtlasSection, AtlasTopic } from '../../../atlas/types'

const S = 'memory'
const DOCS =
  'https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html'

type T = Omit<AtlasTopic, 'atlasId' | 'sectionId'>
const t = (x: T): AtlasTopic => ({ ...x, atlasId: 'agentcore', sectionId: S })

export const memory: AtlasSection = {
  id: S,
  atlasId: 'agentcore',
  title: 'Memory',
  order: 3,
  blurb: 'Short- and long-term memory, extraction strategies, and the crucial Memory ≠ RAG distinction.',
  topics: [
    t({
      id: 'memory-short-long',
      title: 'Short-term & long-term memory',
      oneLiner:
        'Working memory within a session, plus durable memory that spans sessions — scoped per user, with TTL.',
      whyItMatters:
        'Continuity is what makes an assistant feel like it knows you; getting the scoping and lifetime right is what keeps that from becoming a privacy or staleness problem.',
      explanation: {
        plain:
          'Short-term memory is what the agent holds during one session. Long-term memory carries facts about a user across sessions — their role, preferences, past questions. Memories are scoped to a user and can expire after a time-to-live.',
        technical:
          'AgentCore Memory separates short-term (session) working memory from long-term, cross-session memory. Long-term memories are namespaced per user (scoping), and support a TTL so stale or sensitive data doesn’t linger. You choose what gets promoted to long-term memory rather than persisting everything.',
      },
      visual: {
        kind: 'concept_diagram',
        height: 280,
        nodes: [
          { id: 'session', label: 'Session', sublabel: 'short-term', detail: 'Working memory for the current conversation.', x: 18, y: 30 },
          { id: 'user', label: 'User scope', detail: 'Long-term memory is namespaced per user.', x: 18, y: 74 },
          { id: 'ltm', label: 'Long-term memory', sublabel: 'cross-session', detail: 'Durable facts: role, preferences, prior questions. TTL applies.', x: 55, y: 52, accent: 'rgb(13 148 136)' },
          { id: 'agent', label: 'Agent', detail: 'Reads both to personalize the next turn.', x: 86, y: 52 },
        ],
        edges: [
          { from: 'session', to: 'agent' },
          { from: 'user', to: 'ltm' },
          { from: 'ltm', to: 'agent' },
        ],
      },
      docUrl: DOCS,
      verificationId: 'agentcore_memory',
      coverageStatus: 'full',
      tags: ['memory', 'short-term', 'long-term', 'ttl', 'user scoping'],
      relatedTopicIds: ['memory-strategies', 'memory-vs-rag'],
    }),
    t({
      id: 'memory-strategies',
      title: 'Extraction & consolidation strategies',
      oneLiner:
        'How raw conversation becomes durable memory — including a self-managed strategy you control fully.',
      whyItMatters:
        'What the agent remembers is only as good as how memories are extracted and merged; the self-managed strategy is the escape hatch when defaults don’t fit your domain.',
      explanation: {
        plain:
          'Memory isn’t just a transcript — the platform extracts what’s worth keeping and consolidates it over time. You can use built-in strategies, or a self-managed strategy where you own the whole pipeline.',
        technical:
          'Extraction turns conversation into candidate memories; consolidation merges, updates, and deduplicates them so the store stays coherent. Built-in strategies handle common cases; the self-managed strategy gives you full control of extraction and consolidation for domain-specific rules. Tracing can be enabled at memory creation to observe how memories form.',
      },
      visual: {
        kind: 'lifecycle_timeline',
        stages: [
          { id: 'capture', label: 'Capture', plain: 'The conversation happens.', technical: 'Turns and events are captured within a session.' },
          { id: 'extract', label: 'Extract', plain: 'Worth-keeping facts are pulled out.', technical: 'Extraction identifies candidate long-term memories from the session.' },
          { id: 'consolidate', label: 'Consolidate', plain: 'New facts are merged with what’s already stored.', technical: 'Consolidation updates/dedupes memories so the store stays coherent over time.' },
          { id: 'recall', label: 'Recall', plain: 'Relevant memories are retrieved on later turns.', technical: 'The agent queries memory (per user namespace) to personalize responses.' },
        ],
      },
      docUrl: DOCS,
      verificationId: 'agentcore_memory',
      coverageStatus: 'full',
      tags: ['memory', 'extraction', 'consolidation', 'self-managed'],
      relatedTopicIds: ['memory-short-long', 'memory-vs-rag'],
    }),
    t({
      id: 'memory-vs-rag',
      title: 'Memory ≠ RAG',
      oneLiner:
        'Memory stores who the user is and what happened before; RAG retrieves current authoritative facts. Never confuse them.',
      whyItMatters:
        'This is the single most consequential distinction in agentic RAG. Treating memory as a source of truth produces confidently stale answers; expecting retrieval to remember the user produces a forgetful assistant.',
      explanation: {
        plain:
          'Memory and retrieval do different jobs. Memory personalizes — it remembers the user and the conversation. Retrieval grounds — it fetches the current, authoritative facts and cites them. Use memory to shape tone and relevance, and always base factual claims on retrieval.',
        technical:
          'Memory is mutable, per-user, and NOT authoritative; it holds preferences, history, and summaries. RAG returns current, cited passages from documents — the source of truth. The failure modes are symmetric: store a policy value in memory and it goes stale while the document changes; rely on retrieval for identity and the agent forgets the user. Keep them as separate tools with separate contracts, and instruct the model that memory personalizes while retrieval grounds.',
      },
      visual: {
        kind: 'comparison_matrix',
        columns: ['AgentCore Memory', 'RAG (retrieval)'],
        rows: [
          { label: 'Stores', cells: ['Who the user is; what happened before', 'Current authoritative documents'] },
          { label: 'Authoritative?', cells: [{ text: 'No — context only', tone: 'bad' }, { text: 'Yes — the source of truth', tone: 'good' }] },
          { label: 'Mutability', cells: ['Mutable, per-user, TTL', 'Reflects the live corpus'] },
          { label: 'Job', cells: [{ text: 'Personalize', tone: 'neutral' }, { text: 'Ground + cite', tone: 'good' }] },
          { label: 'Failure if misused', cells: [{ text: 'Stale “facts” from memory', tone: 'bad' }, { text: 'Forgets the user', tone: 'bad' }], note: 'Keep them separate.' },
        ],
      },
      docUrl: DOCS,
      verificationId: 'agentcore_memory',
      coverageStatus: 'full',
      tags: ['memory', 'rag', 'distinction', 'grounding'],
      relatedTopicIds: ['memory-short-long'],
      appliedIn: [
        { label: 'Memory-augmented RAG pattern', to: '/architecture/memory_augmented_rag' },
        { label: 'The "memory used as RAG" failure mode', to: '/failure-modes' },
      ],
    }),
  ],
}
