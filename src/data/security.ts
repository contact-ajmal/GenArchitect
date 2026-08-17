import type { AwsServiceId, CodeLanguage } from '../types'

/**
 * Security & compliance content for the /security track, grounded in real AWS
 * mechanisms. Each control maps to a component in the guardrailed_secure_rag
 * diagram so it can be highlighted, and links to the failure mode that occurs
 * without it. Reference-only, verify-flagged.
 */

export interface SecurityCodeFragment {
  language: CodeLanguage
  filename: string
  code: string
}

export interface SecurityControl {
  id: string
  title: string
  plain: string
  technical: string
  /** Diagram component ids (in guardrailed_secure_rag) this control covers. */
  components: string[]
  awsServiceIds: AwsServiceId[]
  whatItProtects: string
  whatBreaksWithout: string
  /** Failure mode id that manifests without this control. */
  failureModeId?: string
  meridian: string
  fragment?: SecurityCodeFragment
}

const BANNER = '# Reference implementation — verify exact syntax against current AWS docs.'

export const SECURITY_CONTROLS: SecurityControl[] = [
  {
    id: 'document_acls',
    title: 'Document-level access control (per-user ACLs)',
    plain:
      'Each user only ever retrieves passages from documents they are allowed to see.',
    technical:
      'A Managed Knowledge Base carries access-control metadata from connectors (e.g. SharePoint). Retrieval is filtered by the caller’s groups, so unauthorized passages are never fetched — access is enforced at retrieval time, not after generation.',
    components: ['acl_filter', 'kb_index'],
    awsServiceIds: ['bedrock_kb_managed', 'iam'],
    whatItProtects: 'Confidential documents from surfacing to unauthorized users.',
    whatBreaksWithout:
      'Any indexed content can reach any user — a data-leakage and compliance failure.',
    failureModeId: 'no_acls',
    meridian:
      'A Meridian support agent must never retrieve restricted legal or compliance material scoped to other roles.',
    fragment: {
      language: 'python',
      filename: 'acl_retrieve.py',
      code: `${BANNER}
resp = kb.retrieve(
    knowledgeBaseId=KB_ID,
    retrievalQuery={"text": query},
    retrievalConfiguration={
        "vectorSearchConfiguration": {
            # Enforce per-user access at retrieval time.
            "filter": {"in": {"key": "acl_group", "value": user["groups"]}}
        }
    },
)
`,
    },
  },
  {
    id: 'guardrails',
    title: 'Safety & PII with Bedrock Guardrails',
    plain:
      'Inputs and outputs are screened for unsafe content and personal data is redacted.',
    technical:
      'A Bedrock Guardrail applies denied topics, content filters, sensitive-information (PII) detection/redaction, and contextual grounding checks to both the prompt and the response, consistently across models and agents.',
    components: ['guardrails', 'llm'],
    awsServiceIds: ['bedrock_guardrails', 'bedrock_foundation_models'],
    whatItProtects: 'Users and the business from PII leakage and unsafe or off-topic output.',
    whatBreaksWithout: 'The assistant can emit PII or answer disallowed requests.',
    failureModeId: 'no_guardrails',
    meridian:
      'For a financial-services assistant, emitting customer PII or unvetted advice is a reportable incident.',
    fragment: {
      language: 'python',
      filename: 'guardrail.py',
      code: `${BANNER}
model = BedrockModel(
    model_id="anthropic.claude-3-5-sonnet-20241022-v2:0",
    guardrail_id="gr-meridian-01",
    guardrail_version="DRAFT",
)
`,
    },
  },
  {
    id: 'iam_gateway',
    title: 'Identity & least privilege via Gateway + IAM',
    plain:
      'The agent acts with tightly-scoped credentials and can only reach the tools and data it’s permitted to.',
    technical:
      'AgentCore Gateway centralizes authentication and authorization for tools/KBs; AgentCore Identity issues scoped credentials; IAM enforces least-privilege permissions; AgentCore Policy bounds which tools/actions are allowed.',
    components: ['gateway', 'identity', 'iam', 'policy'],
    awsServiceIds: ['agentcore_gateway', 'agentcore_identity', 'iam', 'agentcore_policy'],
    whatItProtects: 'Against an over-privileged agent reaching data or actions beyond its mandate.',
    whatBreaksWithout:
      'Broad, shared credentials mean a prompt or bug can access anything the agent could.',
    meridian:
      'Each Meridian tool and knowledge base is reachable only by callers whose identity permits it, centrally and auditably.',
  },
  {
    id: 'data_residency',
    title: 'Data residency — data stays in AWS',
    plain: 'Documents and inference stay inside your AWS environment.',
    technical:
      'Retrieval and generation run within your account and region; no corpus or prompts are sent to third-party model providers. This matters for regulated industries with data-residency obligations.',
    components: ['src', 'kb_index', 'llm'],
    awsServiceIds: ['bedrock_foundation_models', 's3'],
    whatItProtects: 'Regulatory data-residency and confidentiality requirements.',
    whatBreaksWithout: 'Sending sensitive content to external services can breach policy or law.',
    meridian:
      'Meridian’s constraint that all data and inference stay within AWS is a hard regulatory requirement.',
  },
  {
    id: 'auditability',
    title: 'Auditability via Observability',
    plain: 'Every answer can be reconstructed — which sources, tools, and user.',
    technical:
      'AgentCore Observability emits OpenTelemetry traces and metrics to CloudWatch: the execution path, tool calls, retrieval steps, tokens, and latency. These records support audit and incident review.',
    components: ['observability', 'cloudwatch', 'evaluations'],
    awsServiceIds: ['agentcore_observability', 'cloudwatch', 'agentcore_evaluations'],
    whatItProtects: 'The ability to answer an auditor’s “why did it say that?”.',
    whatBreaksWithout: 'You cannot prove what happened, or detect regressions before users do.',
    failureModeId: 'no_observability',
    meridian:
      'Meridian’s auditors expect a reconstructable trail for any answer the assistant produced.',
  },
  {
    id: 'prompt_injection',
    title: 'Prompt injection / retrieval poisoning',
    plain:
      'Untrusted content that gets retrieved can try to hijack the agent’s instructions.',
    technical:
      'Retrieved passages are a threat surface: malicious text in a document can attempt to override the system prompt or exfiltrate data. Mitigations layer up — guardrails on output, trusting only vetted sources, keeping tool permissions least-privilege, and validating outputs before acting.',
    components: ['guardrails', 'acl_filter'],
    awsServiceIds: ['bedrock_guardrails', 'iam'],
    whatItProtects: 'Against the agent following instructions hidden in retrieved content.',
    whatBreaksWithout:
      'A poisoned document can steer answers or trigger unintended tool actions.',
    meridian:
      'Meridian ingests documents from many teams; treating retrieved text as untrusted input is essential.',
  },
]

