import type { CaseStudyDeepDive } from '../../types'
import { bridgewaterAia } from './bridgewater-aia'

/**
 * Case-study deep dives, keyed by the UseCaseEntry id they expand.
 *
 * Most entries in the use-case library stay cards — a company, a line, a
 * source. A deep dive is reserved for deployments where enough has been said
 * publicly to reconstruct an architecture honestly. If the sources only
 * support a paragraph, it stays a card.
 */
export const CASE_STUDIES: Record<string, CaseStudyDeepDive> = {
  [bridgewaterAia.useCaseId]: bridgewaterAia,
}

export function caseStudyFor(useCaseId: string): CaseStudyDeepDive | undefined {
  return CASE_STUDIES[useCaseId]
}

export function hasDeepDive(useCaseId: string): boolean {
  return useCaseId in CASE_STUDIES
}
