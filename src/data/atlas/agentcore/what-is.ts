import type { AtlasSection, AtlasTopic } from '../../../atlas/types'

const S = 'what-is'
const DOCS =
  'https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html'

type T = Omit<AtlasTopic, 'atlasId' | 'sectionId'>
const t = (x: T): AtlasTopic => ({ ...x, atlasId: 'agentcore', sectionId: S })

export const whatIs: AtlasSection = {
  id: S,
  atlasId: 'agentcore',
  title: 'What AgentCore is',
  order: 1,
  blurb: 'A framework- and model-agnostic platform to build, deploy, and operate agents securely at scale.',
  topics: [
    t({
      id: 'what-is-agentcore',
      title: 'What AgentCore is',
      oneLiner:
        'A set of composable services for hosting, remembering, connecting, securing, and observing agents on AWS.',
      whyItMatters:
        'It lets you take an agent from a laptop script to a secure, observable production system without stitching the platform together yourself — and without locking into a single framework.',
      explanation: {
        plain:
          'Amazon Bedrock AgentCore is a platform for running agents in production. It’s framework- and model-agnostic — you can bring a Strands, LangGraph, or custom agent — and it provides the pieces a real deployment needs: hosting, memory, tool connectivity, identity, safety, and observability. It has been generally available since October 2025.',
        technical:
          'AgentCore is a collection of services designed to be used together or independently (the composability principle). Runtime hosts the agent; Memory persists context; Gateway exposes tools; Identity handles auth; Policy bounds actions; Observability and Evaluations make it measurable. You adopt only what you need — Gateway without Runtime, or Memory with a self-hosted agent — because each service stands on its own.',
      },
      visual: {
        kind: 'layered_stack',
        layers: [
          { id: 'runtime', label: 'Runtime', role: 'hosting', detail: 'Serverless, session-isolated agent hosting with long execution windows.', topicId: 'runtime-hosting', accent: 'rgb(20 184 166)' },
          { id: 'memory', label: 'Memory', role: 'state', detail: 'Short-term session state and long-term, cross-session memory.', topicId: 'memory-vs-rag' },
          { id: 'gateway', label: 'Gateway', role: 'tools', detail: 'Turns APIs, Lambda, and MCP servers into agent tools behind one secure endpoint.', topicId: 'gateway-targets' },
          { id: 'identity', label: 'Identity', role: 'auth', detail: 'Agent identity and scoped credentials (Cognito/JWT).', topicId: 'identity' },
          { id: 'tools', label: 'Built-in tools', role: 'capabilities', detail: 'Managed Browser and Code Interpreter.', topicId: 'browser' },
          { id: 'policy', label: 'Policy', role: 'authorization', detail: 'Cedar-based guardrails on tools and write paths.', topicId: 'policy' },
          { id: 'observability', label: 'Observability', role: 'ops', detail: 'Traces and metrics to CloudWatch; the GenAI Observability panel.', topicId: 'observability-trace' },
          { id: 'evaluations', label: 'Evaluations', role: 'quality', detail: 'LLM-as-judge scoring of agent quality.', topicId: 'evaluations' },
        ],
      },
      docUrl: DOCS,
      verificationId: 'agentcore_runtime',
      coverageStatus: 'full',
      tags: ['overview', 'platform', 'composability', 'ga'],
      appliedIn: [
        { label: 'The secure end-state pattern', to: '/architecture/guardrailed_secure_rag' },
        { label: 'Build the Meridian agent', to: '/build' },
      ],
      relatedTopicIds: ['runtime-hosting', 'gateway-targets', 'memory-vs-rag'],
    }),
  ],
}