export interface ChecklistItem {
  id: string
  text: string
  detail?: string
}

export const COMPLIANCE_CHECKLIST: ChecklistItem[] = [
  {
    id: 'acls',
    text: 'Per-user access is enforced at retrieval time (document-level ACLs), not after generation.',
  },
  {
    id: 'guardrails',
    text: 'Bedrock Guardrails are configured for PII redaction, denied topics, and grounding checks.',
  },
  {
    id: 'least_privilege',
    text: 'The agent’s IAM role is least-privilege and scoped per tool/knowledge base via Gateway.',
  },
  {
    id: 'residency',
    text: 'All data and inference stay within the required AWS account/region; no third-party egress.',
  },
  {
    id: 'audit',
    text: 'Observability traces + logs are retained sufficiently to reconstruct any answer for audit.',
  },
  {
    id: 'citations',
    text: 'Every answer cites its source documents, and grounding is verified.',
  },
  {
    id: 'injection',
    text: 'Retrieved content is treated as untrusted; outputs are validated before any action.',
  },
  {
    id: 'evals',
    text: 'An evaluation suite gates changes, and quality/safety metrics are monitored.',
  },
  {
    id: 'secrets',
    text: 'No secrets in code or prompts; credentials are managed by Identity/IAM.',
  },
]
