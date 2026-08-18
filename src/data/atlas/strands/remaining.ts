import type { AtlasSection, AtlasTopic } from '../../../atlas/types'

const DOCS = 'https://strandsagents.com/'

function make(sectionId: string, x: Omit<AtlasTopic, 'atlasId' | 'sectionId'>): AtlasTopic {
  return { ...x, atlasId: 'strands', sectionId }
}

/* --- Streaming & async --------------------------------------------------- */
const SA = 'streaming-async'
export const streamingAsync: AtlasSection = {
  id: SA,
  atlasId: 'strands',
  title: 'Streaming & async',
  order: 7,
  blurb: 'Async execution, streaming responses, and hooks into the loop.',
  topics: [
    make(SA, {
      id: 'streaming',
      title: 'Async, streaming & hooks',
      oneLiner: 'Run agents asynchronously, stream tokens as they arrive, and hook into loop events.',
      whyItMatters:
        'Streaming is what makes an agent feel responsive, and hooks are how you observe or intervene without forking the SDK.',
      explanation: {
        plain:
          'Agents can run asynchronously and stream their output so a UI shows text as it’s generated instead of waiting for the whole answer. Hooks and callbacks let you run your own code at points in the loop — for logging, UI updates, or guardrails.',
        technical:
          'Async support lets you await agent invocations and integrate with async I/O. Streaming yields incremental output (and often tool-call events) as the loop progresses. Hooks/callbacks fire on lifecycle events — model start, tool start/end, completion — giving you a clean extension point for telemetry, UI, or policy checks.',
      },
      visual: {
        kind: 'sequence_trace',
        spans: [
          { id: 'inv', label: 'agent.invoke (async)', detail: 'The call is awaited; output streams back.', depth: 0, kind: 'entrypoint' },
          { id: 'mstart', label: 'hook: model start', detail: 'A callback fires before the model runs.', depth: 1, kind: 'model' },
          { id: 'stream', label: 'stream tokens', detail: 'Partial output is emitted as it’s generated.', depth: 1, kind: 'model' },
          { id: 'tstart', label: 'hook: tool start', detail: 'A callback fires before a tool executes.', depth: 1, kind: 'tool' },
          { id: 'tend', label: 'hook: tool end', detail: 'A callback fires with the tool result.', depth: 1, kind: 'tool' },
          { id: 'done', label: 'hook: complete', detail: 'Final response ready.', depth: 0, kind: 'response' },
        ],
      },
      docUrl: DOCS,
      verificationId: 'strands_sdk',
      coverageStatus: 'full',
      tags: ['async', 'streaming', 'hooks', 'callbacks'],
    }),
  ],
}

