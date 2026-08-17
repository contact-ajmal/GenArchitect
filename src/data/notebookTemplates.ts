import type { DifficultyTier, RagArchitectureId } from '../types'
import { ARCHITECTURES } from './architectures'
import { compositionFromPattern, type RagComposition } from '../compose/composition'
import { nearestPattern, normalizeComposition } from '../compose/rules'
import type { NotebookDefinition, UseCaseFlavor } from '../notebooks/model'

/**
 * The template catalog: 6 use-case flavors and a curated FEATURED set of
 * notebook definitions. Every pattern and every flavor appears at least once;
 * pairings are chosen sensibly. Any pattern × flavor is generatable on demand
 * via buildNotebookDefinition — featured ones are curated, the rest mechanical.
 */

export const FLAVORS: Record<string, UseCaseFlavor> = {
  meridian: {
    id: 'meridian',
    name: 'Internal knowledge assistant',
    industry: 'Financial services',
    description:
      'The canonical scenario: Meridian Financial Services staff ask grounded questions over internal policy, product, and compliance documents.',
    corpusDescription:
      'HR and expense policies, product and pricing sheets, and compliance/regulatory guidance (a synthetic sample staged in S3).',
    sampleQuestions: [
      'What is our travel expense reimbursement limit?',
      'How long do we retain EU client records?',
      'Which compliance rules apply to a new EU savings product?',
    ],
    domainConsiderations: [
      'Per-user access control over sensitive compliance material.',
      'Auditability — every answer traceable to a source document.',
      'Data and inference stay within AWS for regulatory reasons.',
    ],
    systemPromptHint:
      "You are Meridian's internal knowledge assistant. Answer only from retrieved, authorized documents and cite every source.",
    bucketExample: 's3://meridian-corpus',
    adaptNote:
      'Swap the Meridian sample corpus for your own policy/product/compliance documents.',
  },
  customer_support: {
    id: 'customer_support',
    name: 'Customer support / helpdesk',
    industry: 'Customer support',
    description:
      'Deflect repetitive tickets by answering customers from the help center and product docs, with a clean path to escalate when unsure.',
    corpusDescription:
      'Help-center articles, product manuals, troubleshooting guides, and FAQs (synthetic sample in S3).',
    sampleQuestions: [
      'How do I reset my password?',
      'Why is my export failing with a 403 error?',
      'What are the limits on the Team plan?',
    ],
    domainConsiderations: [
      'Deflection: answer common questions without a human agent.',
      'Escalation: when context is insufficient, hand off rather than guess.',
      'Freshness: help articles change often — keep the index current.',
    ],
    systemPromptHint:
      'You are a support assistant. Answer from the help center and cite the article. If the answer is not covered, say so and offer to escalate to a human.',
    bucketExample: 's3://support-kb',
    adaptNote: 'Point the data source at your help-center export and product docs.',
  },
  legal: {
    id: 'legal',
    name: 'Legal & contracts intelligence',
    industry: 'Legal',
    description:
      'Answer questions across contracts and regulations with clause-level precision and exact citations.',
    corpusDescription:
      'Contracts, master agreements, regulatory texts, and internal legal memos (synthetic sample in S3).',
    sampleQuestions: [
      'What is the termination notice period in the MSA?',
      'Which contracts reference the 2026 data-protection clause?',
      'What are our liability caps across active vendor agreements?',
    ],
    domainConsiderations: [
      'Citation precision — answers must cite the exact clause.',
      'Clause-level chunking so provisions are retrievable as units.',
      'Relationship traversal across agreements benefits from GraphRAG.',
    ],
    systemPromptHint:
      'You are a legal research assistant. Cite the exact clause and document for every statement. Never infer terms that are not written; flag ambiguity.',
    bucketExample: 's3://legal-corpus',
    adaptNote: 'Replace the sample contracts with your own agreement set.',
    // Legal answers demand precision — always over-fetch + rerank.
    compositionPatch: { reranking: true },
  },
  healthcare: {
    id: 'healthcare',
    name: 'Healthcare document assistant',
    industry: 'Healthcare',
    description:
      'Answer clinicians and staff from clinical guidelines and policies — with heightened PII protection and compliance emphasis.',
    corpusDescription:
      'Clinical guidelines, care protocols, formularies, and administrative policies (synthetic, de-identified sample in S3).',
    sampleQuestions: [
      'What is the standard dosing guideline for condition X?',
      'What is our policy on releasing records to a third party?',
      'Which protocol applies to post-operative monitoring?',
    ],
    domainConsiderations: [
      'Heightened PII/PHI protection — Guardrails for redaction are essential.',
      'Access control by role (clinical vs administrative).',
      'Compliance note: this is illustrative, not medical or legal advice; validate against your obligations.',
    ],
    systemPromptHint:
      'You are a clinical documentation assistant. Answer only from approved guidelines, cite them, and never output patient-identifying information. Defer to clinicians for medical judgment.',
    bucketExample: 's3://clinical-guidelines',
    adaptNote:
      'Use your own de-identified guidelines; ensure PHI handling meets your compliance program.',
    // Healthcare always gets PII Guardrails + per-user access, whatever the base pattern.
    compositionPatch: { guardrails: true, accessControl: 'document_acls' },
  },
  developer_docs: {
    id: 'developer_docs',
    name: 'Developer documentation assistant',
    industry: 'Developer tools',
    description:
      'Answer developer questions from API references and guides, with attention to versioned, fast-changing docs.',
    corpusDescription:
      'API references, SDK guides, changelogs, and how-to docs across versions (synthetic sample in S3).',
    sampleQuestions: [
      'How do I authenticate a request in the v3 SDK?',
      'What changed between v2 and v3 of the billing API?',
      'Which endpoints support cursor pagination?',
    ],
    domainConsiderations: [
      'Freshness & versioning — docs change every release; keep the index current.',
      'Version-aware retrieval so answers match the user’s SDK version.',
      'Relationship traversal (endpoint → guide → changelog) suits GraphRAG.',
    ],
    systemPromptHint:
      'You are a developer-docs assistant. Cite the exact doc and version. If the answer is version-specific, state which version it applies to.',
    bucketExample: 's3://dev-docs',
    adaptNote: 'Point at your own docs export; include version metadata for filtering.',
  },
  hr_policy: {
    id: 'hr_policy',
    name: 'HR & policy assistant',
    industry: 'Human resources',
    description:
      'Answer employees from HR policies and benefits documents, respecting who is allowed to see what.',
    corpusDescription:
      'Employee handbook, benefits guides, leave and conduct policies, and manager-only documents (synthetic sample in S3).',
    sampleQuestions: [
      'How many days of parental leave am I entitled to?',
      'What is the process to request a role change?',
      'What does our relocation policy cover?',
    ],
    domainConsiderations: [
      'Access control — manager-only or region-specific policies must not leak.',
      'Personalization by role/region benefits from long-term memory.',
      'Clarity: HR answers must be unambiguous and cited.',
    ],
    systemPromptHint:
      'You are an HR policy assistant. Answer only from policies the employee is authorized to see, cite them, and be precise about eligibility and process.',
    bucketExample: 's3://hr-policies',
    adaptNote: 'Replace with your handbook and benefits documents; set access metadata.',
    // HR must respect who-can-see-what — force per-user access control.
    compositionPatch: { accessControl: 'document_acls' },
  },
}

