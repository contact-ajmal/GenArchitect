import JSZip from 'jszip'
import type { CodeLanguage } from '../types'
import type { RagComposition } from '../compose/composition'
import {
  DATA_SOURCE_LABELS,
  VECTOR_STORE_LABELS,
} from '../compose/composition'
import { generateCode } from '../compose/generateCode'
import { nearestPattern } from '../compose/rules'
import { ARCHITECTURES } from '../data/architectures'

/**
 * Reference repo-scaffold export. Reuses the composer's code generation (never
 * duplicates it) and adds the project-level files (README, .env.example, infra
 * notes). Reference scaffolding only — not production-hardened, no secrets.
 */

export interface ScaffoldFile {
  path: string
  content: string
  language: CodeLanguage
}

const NOTICE = `> **Reference scaffold — read before running.** This project is generated for
> learning. It is *not* production-hardened, may not reflect the latest AWS
> syntax, and creates billable resources if deployed. Verify every command
> against current AWS documentation, review it, and never commit real secrets.
> GenArchitect is not affiliated with, sponsored by, or endorsed by AWS.`

function slug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'rag-agent'
  )
}

function readme(c: RagComposition): string {
  const near = nearestPattern(c)
  const arch = ARCHITECTURES[near.id]
  const sources = c.dataSources.map((s) => DATA_SOURCE_LABELS[s]).join(', ')
  const store =
    c.knowledgeBase === 'managed_kb'
      ? 'Managed Knowledge Base'
      : `Customer-managed vector store (${VECTOR_STORE_LABELS[c.vectorStore]})`

  return `# ${c.name || 'RAG agent'}

A reference scaffold for a Strands + Amazon Bedrock AgentCore RAG agent.

This composition most resembles **${arch.name}** — see its deep dive for the full
walkthrough and tradeoffs.

${NOTICE}

## What this is

- **Knowledge:** ${store}
- **Sources:** ${sources}
- **Retrieval:** ${c.retrievalMode === 'agentic_retrieval' ? 'agentic (multi-hop)' : 'single-shot'}${c.reranking ? ' + reranking' : ''}
- **Reasoning:** ${c.orchestration === 'multi_agent' ? 'multi-agent (supervisor + specialists)' : 'single agent'}
- **Memory:** ${c.memory}
- **Security:** ${c.guardrails ? 'Guardrails' : 'no guardrails'}, ${c.accessControl === 'document_acls' ? 'per-user ACLs' : 'no ACLs'}${c.gateway ? ', Gateway' : ''}
- **Deploy:** ${c.deployTarget === 'agentcore_runtime' ? 'AgentCore Runtime' : 'local'}${c.observability ? ', Observability' : ''}${c.evaluations ? ', Evaluations' : ''}

## Prerequisites

- An AWS account with Bedrock model access enabled in your region.
- AWS credentials configured locally; Python 3.10+.

## Setup

\`\`\`bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your own values — never commit .env
python agent.py
\`\`\`

See **NOTES.md** for the AWS resources to create (Knowledge Base, data sources,
IAM roles${c.guardrails ? ', Guardrails' : ''}).
`
}

function envExample(c: RagComposition): string {
  const lines = [
    '# Copy to .env and fill in your own values. NEVER commit real secrets.',
    'AWS_REGION=us-west-2',
    'BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0',
    'KNOWLEDGE_BASE_ID=REPLACE_ME',
  ]
  if (c.guardrails) lines.push('GUARDRAIL_ID=REPLACE_ME', 'GUARDRAIL_VERSION=DRAFT')
  if (c.memory !== 'none') lines.push('MEMORY_ID=REPLACE_ME')
  if (c.gateway || c.multiKb) lines.push('GATEWAY_URL=REPLACE_ME')
  return lines.join('\n') + '\n'
}

function notes(c: RagComposition): string {
  const steps = [
    `1. Create the ${c.knowledgeBase === 'managed_kb' ? 'Managed Knowledge Base' : `customer-managed vector store (${VECTOR_STORE_LABELS[c.vectorStore]})`} and note its ID.`,
    `2. Add data sources: ${c.dataSources.map((s) => DATA_SOURCE_LABELS[s]).join(', ')}. Run an ingestion job.`,
    '3. Create an IAM role for the agent with least-privilege access to the KB and models.',
  ]
  if (c.gateway || c.multiKb)
    steps.push('4. Configure an AgentCore Gateway target for each knowledge base (MCP).')
  if (c.guardrails)
    steps.push('5. Create a Bedrock Guardrail (PII, denied topics) and note its ID/version.')
  if (c.accessControl === 'document_acls')
    steps.push('6. Ensure connectors carry access-control metadata for per-user ACL filtering.')
  if (c.deployTarget === 'agentcore_runtime')
    steps.push('7. Deploy to AgentCore Runtime (see deploy.sh).')
  if (c.observability || c.evaluations)
    steps.push('8. Enable Observability and/or Evaluations (see observe.sh).')

  return `# Infrastructure notes

Full IaC is out of scope for this reference scaffold — these are the AWS
resources to create, as steps. Verify each against current AWS documentation.

${steps.join('\n')}

> A CloudFormation/Terraform stack is intentionally omitted here; treat the
> above as the checklist to translate into your own IaC.
`
}

/** Assemble the in-memory file map for a composition (reuses generateCode). */
export function buildScaffold(c: RagComposition): ScaffoldFile[] {
  const files: ScaffoldFile[] = generateCode(c).map((f) => ({
    path: f.filename,
    content: f.code,
    language: f.language,
  }))
  files.unshift({ path: 'README.md', content: readme(c), language: 'bash' })
  files.push({ path: '.env.example', content: envExample(c), language: 'bash' })
  files.push({ path: 'NOTES.md', content: notes(c), language: 'bash' })
  return files
}

/** Zip the file map under a project root folder. */
export async function zipScaffold(
  files: ScaffoldFile[],
  rootName: string,
): Promise<Blob> {
  const zip = new JSZip()
  const root = zip.folder(rootName) ?? zip
  for (const f of files) root.file(f.path, f.content)
  return zip.generateAsync({ type: 'blob' })
}

export function scaffoldRootName(c: RagComposition): string {
  return slug(c.name)
}

/** Trigger a client-side download of a Blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