/* --- Observability & evaluation ------------------------------------------ */
const OB = 'observability'
export const observability: AtlasSection = {
  id: OB,
  atlasId: 'strands',
  title: 'Observability & evaluation',
  order: 8,
  blurb: 'OpenTelemetry instrumentation, trajectories, metrics, and how to evaluate agents.',
  topics: [
    make(OB, {
      id: 'otel',
      title: 'OpenTelemetry & trajectories',
      oneLiner: 'Emit standard traces and metrics for every step an agent takes.',
      whyItMatters:
        'You can’t debug or trust an agent you can’t see; standard instrumentation is what makes its behavior inspectable in the tools you already use.',
      explanation: {
        plain:
          'Strands is instrumented with OpenTelemetry, so an agent’s run — the reasoning steps, tool calls, and timings — shows up as traces and metrics in your observability stack. The full sequence of steps an agent took is its trajectory.',
        technical:
          'OpenTelemetry instrumentation produces distributed traces spanning the loop’s components (model calls, tool executions, sub-agents) and metrics (latency, token usage, tool counts). Because it’s OTel, it exports to standard backends — including Amazon CloudWatch via AgentCore Observability. Trajectories are the ordered record you inspect to find where an answer went wrong.',
      },
      visual: {
        kind: 'sequence_trace',
        spans: [
          { id: 'sess', label: 'agent session', detail: 'Root span for one invocation.', depth: 0, kind: 'entrypoint' },
          { id: 'm1', label: 'model.reason', detail: 'First reasoning step.', depth: 1, kind: 'model' },
          { id: 't1', label: 'tool.retrieve', detail: 'A retrieval tool call, timed.', depth: 1, kind: 'tool' },
          { id: 'm2', label: 'model.reason', detail: 'Reasoning over the result.', depth: 1, kind: 'model' },
          { id: 'resp', label: 'response', detail: 'Final answer emitted.', depth: 0, kind: 'response' },
        ],
      },
      docUrl: DOCS,
      verificationId: 'strands_sdk',
      coverageStatus: 'full',
      tags: ['observability', 'opentelemetry', 'tracing', 'metrics', 'trajectories'],
      relatedTopicIds: [],
      appliedIn: [
        { label: 'Evaluation & observability primer', to: '/evaluate' },
        { label: 'AgentCore Observability', to: '/agentcore' },
      ],
    }),
    make(OB, {
      id: 'evaluation',
      title: 'Evaluating agents',
      oneLiner: 'Measure quality against datasets so changes don’t silently regress.',
      whyItMatters:
        'Agents are non-deterministic; without evaluation you find regressions from user complaints instead of before you ship.',
      explanation: {
        plain:
          'Evaluation means running your agent against known inputs and scoring the outputs — is it grounded, relevant, correct — so you can compare versions objectively.',
        technical:
          'Evaluation approaches range from exact-match and rubric scoring to LLM-as-judge for open-ended quality (groundedness, relevance, tool-use correctness), run over a labeled dataset. Pair evaluation with the trajectory traces above: metrics tell you *that* quality dropped; the trace tells you *where*.',
      },
      visual: { kind: 'none', reason: 'Covered in depth by the app’s evaluation primer — cross-linked below.' },
      docUrl: DOCS,
      verificationId: 'strands_sdk',
      coverageStatus: 'full',
      tags: ['evaluation', 'llm-as-judge'],
      appliedIn: [{ label: 'RAG metrics & LLM-as-judge caveats', to: '/evaluate' }],
    }),
  ],
}

/* --- Safety & security --------------------------------------------------- */
const SEC = 'safety'
export const safety: AtlasSection = {
  id: SEC,
  atlasId: 'strands',
  title: 'Safety & security',
  order: 9,
  blurb: 'Responsible tool design, handling untrusted input, and secrets.',
  topics: [
    make(SEC, {
      id: 'safety',
      title: 'Responsible tools & prompt-injection awareness',
      oneLiner: 'Design tools with least privilege and treat retrieved content as untrusted.',
      whyItMatters:
        'An agent’s tools are its blast radius; a poorly-scoped tool or a poisoned document can turn a helpful agent into an incident.',
      explanation: {
        plain:
          'Give each tool only the access it needs, validate inputs and outputs, and remember that anything the agent reads — including retrieved documents — could try to manipulate it. Never put secrets in prompts or code.',
        technical:
          'Practice least privilege at the tool boundary (scoped credentials, narrow permissions), validate tool arguments and results, and treat retrieved or tool-returned content as untrusted input — a vector for prompt injection and retrieval poisoning. Mitigations layer up: output guardrails, source trust, and validating any action before it’s taken. Keep credentials in a secrets manager or identity system, not in prompts.',
      },
      visual: { kind: 'none', reason: 'The security track covers the AWS-side controls in depth — cross-linked below.' },
      docUrl: DOCS,
      verificationId: 'strands_sdk',
      coverageStatus: 'full',
      tags: ['safety', 'security', 'prompt injection', 'least privilege'],
      appliedIn: [
        { label: 'Security & compliance deep dive', to: '/security' },
        { label: 'Prompt-injection failure mode', to: '/failure-modes' },
      ],
    }),
  ],
}

