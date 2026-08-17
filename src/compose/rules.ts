import type { RagArchitectureId } from '../types'
import type { CalloutVariant } from '../components/ui/Callout'
import {
  MANAGED_ONLY_SOURCES,
  type RagComposition,
} from './composition'

/**
 * Deterministic, explainable composition rules. Two jobs:
 *   1. normalizeComposition — apply hard implications (e.g. multiKb ⇒ gateway).
 *   2. diagnose — produce human-readable errors / warnings / recommendations.
 * And a nearest-pattern mapping so a composition links to the closest of the
 * nine catalog deep dives.
 */

export interface Diagnostic {
  id: string
  level: 'error' | 'warning' | 'recommendation'
  message: string
}

export function calloutVariantFor(level: Diagnostic['level']): CalloutVariant {
  if (level === 'error') return 'warning'
  if (level === 'warning') return 'note'
  return 'tip'
}

/**
 * Apply the non-negotiable implications between choices so the composition is
 * always internally consistent. Pure — returns a new object.
 */
export function normalizeComposition(c: RagComposition): RagComposition {
  const next: RagComposition = { ...c, dataSources: [...c.dataSources] }

  // Routing across multiple KBs is done through the Gateway.
  if (next.multiKb) next.gateway = true

  // Native connectors (SharePoint/Confluence/Drive/OneDrive/Web) are a
  // Managed KB feature — a customer-managed store means you own ingestion,
  // so restrict its sources to S3.
  if (next.knowledgeBase === 'customer_managed') {
    next.dataSources = next.dataSources.filter(
      (s) => !MANAGED_ONLY_SOURCES.includes(s),
    )
    if (next.dataSources.length === 0) next.dataSources = ['s3']
  }

  // GraphRAG needs a graph store (Neptune Analytics) via a customer-managed KB.
  if (next.graphAugmented) {
    next.knowledgeBase = 'customer_managed'
    next.vectorStore = 'neptune'
    next.dataSources = next.dataSources.filter(
      (s) => !MANAGED_ONLY_SOURCES.includes(s),
    )
    if (next.dataSources.length === 0) next.dataSources = ['s3']
  }

  // At least one source.
  if (next.dataSources.length === 0) next.dataSources = ['s3']

  return next
}

/** Human-readable diagnostics for the current (already-normalized) choices. */
export function diagnose(c: RagComposition): Diagnostic[] {
  const out: Diagnostic[] = []

  if (
    c.accessControl === 'document_acls' &&
    c.knowledgeBase === 'customer_managed'
  ) {
    out.push({
      id: 'acl-without-managed',
      level: 'warning',
      message:
        'Per-user document ACLs without a Managed Knowledge Base means you must build access filtering yourself at retrieval time. Managed KBs can enforce document-level access from connector metadata.',
    })
  }

  if (c.memory === 'long_term') {
    out.push({
      id: 'memory-not-rag',
      level: 'warning',
      message:
        'Long-term Memory ≠ RAG. It stores who the user is (role, history), not authoritative facts. Personalize from memory, but ground every factual claim in retrieval.',
    })
  }

  if (c.retrievalMode === 'agentic_retrieval') {
    out.push({
      id: 'agentic-cost',
      level: 'recommendation',
      message:
        'Agentic Retrieval handles multi-hop questions but adds latency and cost (several retrieval calls per question). Bound the number of hops.',
    })
  }

  if (c.multiKb) {
    out.push({
      id: 'multikb-gateway',
      level: 'recommendation',
      message:
        'Routing across multiple knowledge bases is done via AgentCore Gateway (each KB becomes an MCP tool with centralized auth). Gateway has been enabled for you.',
    })
  }

  if (c.orchestration === 'multi_agent') {
    out.push({
      id: 'multi-agent-complexity',
      level: 'recommendation',
      message:
        'Multi-agent orchestration (supervisor + specialists) adds reliability and a review gate, but also latency, cost, and coordination complexity. Reserve it for high-stakes answers.',
    })
  }

  if (c.reranking && c.knowledgeBase === 'customer_managed') {
    out.push({
      id: 'rerank-customer',
      level: 'recommendation',
      message:
        'Reranking is available with either KB kind, but with a customer-managed store you own more of the retrieval pipeline configuration.',
    })
  }

  if (c.accessControl === 'document_acls' && !c.guardrails) {
    out.push({
      id: 'acl-plus-guardrails',
      level: 'recommendation',
      message:
        'Access control (ACLs at retrieval) and Guardrails (safety at generation) are complementary. For regulated data, consider enabling both.',
    })
  }

  if (c.deployTarget === 'agentcore_runtime' && !c.observability) {
    out.push({
      id: 'deploy-without-observability',
      level: 'recommendation',
      message:
        'Deploying without observability makes production issues hard to debug or audit. Consider enabling AgentCore Observability.',
    })
  }

  if (
    c.dataSources.length > 1 &&
    !c.multiKb &&
    c.knowledgeBase === 'managed_kb'
  ) {
    out.push({
      id: 'many-sources-one-kb',
      level: 'recommendation',
      message:
        'Multiple sources in one Knowledge Base is fine. If they have different owners, permissions, or refresh cadences, consider separate KBs routed via Gateway (multi-KB).',
    })
  }

  return out
}

/**
 * Map a composition to the nearest of the nine catalog patterns. A transparent
 * priority list — the first matching rule wins — so the "resembles X" answer is
 * always explainable.
 */
export function nearestPattern(c: RagComposition): {
  id: RagArchitectureId
  reason: string
} {
  if (c.guardrails && c.accessControl === 'document_acls' && c.observability) {
    return {
      id: 'guardrailed_secure_rag',
      reason:
        'Guardrails, per-user access control, and observability together are the secure, auditable end-state.',
    }
  }
  if (c.orchestration === 'multi_agent') {
    return {
      id: 'multi_agent_rag',
      reason:
        'A supervisor coordinating specialist agents is the multi-agent pattern.',
    }
  }
  if (c.graphAugmented) {
    return {
      id: 'graph_rag',
      reason: 'Graph-augmented retrieval over related entities is GraphRAG.',
    }
  }
  if (c.memory === 'long_term') {
    return {
      id: 'memory_augmented_rag',
      reason:
        'Long-term memory alongside retrieval is memory-augmented RAG (memory personalizes, retrieval grounds).',
    }
  }
  if (c.multiKb) {
    return {
      id: 'multi_kb_agentic_rag',
      reason:
        'Routing across multiple knowledge bases via Gateway is multi-KB agentic RAG.',
    }
  }
  if (c.retrievalMode === 'agentic_retrieval') {
    return {
      id: 'agentic_rag',
      reason:
        'Letting the model decide when and what to retrieve (multi-hop) is agentic RAG.',
    }
  }
  if (c.reranking) {
    return {
      id: 'hybrid_rerank_rag',
      reason: 'Over-fetch plus reranking for precision is hybrid + rerank RAG.',
    }
  }
  if (c.knowledgeBase === 'managed_kb') {
    return {
      id: 'managed_kb_rag',
      reason:
        'A Managed Knowledge Base with single-shot retrieval is managed KB RAG.',
    }
  }
  return {
    id: 'naive_rag',
    reason:
      'A hand-built pipeline over a customer-managed store with single-shot retrieval is naive RAG.',
  }
}
