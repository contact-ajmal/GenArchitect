import type {
  Industry,
  RagArchitectureId,
  UseCaseData,
  UseCaseEntry,
} from '../types'
import rawUseCases from '../../data/usecases.json'

/**
 * Build-time use-case data (static, hand-curated JSON). No runtime fetch — the
 * library reads only what was curated from public case studies.
 */
export const USE_CASE_DATA = rawUseCases as unknown as UseCaseData
export const USE_CASES: UseCaseEntry[] = USE_CASE_DATA.useCases ?? []
export const USE_CASES_GENERATED_AT = USE_CASE_DATA.generatedAt

/** Human labels for the industry enum. */
export const INDUSTRY_LABELS: Record<Industry, string> = {
  'financial-services': 'Financial services',
  insurance: 'Insurance',
  healthcare: 'Healthcare',
  'life-sciences': 'Life sciences',
  'retail-ecommerce': 'Retail & e-commerce',
  manufacturing: 'Manufacturing',
  telecom: 'Telecom',
  'media-entertainment': 'Media & entertainment',
  'software-technology': 'Software & technology',
  'customer-service': 'Customer service',
  'marketing-advertising': 'Marketing & advertising',
  'professional-services': 'Professional services',
  'public-sector': 'Public sector',
  'energy-utilities': 'Energy & utilities',
  'travel-logistics': 'Travel & logistics',
  cybersecurity: 'Cybersecurity',
  'cross-industry': 'Cross-industry',
}

/** Industries present in the data, in label order. */
export function industriesInUse(): Industry[] {
  const present = new Set(USE_CASES.map((u) => u.industry))
  return (Object.keys(INDUSTRY_LABELS) as Industry[]).filter((i) => present.has(i))
}

/** Distinct AWS services across all use cases, sorted. */
export function servicesInUse(): string[] {
  return [...new Set(USE_CASES.flatMap((u) => u.services))].sort()
}

/** Use cases that map to a given RAG/agent pattern. */
export function useCasesForPattern(
  id: RagArchitectureId,
  limit = 3,
): UseCaseEntry[] {
  return USE_CASES.filter((u) => u.relatedPatternIds?.includes(id)).slice(0, limit)
}
