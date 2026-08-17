import type { DiagramComponent } from '../types'
import type { DiagramSource } from '../lib/layout'
import {
  DATA_SOURCE_LABELS,
  VECTOR_STORE_LABELS,
  type RagComposition,
} from './composition'

/**
 * Derive a diagram (a DiagramSource for RagDiagram) from a composition. Only the
 * layers/components the choices imply are included; guardrails, memory,
 * orchestration, and observability appear as cross-cutting spines when selected.
 * Node ids are stable so the studio can highlight the nodes a choice affects.
 */
export function compositionToDiagram(c: RagComposition): DiagramSource {
  const layers: DiagramComponent[] = []

  // Sources
  for (const src of c.dataSources) {
    layers.push({
      id: `src_${src}`,
      label: DATA_SOURCE_LABELS[src],
      layer: 'sources',
      role: 'corpus',
      awsServiceId: src === 's3' ? 's3' : undefined,
    })
  }

  // Ingestion
  if (c.knowledgeBase === 'managed_kb') {
    layers.push({
      id: 'connectors',
      label: 'Native connectors',
      layer: 'ingestion',
      role: 'connector',
      awsServiceId: 'bedrock_kb_managed',
    })
    layers.push({
      id: 'managed_pipeline',
      label: 'Managed parse + embed',
      layer: 'ingestion',
      role: 'managed-pipeline',
      awsServiceId: 'bedrock_kb_managed',
    })
  } else {
    layers.push({
      id: 'chunker',
      label: 'Chunker',
      layer: 'ingestion',
      role: 'splitter',
    })
    layers.push({
      id: 'embedder',
      label: 'Embedder',
      layer: 'ingestion',
      role: 'embedder',
      awsServiceId: 'bedrock_foundation_models',
    })
  }
  if (c.graphAugmented) {
    layers.push({
      id: 'entity_extractor',
      label: 'Entity + relation extraction',
      layer: 'ingestion',
      role: 'graph-builder',
      awsServiceId: 'bedrock_kb_customer_managed',
    })
  }

  // Index
  if (c.multiKb) {
    for (const name of ['Policies', 'Product', 'Compliance']) {
      layers.push({
        id: `kb_${name.toLowerCase()}`,
        label: `${name} KB`,
        layer: 'index',
        role: 'knowledge-base',
        awsServiceId: 'bedrock_kb_managed',
      })
    }
  } else if (c.graphAugmented) {
    layers.push({
      id: 'graph_store',
      label: 'Knowledge graph',
      layer: 'index',
      role: 'graph-index',
      awsServiceId: 'neptune',
      note: 'Neptune Analytics',
    })
  } else if (c.knowledgeBase === 'customer_managed') {
    layers.push({
      id: 'vector_store',
      label: VECTOR_STORE_LABELS[c.vectorStore],
      layer: 'index',
      role: 'vector-index',
      awsServiceId:
        c.vectorStore === 'neptune'
          ? 'neptune'
          : c.vectorStore === 'aurora_pgvector'
            ? 'aurora_pgvector'
            : 'opensearch_serverless',
    })
  } else {
    layers.push({
      id: 'managed_index',
      label: 'Managed vector store',
      layer: 'index',
      role: 'managed-index',
      awsServiceId: 'opensearch_serverless',
    })
  }

  // Retrieval
  layers.push({
    id: 'retriever',
    label:
      c.retrievalMode === 'agentic_retrieval'
        ? 'Agentic retrieval'
        : 'Retrieval',
    layer: 'retrieval',
    role: 'retriever',
    awsServiceId:
      c.knowledgeBase === 'managed_kb'
        ? 'bedrock_kb_managed'
        : 'bedrock_kb_customer_managed',
    note: c.retrievalMode === 'agentic_retrieval' ? 'multi-hop' : undefined,
  })
  if (c.reranking) {
    layers.push({
      id: 'reranker',
      label: 'Reranker',
      layer: 'retrieval',
      role: 'reranker',
      awsServiceId: 'bedrock_foundation_models',
    })
  }
  if (c.accessControl === 'document_acls') {
    layers.push({
      id: 'acl_filter',
      label: 'Per-user ACL filter',
      layer: 'retrieval',
      role: 'access-filter',
      awsServiceId: 'bedrock_kb_managed',
      note: 'authorize at retrieval',
    })
  }

  // Augmentation + generation
  layers.push({
    id: 'context',
    label: 'Cited context',
    layer: 'augmentation',
    role: 'augmenter',
  })
  layers.push({
    id: 'llm',
    label: 'LLM',
    layer: 'generation',
    role: 'generator',
    awsServiceId: 'bedrock_foundation_models',
  })

  // Guardrails spine
  if (c.guardrails) {
    layers.push({
      id: 'guardrails',
      label: 'Bedrock Guardrails',
      layer: 'guardrails',
      role: 'safety',
      awsServiceId: 'bedrock_guardrails',
    })
  }

  // Memory spine
  if (c.memory !== 'none') {
    layers.push({
      id: 'memory',
      label:
        c.memory === 'long_term'
          ? 'AgentCore Memory (long-term)'
          : 'AgentCore Memory (session)',
      layer: 'memory',
      role: 'memory-store',
      awsServiceId: 'agentcore_memory',
    })
  }

  // Orchestration spine
  if (c.orchestration === 'multi_agent') {
    layers.push(
      {
        id: 'supervisor',
        label: 'Supervisor agent',
        layer: 'orchestration',
        role: 'supervisor',
        awsServiceId: 'strands_sdk',
      },
      {
        id: 'specialist_retriever',
        label: 'Retriever agent',
        layer: 'orchestration',
        role: 'specialist',
        awsServiceId: 'strands_sdk',
      },
      {
        id: 'specialist_compliance',
        label: 'Reviewer agent',
        layer: 'orchestration',
        role: 'specialist',
        awsServiceId: 'strands_sdk',
      },
    )
  } else {
    layers.push({
      id: 'agent',
      label: 'Strands agent',
      layer: 'orchestration',
      role: c.retrievalMode === 'agentic_retrieval' ? 'planner' : 'orchestrator',
      awsServiceId: 'strands_sdk',
    })
  }
  if (c.gateway || c.multiKb) {
    layers.push({
      id: 'gateway',
      label: 'AgentCore Gateway',
      layer: 'orchestration',
      role: c.multiKb ? 'router' : 'tool-gateway',
      awsServiceId: 'agentcore_gateway',
      note: 'MCP tools · central auth',
    })
  }
  if (c.accessControl === 'document_acls' || c.gateway) {
    layers.push({
      id: 'iam',
      label: 'IAM (least privilege)',
      layer: 'orchestration',
      role: 'authz',
      awsServiceId: 'iam',
    })
  }
  if (c.deployTarget === 'agentcore_runtime') {
    layers.push({
      id: 'runtime',
      label: 'AgentCore Runtime',
      layer: 'orchestration',
      role: 'runtime',
      awsServiceId: 'agentcore_runtime',
      note: 'serverless hosting',
    })
  }

  // Observability spine
  if (c.observability) {
    layers.push(
      {
        id: 'observability',
        label: 'AgentCore Observability',
        layer: 'observability',
        role: 'tracing',
        awsServiceId: 'agentcore_observability',
      },
      {
        id: 'cloudwatch',
        label: 'CloudWatch',
        layer: 'observability',
        role: 'monitoring',
        awsServiceId: 'cloudwatch',
      },
    )
  }
  if (c.evaluations) {
    layers.push({
      id: 'evaluations',
      label: 'AgentCore Evaluations',
      layer: 'observability',
      role: 'evaluation',
      awsServiceId: 'agentcore_evaluations',
    })
  }

  return {
    name: c.name || 'Your composition',
    accentColor: '#14B8A6',
    layers,
  }
}

/**
 * Which diagram node ids a given control affects — used to briefly highlight the
 * diagram when a choice changes, making the assembly feel alive.
 */
export function nodesForControl(control: string): string[] {
  switch (control) {
    case 'reranking':
      return ['reranker']
    case 'graphAugmented':
      return ['entity_extractor', 'graph_store']
    case 'guardrails':
      return ['guardrails']
    case 'memory':
      return ['memory']
    case 'multiKb':
      return ['kb_policies', 'kb_product', 'kb_compliance', 'gateway']
    case 'gateway':
      return ['gateway', 'iam']
    case 'accessControl':
      return ['acl_filter', 'iam']
    case 'orchestration':
      return ['supervisor', 'specialist_retriever', 'specialist_compliance']
    case 'observability':
      return ['observability', 'cloudwatch']
    case 'evaluations':
      return ['evaluations']
    case 'deployTarget':
      return ['runtime']
    case 'retrievalMode':
      return ['retriever']
    default:
      return []
  }
}
