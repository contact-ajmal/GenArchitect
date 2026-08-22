import type { AwsServiceId } from '../types'
import type { AtlasId } from './types'

/**
 * Where each building block is explained in the atlases. This is what makes the
 * atlases the single source of conceptual truth: everywhere else in the app
 * references a topic here instead of re-explaining the concept.
 */
export interface AtlasRef {
  atlas: AtlasId
  topicId: string
  label: string
}

export const ATLAS_FOR_SERVICE: Partial<Record<AwsServiceId, AtlasRef>> = {
  agentcore_runtime: { atlas: 'agentcore', topicId: 'runtime-hosting', label: 'AgentCore Runtime' },
  agentcore_memory: { atlas: 'agentcore', topicId: 'memory-vs-rag', label: 'AgentCore Memory' },
  agentcore_gateway: { atlas: 'agentcore', topicId: 'gateway-targets', label: 'AgentCore Gateway' },
  agentcore_identity: { atlas: 'agentcore', topicId: 'identity', label: 'AgentCore Identity' },
  agentcore_browser: { atlas: 'agentcore', topicId: 'browser', label: 'AgentCore Browser' },
  agentcore_code_interpreter: { atlas: 'agentcore', topicId: 'code-interpreter', label: 'Code Interpreter' },
  agentcore_observability: { atlas: 'agentcore', topicId: 'observability-trace', label: 'AgentCore Observability' },
  agentcore_evaluations: { atlas: 'agentcore', topicId: 'evaluations', label: 'AgentCore Evaluations' },
  agentcore_policy: { atlas: 'agentcore', topicId: 'policy', label: 'AgentCore Policy' },
  // The retrieval atlas is where the storage and model building blocks are
  // explained, so a pattern's building-block cards link into it directly.
  bedrock_kb_managed: { atlas: 'retrieval', topicId: 'chunking-decides', label: 'chunking' },
  bedrock_kb_customer_managed: { atlas: 'retrieval', topicId: 'what-an-index-is', label: 'vector indexes' },
  bedrock_foundation_models: { atlas: 'retrieval', topicId: 'what-is-an-embedding', label: 'embeddings' },
  bedrock_guardrails: { atlas: 'retrieval', topicId: 'grounding-checks', label: 'grounding checks' },
  opensearch_serverless: { atlas: 'retrieval', topicId: 'aws-vector-options', label: 'choosing a vector store' },
  aurora_pgvector: { atlas: 'retrieval', topicId: 'aws-vector-options', label: 'choosing a vector store' },
  neptune: { atlas: 'retrieval', topicId: 'aws-vector-options', label: 'choosing a vector store' },
  strands_sdk: { atlas: 'strands', topicId: 'agent-loop', label: 'the agent loop' },
  strands_agents_tools: { atlas: 'strands', topicId: 'community-tools', label: 'the tools package' },
  mcp: { atlas: 'strands', topicId: 'mcp-tools', label: 'MCP integration' },
}

export function atlasRefFor(id: AwsServiceId): AtlasRef | undefined {
  return ATLAS_FOR_SERVICE[id]
}

/** De-duplicated atlas references for a set of services (for "learn the concept" strips). */
export function atlasRefsFor(ids: AwsServiceId[]): AtlasRef[] {
  const seen = new Set<string>()
  const out: AtlasRef[] = []
  for (const id of ids) {
    const ref = ATLAS_FOR_SERVICE[id]
    if (ref && !seen.has(ref.topicId)) {
      seen.add(ref.topicId)
      out.push(ref)
    }
  }
  return out
}
