import type { AwsServiceCategory, DifficultyTier, ReferenceKind } from '../types'
import type { PillVariant } from '../components/ui'

/** Human labels + ordering for difficulty tiers. */
export const DIFFICULTY_LABELS: Record<DifficultyTier, string> = {
  foundational: 'Foundational',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  production: 'Production',
}

export const DIFFICULTY_ORDER: DifficultyTier[] = [
  'foundational',
  'intermediate',
  'advanced',
  'production',
]

export function difficultyRank(tier: DifficultyTier): number {
  return DIFFICULTY_ORDER.indexOf(tier)
}

/** Map an AWS service category to a metadata pill variant. */
export function serviceVariant(category: AwsServiceCategory): PillVariant {
  if (category === 'agentcore' || category === 'bedrock') return 'managed'
  if (category === 'framework') return 'self-managed'
  return 'aws'
}

/** Human labels for reference kinds (used to group the references section). */
export const REFERENCE_KIND_LABELS: Record<ReferenceKind, string> = {
  'aws-docs': 'AWS documentation',
  'api-reference': 'API reference',
  'aws-blog': 'AWS blog',
  workshop: 'Workshops',
  github: 'Source & protocols',
  whitepaper: 'Whitepapers',
}