export const FLAVOR_LIST = Object.values(FLAVORS)

const EST_TIME: Record<DifficultyTier, string> = {
  foundational: '~20 min',
  intermediate: '~30 min',
  advanced: '~45 min',
  production: '~60 min',
}

/** Build a full NotebookDefinition for any pattern × flavor. */
export function buildNotebookDefinition(
  patternId: RagArchitectureId,
  flavor: UseCaseFlavor,
): NotebookDefinition {
  const arch = ARCHITECTURES[patternId]
  const composition = normalizeComposition({
    ...compositionFromPattern(patternId),
    ...(flavor.compositionPatch ?? {}),
  })
  return {
    id: `${patternId}__${flavor.id}`,
    title: `${arch.name} — ${flavor.name}`,
    description: `An end-to-end reference notebook: ${arch.tagline} Applied to the ${flavor.name.toLowerCase()} scenario (${flavor.industry}).`,
    patternId,
    useCaseFlavorId: flavor.id,
    difficulty: arch.difficulty,
    estimatedTime: EST_TIME[arch.difficulty],
    awsServiceIds: arch.awsServiceIds,
    prerequisites: [
      'An AWS account with Bedrock model access enabled in your region.',
      'AWS credentials configured locally; Python 3.10+.',
    ],
    tags: [patternId, flavor.id, arch.difficulty],
    composition,
    flavor,
  }
}

