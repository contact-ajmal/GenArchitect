import type {
  AwsServiceId,
  DifficultyTier,
  RagArchitectureId,
} from '../types'
import type { RagComposition } from '../compose/composition'

/**
 * The notebook model. Notebooks are never hand-authored as .ipynb JSON — they
 * are assembled from typed cells (this file), whose code comes from the Phase 10
 * composer fragments, and compiled to nbformat-4 JSON by compile.ts. One source
 * of truth → many templates → no drift.
 */

export type NotebookLang = 'python' | 'bash'

export interface MarkdownCell {
  kind: 'markdown'
  source: string
}

export interface CodeCell {
  kind: 'code'
  source: string
  language: NotebookLang
  /** Renders a cost admonition before the cell (creates billable resources). */
  costWarning?: boolean
  /** Services whose syntax is volatile — renders a verify-against-docs link. */
  verifyServices?: AwsServiceId[]
}

export type NotebookCell = MarkdownCell | CodeCell

/** A use-case flavor that re-skins a base notebook for a domain. */
export interface UseCaseFlavor {
  id: string
  name: string
  industry: string
  description: string
  /** What documents this scenario retrieves over (synthetic, adaptable). */
  corpusDescription: string
  sampleQuestions: string[]
  domainConsiderations: string[]
  /** Flavor-appropriate addition to the agent's system prompt. */
  systemPromptHint: string
  /** Example S3 location for the corpus (placeholder). */
  bucketExample: string
  /** What to change to point the notebook at your own corpus. */
  adaptNote: string
  /**
   * Optional composition overrides the flavor forces regardless of the base
   * pattern — so domain needs genuinely shape the code (e.g. healthcare always
   * gets Guardrails + ACLs). Applied and normalized in buildNotebookDefinition.
   */
  compositionPatch?: Partial<RagComposition>
}

export interface NotebookDefinition {
  id: string
  title: string
  description: string
  patternId: RagArchitectureId
  useCaseFlavorId: string
  difficulty: DifficultyTier
  estimatedTime: string
  awsServiceIds: AwsServiceId[]
  prerequisites: string[]
  tags: string[]
  /** The composition the notebook's code derives from (composer fragments). */
  composition: RagComposition
  /** The use-case flavor shaping narrative, corpus, and questions. */
  flavor: UseCaseFlavor
}

/* Helpers for building cells succinctly. */
export function md(source: string): MarkdownCell {
  return { kind: 'markdown', source }
}

export function py(
  source: string,
  opts: Omit<CodeCell, 'kind' | 'source' | 'language'> = {},
): CodeCell {
  return { kind: 'code', language: 'python', source, ...opts }
}

export function sh(
  source: string,
  opts: Omit<CodeCell, 'kind' | 'source' | 'language'> = {},
): CodeCell {
  return { kind: 'code', language: 'bash', source, ...opts }
}
