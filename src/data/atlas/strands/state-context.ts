import type { AtlasSection, AtlasTopic } from '../../../atlas/types'

const S = 'state-context'
const DOCS = 'https://strandsagents.com/'

type T = Omit<AtlasTopic, 'atlasId' | 'sectionId'>
const t = (x: T): AtlasTopic => ({ ...x, atlasId: 'strands', sectionId: S })

export const stateContext: AtlasSection = {
  id: S,
  atlasId: 'strands',
  title: 'State & context',
  order: 3,
  blurb: 'How an agent remembers a conversation, persists across restarts, and manages a growing context.',
  topics: [
    t({
      id: 'agent-state',
      title: 'Agent state & conversation history',
      oneLiner:
        'The messages and data an agent carries through a run.',
      whyItMatters:
        'State is what makes a multi-turn agent coherent; without it, every turn would start from nothing.',
      explanation: {
        plain:
          'As an agent works, it accumulates a history of messages and tool results, plus any data you attach to its state. That history is what the model sees on the next turn.',
        technical:
          'Conversation history is the ordered record of user, model, and tool messages; agent `state` is a separate key–value store for data that isn’t part of the transcript. Both feed the next model invocation, and both are what you persist if you want continuity beyond a single process.',
      },
      visual: { kind: 'none', reason: 'Covered concretely by session management and the context manager below.' },
      docUrl: DOCS,
      verificationId: 'strands_sdk',
      coverageStatus: 'full',
      tags: ['state', 'conversation history'],
      relatedTopicIds: ['session-management', 'context-manager'],
    }),
    t({
      id: 'session-management',
      title: 'Session management',
      oneLiner:
        'Persist an agent’s state and history so it survives restarts and scales across instances.',
      whyItMatters:
        'Production agents run across many short-lived processes; sessions are how a conversation continues when the process that started it is gone.',
      explanation: {
        plain:
          'A session saves an agent’s conversation and state to durable storage, so if the process restarts — or a different server handles the next request — the agent picks up where it left off.',
        technical:
          'Session management persists state and history to a storage backend, restoring it on the next invocation. Persistence is triggered on specific lifecycle events rather than continuously, which bounds write volume. The TypeScript SDK adds immutable snapshots and time-travel restore, letting you roll back to an earlier point in a session.',
      },
      visual: {
        kind: 'lifecycle_timeline',
        stages: [
          { id: 'start', label: 'Start / restore', plain: 'A session begins, or an existing one is loaded from storage.', technical: 'On invocation, prior state + history are restored from the backend if a session id exists.' },
          { id: 'run', label: 'Run turn', plain: 'The agent reasons and uses tools for this turn.', technical: 'The agent loop executes; messages and tool results accumulate in memory.' },
          { id: 'persist', label: 'Persist on trigger', plain: 'At key moments, the state is written to storage.', technical: 'State persists on lifecycle triggers (e.g. after a turn completes) — not on every token.' },
          { id: 'resume', label: 'Resume later', plain: 'A new process loads the session and continues.', technical: 'A later invocation restores the snapshot; in TS you can time-travel to an earlier snapshot.' },
        ],
      },
      codeSamples: [
        {
          id: 'session',
          title: 'Persisting a session (shape)',
          language: 'python',
          filename: 'session.py',
          code: `# Reference shape — verify the exact API against current Strands docs.
from strands import Agent

# A session manager persists state/history to a storage backend and restores
# it by session id on the next run.
agent = Agent(
    model=model,
    tools=[retrieve],
    # session_manager=<your storage-backed session manager>,
    # agent_id="meridian-assistant",
)
`,
          verifyServices: ['strands_sdk'],
        },
      ],
      docUrl: DOCS,
      verificationId: 'strands_sdk',
      coverageStatus: 'full',
      tags: ['session', 'persistence', 'snapshots', 'time-travel'],
      relatedTopicIds: ['agent-state', 'deploy-runtime'],
    }),
    t({
      id: 'context-manager',
      title: 'Conversation & context managers',
      oneLiner:
        'Keep a long conversation within the model’s window by summarizing, compressing, or offloading.',
      whyItMatters:
        'Every model has a finite context; without management, long sessions silently drop the earliest — often most important — information.',
      explanation: {
        plain:
          'As a conversation grows, it can exceed what the model can read at once. A conversation/context manager decides what to keep verbatim, what to summarize, and what to move out of the immediate window so the agent stays coherent.',
        technical:
          'Managers apply strategies as the history approaches a threshold: summarizing older turns, compressing or truncating, and offloading content that can be retrieved on demand. The goal is to preserve the signal that matters for the current task while staying within the model’s context budget.',
      },
      visual: {
        kind: 'concept_diagram',
        height: 300,
        nodes: [
          { id: 'grow', label: 'Growing history', sublabel: 'turns pile up', detail: 'Each turn adds messages and tool results.', x: 16, y: 24 },
          { id: 'threshold', label: 'Threshold', sublabel: 'context budget', detail: 'Approaching the model’s usable window triggers management.', x: 16, y: 74 },
          { id: 'summarize', label: 'Summarize', detail: 'Condense older turns into a compact summary.', x: 52, y: 20 },
          { id: 'compress', label: 'Compress / truncate', detail: 'Drop or shrink low-value content.', x: 52, y: 52 },
          { id: 'offload', label: 'Offload', detail: 'Move content out of the window, retrievable on demand.', x: 52, y: 84 },
          { id: 'fit', label: 'Fits the window', detail: 'The managed context stays within budget and coherent.', x: 86, y: 52, accent: 'rgb(13 148 136)' },
        ],
        edges: [
          { from: 'grow', to: 'threshold' },
          { from: 'threshold', to: 'summarize' },
          { from: 'threshold', to: 'compress' },
          { from: 'threshold', to: 'offload' },
          { from: 'summarize', to: 'fit' },
          { from: 'compress', to: 'fit' },
          { from: 'offload', to: 'fit' },
        ],
      },
      docUrl: DOCS,
      verificationId: 'strands_sdk',
      coverageStatus: 'full',
      tags: ['context', 'summarization', 'compression', 'offloading'],
      relatedTopicIds: ['agent-state'],
    }),
  ],
}