/**
 * Build a notebook from an arbitrary composition (the composer's exact choices),
 * not just a catalog preset. Used by "export as notebook" and the scaffold's
 * include-notebook toggle. Metadata borrows the nearest pattern.
 */
export function buildNotebookFromComposition(
  composition: RagComposition,
  flavor: UseCaseFlavor,
): NotebookDefinition {
  const patternId = nearestPattern(composition).id
  const arch = ARCHITECTURES[patternId]
  return {
    id: `${patternId}__${flavor.id}-custom`,
    title: `${composition.name || arch.name} (custom) — ${flavor.name}`,
    description: `A notebook generated from your composition (resembles ${arch.name}), applied to the ${flavor.name.toLowerCase()} scenario.`,
    patternId,
    useCaseFlavorId: flavor.id,
    difficulty: arch.difficulty,
    estimatedTime: EST_TIME[arch.difficulty],
    awsServiceIds: arch.awsServiceIds,
    prerequisites: [
      'An AWS account with Bedrock model access enabled in your region.',
      'AWS credentials configured locally; Python 3.10+.',
    ],
    tags: [patternId, flavor.id, 'custom'],
    composition,
    flavor,
  }
}

/** Reconstruct a definition from its id (`pattern__flavor`). */
export function definitionFromId(id: string): NotebookDefinition | null {
  const [patternId, flavorId] = id.split('__')
  if (!patternId || !flavorId) return null
  if (!(patternId in ARCHITECTURES)) return null
  const flavor = FLAVORS[flavorId]
  if (!flavor) return null
  return buildNotebookDefinition(patternId as RagArchitectureId, flavor)
}

/** Curated featured pairings — every pattern and flavor appears at least once. */
const FEATURED_PAIRS: [RagArchitectureId, string][] = [
  ['naive_rag', 'developer_docs'],
  ['managed_kb_rag', 'customer_support'],
  ['managed_kb_rag', 'meridian'],
  ['hybrid_rerank_rag', 'legal'],
  ['hybrid_rerank_rag', 'meridian'],
  ['agentic_rag', 'meridian'],
  ['agentic_rag', 'customer_support'],
  ['multi_kb_agentic_rag', 'legal'],
  ['multi_kb_agentic_rag', 'meridian'],
  ['graph_rag', 'legal'],
  ['graph_rag', 'developer_docs'],
  ['memory_augmented_rag', 'hr_policy'],
  ['memory_augmented_rag', 'meridian'],
  ['multi_agent_rag', 'meridian'],
  ['multi_agent_rag', 'healthcare'],
  ['guardrailed_secure_rag', 'healthcare'],
  ['guardrailed_secure_rag', 'meridian'],
  ['guardrailed_secure_rag', 'hr_policy'],
]

export const FEATURED_NOTEBOOKS: NotebookDefinition[] = FEATURED_PAIRS.map(
  ([p, f]) => buildNotebookDefinition(p, FLAVORS[f]),
)

/** Notebooks featured for a given architecture (for detail-page cross-links). */
export function notebooksForPattern(id: RagArchitectureId): NotebookDefinition[] {
  return FEATURED_NOTEBOOKS.filter((n) => n.patternId === id)
}