/* --- Deployment & production --------------------------------------------- */
const DEP = 'deployment'
export const deployment: AtlasSection = {
  id: DEP,
  atlasId: 'strands',
  title: 'Deployment & production',
  order: 10,
  blurb: 'From a local script to a hosted agent — including AgentCore Runtime.',
  topics: [
    make(DEP, {
      id: 'deploy-runtime',
      title: 'Local to production',
      oneLiner: 'The same agent runs locally and on managed runtimes like AgentCore Runtime.',
      whyItMatters:
        'A framework that only runs on your laptop isn’t useful; Strands agents move to production hosting without a rewrite.',
      explanation: {
        plain:
          'You build and test an agent locally, then deploy the same code to run at scale. On AWS, Amazon Bedrock AgentCore Runtime hosts it serverlessly with session isolation and long execution windows.',
        technical:
          'Because a Strands agent is ordinary Python, you can host it however you host Python — but AgentCore Runtime is purpose-built: wrap the agent in a runtime entrypoint and deploy it for serverless, session-isolated execution (up to multi-hour runs). Pair it with session management (to persist state) and observability (to trace it) for a production posture.',
      },
      visual: {
        kind: 'lifecycle_timeline',
        stages: [
          { id: 'local', label: 'Local', plain: 'Build and test the agent on your machine.', technical: 'Run the agent as a script; iterate on prompt, tools, and eval.' },
          { id: 'wrap', label: 'Wrap', plain: 'Expose it through a runtime entrypoint.', technical: 'Adapt the agent to the AgentCore Runtime entrypoint contract.' },
          { id: 'deploy', label: 'Deploy', plain: 'Host it serverlessly with isolation.', technical: 'Deploy to AgentCore Runtime; sessions are isolated per invocation.' },
          { id: 'operate', label: 'Operate', plain: 'Trace, evaluate, and iterate in production.', technical: 'Observability to CloudWatch + evaluations gate changes.' },
        ],
      },
      docUrl: DOCS,
      verificationId: 'strands_sdk',
      coverageStatus: 'full',
      tags: ['deployment', 'production', 'agentcore runtime'],
      appliedIn: [
        { label: 'AgentCore Runtime', to: '/agentcore' },
        { label: 'Deploy stage of the build track', to: '/build' },
      ],
    }),
  ],
}

/* --- API reference orientation ------------------------------------------- */
const API = 'api-reference'
export const apiReference: AtlasSection = {
  id: API,
  atlasId: 'strands',
  title: 'API reference orientation',
  order: 11,
  blurb: 'How the API surface is organized — a map, not a mirror.',
  topics: [
    make(API, {
      id: 'api-map',
      title: 'Reading the API reference',
      oneLiner: 'Where the main pieces live, so the official reference is easy to navigate.',
      whyItMatters:
        'Knowing the shape of the API means you can find the exact signature you need quickly — and we link you straight to it rather than copying it.',
      explanation: {
        plain:
          'The Strands API centers on a few things: the Agent, models, tools, session and context managers, and the multi-agent primitives. Once you know those anchors, the official reference is easy to search.',
        technical:
          'Orient around: `Agent` (composition + invocation), model provider classes (e.g. `BedrockModel`), the `@tool` decorator and tools package, session/conversation/context managers, and the multi-agent constructs (Agents-as-Tools, Graph, Swarm, Workflow, A2A). For exact signatures, parameters, and return types, use the official API reference — this atlas deliberately does not mirror it.',
      },
      visual: { kind: 'none', reason: 'A navigational aid; the canonical reference is the source of truth.' },
      docUrl: DOCS,
      verificationId: 'strands_sdk',
      coverageStatus: 'overview',
      tags: ['api reference', 'navigation'],
      relatedTopicIds: ['agent-composition', 'tool-decorator'],
    }),
  ],
}
