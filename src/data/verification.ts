import type { AwsServiceId } from '../types'
import { AWS_SERVICES } from './services'

/**
 * The freshness / verified trust layer — the single source of truth for
 * "verify against current AWS docs". Every AWS building block carries a
 * verification record; code blocks derive their badge from the services they
 * touch (worst-case volatility wins). No fabricated URLs — only real canonical
 * AWS/vendor docs.
 */

export type Volatility = 'stable' | 'moderate' | 'volatile'

export interface VerificationRecord {
  /** ISO date this claim/syntax was last checked against the source. */
  lastVerified: string
  /** Canonical documentation URL. */
  sourceUrl: string
  /** How likely the exact syntax/CLI/params are to drift. */
  volatility: Volatility
  note?: string
}

const VERIFIED = '2026-08-01'

const DOC: Record<AwsServiceId, string> = {
  agentcore_runtime:
    'https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html',
  agentcore_memory:
    'https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html',
  agentcore_gateway:
    'https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html',
  agentcore_identity:
    'https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html',
  agentcore_browser:
    'https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html',
  agentcore_code_interpreter:
    'https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html',
  agentcore_observability:
    'https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html',
  agentcore_evaluations:
    'https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html',
  agentcore_policy:
    'https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html',
  bedrock_kb_managed:
    'https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html',
  bedrock_kb_customer_managed:
    'https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html',
  bedrock_foundation_models:
    'https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html',
  bedrock_guardrails:
    'https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html',
  opensearch_serverless:
    'https://docs.aws.amazon.com/opensearch-service/latest/developerguide/serverless.html',
  aurora_pgvector:
    'https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/AuroraPostgreSQL.VectorDB.html',
  neptune:
    'https://docs.aws.amazon.com/neptune-analytics/latest/userguide/what-is-neptune-analytics.html',
  s3: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html',
  iam: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html',
  cloudwatch:
    'https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html',
  strands_sdk: 'https://strandsagents.com/',
  strands_agents_tools: 'https://strandsagents.com/',
  mcp: 'https://modelcontextprotocol.io/',
}

const VOLATILITY: Record<AwsServiceId, Volatility> = {
  // AgentCore is the newest surface — treat its exact APIs/CLI as volatile.
  agentcore_runtime: 'volatile',
  agentcore_memory: 'volatile',
  agentcore_gateway: 'volatile',
  agentcore_identity: 'volatile',
  agentcore_browser: 'volatile',
  agentcore_code_interpreter: 'volatile',
  agentcore_observability: 'volatile',
  agentcore_evaluations: 'volatile',
  agentcore_policy: 'volatile',
  // Bedrock KB / Guardrails: concepts stable, config/params evolve.
  bedrock_kb_managed: 'moderate',
  bedrock_kb_customer_managed: 'moderate',
  bedrock_guardrails: 'moderate',
  bedrock_foundation_models: 'stable',
  // Data stores: mature.
  opensearch_serverless: 'stable',
  aurora_pgvector: 'stable',
  neptune: 'moderate',
  s3: 'stable',
  iam: 'stable',
  cloudwatch: 'stable',
  // Frameworks/protocols evolve at their own pace.
  strands_sdk: 'moderate',
  strands_agents_tools: 'moderate',
  mcp: 'moderate',
}

/** The verification record for a single AWS service. */
export const VERIFICATION: Record<AwsServiceId, VerificationRecord> =
  Object.fromEntries(
    (Object.keys(AWS_SERVICES) as AwsServiceId[]).map((id) => [
      id,
      { lastVerified: VERIFIED, sourceUrl: DOC[id], volatility: VOLATILITY[id] },
    ]),
  ) as Record<AwsServiceId, VerificationRecord>

const RANK: Record<Volatility, number> = { stable: 0, moderate: 1, volatile: 2 }

export function volatilityLabel(v: Volatility): string {
  return v === 'stable'
    ? 'Stable syntax'
    : v === 'moderate'
      ? 'Syntax may drift'
      : 'Fast-changing syntax'
}

/** True when a service's syntax is likely to drift (drives verify callouts). */
export function needsVerify(id: AwsServiceId): boolean {
  return VOLATILITY[id] !== 'stable'
}

/**
 * Summarize verification for a set of services: worst-case volatility, earliest
 * verified date, and the most-volatile service's doc as the representative link.
 * This is what code blocks badge themselves with.
 */
export function verificationForServices(
  ids: AwsServiceId[],
): VerificationRecord | null {
  const records = ids.map((id) => VERIFICATION[id]).filter(Boolean)
  if (records.length === 0) return null
  let worst = records[0]
  let earliest = records[0].lastVerified
  for (const r of records) {
    if (RANK[r.volatility] > RANK[worst.volatility]) worst = r
    if (r.lastVerified < earliest) earliest = r.lastVerified
  }
  return {
    lastVerified: earliest,
    sourceUrl: worst.sourceUrl,
    volatility: worst.volatility,
  }
}
