import type { AtlasSection, AtlasTopic } from '../../../atlas/types'

const S = 'multi-agent'
const DOCS = 'https://strandsagents.com/'

type T = Omit<AtlasTopic, 'atlasId' | 'sectionId'>
const t = (x: T): AtlasTopic => ({ ...x, atlasId: 'strands', sectionId: S })

export const multiAgent: AtlasSection = {
  id: S,
  atlasId: 'strands',
  title: 'Multi-agent',
  order: 6,
  blurb: 'Coordinating several agents — Agents-as-Tools, Graph, Swarm, Workflow — plus A2A and shared state.',
  topics: [
    t({
      id: 'agents-as-tools',
      title: 'Agents as tools',
      oneLiner: 'A supervisor delegates to specialist agents by calling them as tools.',
      whyItMatters:
        'It’s the simplest way to compose agents: each specialist stays narrow and testable, and the supervisor coordinates them with the same mechanism it uses for any tool.',
      explanation: {
        plain:
          'You wrap each specialist agent so a supervisor can call it like a tool. The supervisor decides which specialist to use and when, and combines their results.',
        technical:
          'Each specialist is a full agent; a thin @tool wraps its invocation and returns its result. The supervisor’s tool list is the set of specialists, so delegation reuses the ordinary tool-calling loop. Control is hierarchical and explicit — the supervisor owns the plan.',
      },
      visual: {
        kind: 'concept_diagram',
        height: 300,
        nodes: [
          { id: 'sup', label: 'Supervisor', detail: 'Plans the work and delegates.', x: 18, y: 50, accent: 'rgb(13 148 136)' },
          { id: 'ret', label: 'Retriever', sublabel: 'specialist', detail: 'Gathers cited passages.', x: 70, y: 20 },
          { id: 'syn', label: 'Synthesizer', sublabel: 'specialist', detail: 'Drafts the answer.', x: 70, y: 50 },
          { id: 'rev', label: 'Reviewer', sublabel: 'specialist', detail: 'Checks the draft.', x: 70, y: 80 },
        ],
        edges: [
          { from: 'sup', to: 'ret', label: 'delegate' },
          { from: 'sup', to: 'syn', label: 'delegate' },
          { from: 'sup', to: 'rev', label: 'delegate' },
        ],
      },
      docUrl: DOCS,
      verificationId: 'strands_sdk',
      coverageStatus: 'full',
      tags: ['multi-agent', 'hierarchical', 'delegation'],
      relatedTopicIds: ['choosing-pattern', 'pattern-comparison'],
      appliedIn: [{ label: 'Multi-agent RAG', to: '/architecture/multi_agent_rag' }],
    }),
    t({
      id: 'graph',
      title: 'Graph',
      oneLiner: 'A directed graph of agents/steps with deterministic edges.',
      whyItMatters:
        'When the flow is known in advance, a graph makes it explicit and repeatable — you control exactly who runs after whom.',
      explanation: {
        plain:
          'You lay out the agents as a graph: this one runs, then that one, with branches where needed. The path is defined by you, so the same input follows the same route.',
        technical:
          'A graph encodes nodes (agents or steps) and directed edges (control flow), optionally conditional. It’s deterministic coordination: good for pipelines and review gates where the sequence and branching are known and must be reproducible.',
      },
      visual: {
        kind: 'concept_diagram',
        height: 260,
        nodes: [
          { id: 'a', label: 'Intake', detail: 'Entry node.', x: 12, y: 50, accent: 'rgb(13 148 136)' },
          { id: 'b', label: 'Retrieve', detail: 'Gather evidence.', x: 40, y: 50 },
          { id: 'c', label: 'Draft', detail: 'Compose the answer.', x: 68, y: 26 },
          { id: 'd', label: 'Review', detail: 'Conditional review branch.', x: 68, y: 74 },
          { id: 'e', label: 'Respond', detail: 'Final node.', x: 92, y: 50 },
        ],
        edges: [
          { from: 'a', to: 'b' },
          { from: 'b', to: 'c' },
          { from: 'b', to: 'd', label: 'if risky' },
          { from: 'c', to: 'e' },
          { from: 'd', to: 'e' },
        ],
      },
      docUrl: DOCS,
      verificationId: 'strands_sdk',
      coverageStatus: 'full',
      tags: ['multi-agent', 'graph', 'deterministic'],
      relatedTopicIds: ['choosing-pattern', 'pattern-comparison'],
    }),
    t({
      id: 'swarm',
      title: 'Swarm',
      oneLiner: 'Agents self-organize around a shared context to solve open-ended tasks.',
      whyItMatters:
        'For problems where the right sequence isn’t known up front, letting agents coordinate emergently can outperform a fixed plan.',
      explanation: {
        plain:
          'A swarm is a set of agents that work together on a shared task, deciding among themselves who does what rather than following a fixed script.',
        technical:
          'Swarm coordination is emergent: agents share context and hand off work dynamically. It trades determinism for flexibility, which suits exploratory or decomposable problems — at the cost of being harder to predict and evaluate than a graph or workflow.',
      },
      visual: {
        kind: 'concept_diagram',
        height: 280,
        nodes: [
          { id: 's1', label: 'Agent', detail: 'Shares context, picks up work.', x: 30, y: 24 },
          { id: 's2', label: 'Agent', detail: 'Shares context, picks up work.', x: 70, y: 30 },
          { id: 's3', label: 'Agent', detail: 'Shares context, picks up work.', x: 26, y: 74 },
          { id: 's4', label: 'Agent', detail: 'Shares context, picks up work.', x: 68, y: 78 },
          { id: 'ctx', label: 'Shared context', detail: 'The common state agents coordinate through.', x: 50, y: 52, accent: 'rgb(13 148 136)' },
        ],
        edges: [
          { from: 's1', to: 'ctx' },
          { from: 's2', to: 'ctx' },
          { from: 's3', to: 'ctx' },
          { from: 's4', to: 'ctx' },
          { from: 's1', to: 's2', dashed: true },
          { from: 's3', to: 's4', dashed: true },
        ],
      },
      docUrl: DOCS,
      verificationId: 'strands_sdk',
      coverageStatus: 'full',
      tags: ['multi-agent', 'swarm', 'emergent'],
      relatedTopicIds: ['choosing-pattern', 'pattern-comparison'],
    }),
    t({
      id: 'workflow',
      title: 'Workflow',
      oneLiner: 'An explicit, ordered sequence of steps.',
      whyItMatters:
        'When the process is a straight line, a workflow is the clearest and most reliable option — nothing to reason about at runtime.',
      explanation: {
        plain:
          'A workflow runs steps in a defined order, passing results forward. It’s the most predictable pattern: step one, then two, then three.',
        technical:
          'Workflows express a fixed pipeline with explicit data flow between steps. Compared to a graph, it emphasizes linear ordering; compared to a swarm, it removes runtime coordination entirely. Best when the sequence is stable and auditability matters.',
      },
      visual: {
        kind: 'concept_diagram',
        height: 200,
        nodes: [
          { id: 'w1', label: 'Ingest', x: 12, y: 50, accent: 'rgb(13 148 136)' },
          { id: 'w2', label: 'Retrieve', x: 38, y: 50 },
          { id: 'w3', label: 'Synthesize', x: 64, y: 50 },
          { id: 'w4', label: 'Respond', x: 90, y: 50 },
        ],
        edges: [
          { from: 'w1', to: 'w2' },
          { from: 'w2', to: 'w3' },
          { from: 'w3', to: 'w4' },
        ],
      },
      docUrl: DOCS,
      verificationId: 'strands_sdk',
      coverageStatus: 'full',
      tags: ['multi-agent', 'workflow', 'pipeline'],
      relatedTopicIds: ['choosing-pattern', 'pattern-comparison'],
    }),
    t({
      id: 'a2a',
      title: 'Agent-to-Agent (A2A) protocol',
      oneLiner: 'A standard way for agents to talk to each other — even across systems.',
      whyItMatters:
        'A2A lets agents built by different teams or on different stacks interoperate, instead of being locked into one process.',
      explanation: {
        plain:
          'A2A is a protocol for agents to communicate with one another. It means an agent can call on another agent that lives in a separate service or was built with different tools.',
        technical:
          'Strands supports the Agent-to-Agent protocol for interoperable, cross-system agent communication. It complements the in-process patterns (Agents-as-Tools, Graph, Swarm, Workflow) by standardizing how independently-deployed agents exchange work — useful when agents span teams, runtimes, or organizations.',
      },
      visual: {
        kind: 'concept_diagram',
        height: 220,
        nodes: [
          { id: 'a', label: 'Agent A', sublabel: 'system 1', detail: 'Requests work from another agent.', x: 20, y: 50, accent: 'rgb(13 148 136)' },
          { id: 'proto', label: 'A2A protocol', detail: 'Standard message exchange between agents.', x: 50, y: 50 },
          { id: 'b', label: 'Agent B', sublabel: 'system 2', detail: 'A separately-deployed agent.', x: 80, y: 50 },
        ],
        edges: [
          { from: 'a', to: 'proto' },
          { from: 'proto', to: 'b' },
        ],
      },
      docUrl: DOCS,
      verificationId: 'strands_sdk',
      coverageStatus: 'full',
      tags: ['multi-agent', 'a2a', 'interoperability'],
      relatedTopicIds: ['agents-as-tools'],
    }),
    t({
      id: 'shared-state',
      title: 'Shared state (invocation_state)',
      oneLiner: 'Data that travels with a run so coordinating agents can read and write it.',
      whyItMatters:
        'Knowing when to use shared state vs. explicit hand-offs keeps multi-agent systems debuggable rather than tangled.',
      explanation: {
        plain:
          'Sometimes agents need to see the same information as they collaborate. Shared state is a common bag of data carried through the invocation that any participating agent can use.',
        technical:
          'An `invocation_state` (or equivalent) carries key–value data across a multi-agent run, distinct from each agent’s conversation history. Prefer explicit data flow (a graph edge, a tool result) when the dependency is known; reach for shared state when several agents genuinely need the same evolving context. Overusing it makes behavior harder to trace.',
      },
      visual: { kind: 'none', reason: 'A data-flow concept; best understood alongside the coordination patterns above.' },
      docUrl: DOCS,
      verificationId: 'strands_sdk',
      coverageStatus: 'full',
      tags: ['shared state', 'invocation_state'],
      relatedTopicIds: ['graph', 'swarm'],
    }),
    t({
      id: 'choosing-pattern',
      title: 'Which pattern should I use?',
      oneLiner: 'A short decision path from your control needs to a coordination pattern.',
      whyItMatters:
        'Choosing the wrong coordination style is a common source of over-complex agents; the answer usually follows from how much determinism you need.',
      explanation: {
        plain:
          'Pick based on how much you need to control the flow. A fixed order → workflow. A known graph with branches → graph. Delegation to specialists → agents-as-tools. Open-ended, self-organizing → swarm.',
        technical:
          'The axis is deterministic vs. emergent control. Workflow and Graph are deterministic (you define the flow); Agents-as-Tools centralizes control in a supervisor; Swarm is emergent. Weigh isolation, evaluability, and complexity — start with the least powerful pattern that fits.',
      },
      visual: {
        kind: 'decision_tree',
        root: {
          id: 'root',
          question: 'Is the flow known in advance?',
          options: [
            {
              label: 'Yes — a fixed sequence',
              next: { id: 'wf', recommendation: 'Workflow', reasoning: 'A straight-line pipeline is clearest and most auditable when the order never changes.' },
            },
            {
              label: 'Yes — but with branches',
              next: { id: 'g', recommendation: 'Graph', reasoning: 'A directed graph makes conditional, repeatable flow explicit.' },
            },
            {
              label: 'No — one coordinator should delegate',
              next: { id: 'aat', recommendation: 'Agents as tools', reasoning: 'A supervisor calling specialists keeps control central and each agent narrow.' },
            },
            {
              label: 'No — let agents self-organize',
              next: { id: 'sw', recommendation: 'Swarm', reasoning: 'Emergent coordination fits open-ended tasks, at the cost of predictability.' },
            },
          ],
        },
      },
      docUrl: DOCS,
      verificationId: 'strands_sdk',
      coverageStatus: 'full',
      tags: ['multi-agent', 'decision', 'pattern selection'],
      relatedTopicIds: ['pattern-comparison'],
    }),
    t({
      id: 'pattern-comparison',
      title: 'Comparing the four patterns',
      oneLiner: 'Control, isolation, and complexity across Agents-as-Tools, Graph, Swarm, and Workflow.',
      whyItMatters:
        'Seeing the tradeoffs side by side makes the choice defensible in a design review.',
      explanation: {
        plain:
          'Each pattern trades control for flexibility differently. This table lines them up so you can match one to your workload.',
        technical:
          'Deterministic patterns (Workflow, Graph) are easier to test and audit; Agents-as-Tools centralizes reasoning; Swarm maximizes flexibility but is hardest to evaluate. Complexity and isolation move roughly with how much runtime coordination you allow.',
      },
      visual: {
        kind: 'comparison_matrix',
        columns: ['Agents-as-Tools', 'Graph', 'Swarm', 'Workflow'],
        rows: [
          { label: 'Control', cells: [{ text: 'Central (supervisor)', tone: 'neutral' }, { text: 'Deterministic', tone: 'good' }, { text: 'Emergent', tone: 'bad' }, { text: 'Deterministic', tone: 'good' }] },
          { label: 'Isolation', cells: [{ text: 'High per specialist', tone: 'good' }, 'Per node', 'Shared context', 'Per step'] },
          { label: 'Complexity', cells: ['Low–medium', 'Medium', 'High', 'Low'] },
          { label: 'Best for', cells: ['Delegation + review', 'Known branching flows', 'Open-ended tasks', 'Fixed pipelines'], note: 'Start with the simplest that fits.' },
        ],
      },
      docUrl: DOCS,
      verificationId: 'strands_sdk',
      coverageStatus: 'full',
      tags: ['multi-agent', 'comparison'],
      relatedTopicIds: ['choosing-pattern'],
    }),
  ],
}
