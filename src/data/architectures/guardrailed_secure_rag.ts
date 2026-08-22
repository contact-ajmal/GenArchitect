import type { RagArchitecture } from '../../types'

const SECURE_PY = `from strands import Agent, tool
from strands.models import BedrockModel
import boto3

# Reference implementation — verify against current AWS docs.
kb = boto3.client("bedrock-agent-runtime")
KB_ID = "MERIDIANKB01"

# Bedrock Guardrails: PII redaction, denied topics, grounding checks.
model = BedrockModel(
    model_id="anthropic.claude-3-5-sonnet-20241022-v2:0",
    guardrail_id="gr-meridian-01",
    guardrail_version="DRAFT",
)

@tool
def retrieve(query: str, user: dict) -> list[dict]:
    """Retrieve ONLY documents this user may see (document-level ACLs)."""
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
    return [{"text": r["content"]["text"], "source": r["location"]} for r in resp["retrievalResults"]]

agent = Agent(
    model=model,
    system_prompt="Answer only from retrieved, authorized passages. Cite sources.",
    tools=[retrieve],
)
`

const OBSERVE_SH = `# Enable AgentCore Observability and run Evaluations.
# Reference implementation — verify against current AgentCore docs.

# Observability is OpenTelemetry-based; traces + metrics flow to CloudWatch.
export AGENTCORE_OBSERVABILITY_ENABLED=true

# Run an evaluation suite on a labeled dataset before promoting a change.
aws bedrock-agentcore start-evaluation \\
  --agent-runtime-id "meridian-supervisor" \\
  --dataset "s3://meridian-eval/policy-qa.jsonl"
`

export const guardrailedSecureRag: RagArchitecture = {
  id: 'guardrailed_secure_rag',
  name: 'Guardrailed Secure RAG',
  tagline: 'The enterprise end-state: safe, access-controlled, auditable, observed.',
  difficulty: 'production',
  family: 'rag',

  summary:
    'The complete enterprise pattern. Every earlier capability, hardened: Bedrock Guardrails screen inputs and outputs and redact PII; document-level ACLs ensure users only ever retrieve what they’re authorized to see; IAM and Identity via Gateway scope every access; and AgentCore Observability plus Evaluations make the whole system traceable, measurable, and auditable. This is where Meridian lands.',
  technicalSummary:
    'Security and observability become first-class layers. Bedrock Guardrails enforce input/output safety, denied topics, and contextual grounding, and detect/redact sensitive information. Retrieval is filtered by per-user access metadata (document-level ACLs) so authorization is enforced at retrieval time, not after generation. Gateway centralizes auth with IAM/Identity, and AgentCore Policy bounds which tools/actions the agent may use. AgentCore Observability emits OpenTelemetry traces and metrics to CloudWatch, and Evaluations gate quality regressions before promotion.',

  whenToUse: [
    'Regulated or sensitive corpora with per-user access requirements (Meridian’s reality).',
    'Any production assistant that must be safe, auditable, and monitored.',
    'When you need evidence — traces, metrics, evaluations — to satisfy compliance review.',
  ],
  whenNotToUse: [
    'Early prototypes where this much control is premature (start simpler, add these as you productionize).',
    'Fully public, non-sensitive content with no access or audit requirements.',
  ],
  enterpriseConsiderations: [
    'Security: enforce access at retrieval (ACLs) AND screen at generation (Guardrails) — defense in depth, not either/or.',
    'Auditability: traces to CloudWatch plus guardrail and compliance verdicts give a reconstructable record of every answer.',
    'Ops/cost: guardrails, ACL filtering, tracing, and evaluations add cost and latency — but are non-negotiable for regulated production.',
  ],

  layers: [
    { id: 'src', label: 'Corpora (with ACLs)', layer: 'sources', role: 'corpus', awsServiceId: 's3' },
    { id: 'kb_index', label: 'KB (ACL metadata)', layer: 'index', role: 'knowledge-base', awsServiceId: 'bedrock_kb_managed', note: 'document-level access metadata' },
    { id: 'acl_filter', label: 'Per-user ACL filter', layer: 'retrieval', role: 'access-filter', awsServiceId: 'bedrock_kb_managed', note: 'authorize at retrieval time' },
    { id: 'guardrails', label: 'Bedrock Guardrails', layer: 'guardrails', role: 'safety', awsServiceId: 'bedrock_guardrails', note: 'PII, denied topics, grounding' },
    { id: 'gateway', label: 'AgentCore Gateway', layer: 'orchestration', role: 'tool-gateway', awsServiceId: 'agentcore_gateway', note: 'central auth' },
    { id: 'identity', label: 'AgentCore Identity', layer: 'orchestration', role: 'identity', awsServiceId: 'agentcore_identity' },
    { id: 'iam', label: 'IAM (least privilege)', layer: 'orchestration', role: 'authz', awsServiceId: 'iam' },
    { id: 'policy', label: 'AgentCore Policy', layer: 'orchestration', role: 'action-policy', awsServiceId: 'agentcore_policy', note: 'bound tools/actions' },
    { id: 'agent', label: 'Strands agent', layer: 'orchestration', role: 'orchestrator', awsServiceId: 'strands_sdk' },
    { id: 'llm', label: 'LLM', layer: 'generation', role: 'generator', awsServiceId: 'bedrock_foundation_models' },
    { id: 'observability', label: 'AgentCore Observability', layer: 'observability', role: 'tracing', awsServiceId: 'agentcore_observability', note: 'traces + metrics' },
    { id: 'cloudwatch', label: 'CloudWatch', layer: 'observability', role: 'monitoring', awsServiceId: 'cloudwatch' },
    { id: 'evaluations', label: 'AgentCore Evaluations', layer: 'observability', role: 'evaluation', awsServiceId: 'agentcore_evaluations' },
  ],

  walkthrough: [
    {
      id: 'guardrails',
      order: 1,
      title: 'Screen inputs and outputs with Guardrails',
      plainExplanation:
        'Before and after the model runs, a safety layer blocks disallowed topics and unsafe content and redacts personal information.',
      technicalDetail:
        'Attach a Bedrock Guardrail to the model. It enforces content/topic filters, PII detection/redaction, and contextual grounding checks on both the prompt and the response.',
      diagramComponentIds: ['guardrails', 'llm'],
      codeSampleId: 'secure_py',
      codeHighlightRange: [[9, 14]],
      awsServiceIds: ['bedrock_guardrails', 'bedrock_foundation_models'],
      securityNotes: ['Guardrails are output-side defense; pair with retrieval-side ACLs below.'],
    },
    {
      id: 'acls',
      order: 2,
      title: 'Enforce per-user access at retrieval',
      plainExplanation:
        'The assistant only ever retrieves documents this specific employee is allowed to see — access is checked as it searches, not after.',
      technicalDetail:
        'Retrieval is filtered by the user’s access groups against document-level ACL metadata. Unauthorized passages are never retrieved, so they can never reach the model or the answer.',
      diagramComponentIds: ['acl_filter', 'kb_index', 'src'],
      codeSampleId: 'secure_py',
      codeHighlightRange: [[16, 29]],
      awsServiceIds: ['bedrock_kb_managed', 's3'],
      securityNotes: ['Authorizing at retrieval time is stronger than filtering generated text after the fact.'],
    },
    {
      id: 'identity',
      order: 3,
      title: 'Scope every access with Identity, IAM, and Policy',
      plainExplanation:
        'The agent acts with tightly-scoped credentials, and its allowed tools and actions are bounded — it can’t reach data or take actions outside its mandate.',
      technicalDetail:
        'Gateway centralizes authentication; AgentCore Identity issues scoped credentials; IAM enforces least privilege; AgentCore Policy constrains which tools/actions are permitted per role or context.',
      diagramComponentIds: ['gateway', 'identity', 'iam', 'policy', 'agent'],
      awsServiceIds: ['agentcore_gateway', 'agentcore_identity', 'iam', 'agentcore_policy'],
      securityNotes: ['Least privilege end to end: caller → agent → tools → data.'],
    },
    {
      id: 'observe',
      order: 4,
      title: 'Trace everything to CloudWatch',
      plainExplanation:
        'Every step — tool calls, retrievals, tokens, latency — is recorded so operators can watch, debug, and audit the assistant.',
      technicalDetail:
        'AgentCore Observability emits OpenTelemetry traces and metrics to CloudWatch, giving per-request trajectories and dashboards for ops and audit.',
      diagramComponentIds: ['observability', 'cloudwatch'],
      codeSampleId: 'observe_sh',
      codeHighlightRange: [[4, 5]],
      awsServiceIds: ['agentcore_observability', 'cloudwatch'],
    },
    {
      id: 'evaluate',
      order: 5,
      title: 'Gate quality with Evaluations',
      plainExplanation:
        'Before any change ships, the assistant is tested against known questions and answers to catch regressions.',
      technicalDetail:
        'AgentCore Evaluations runs the agent against a labeled dataset to measure accuracy and tool-use correctness, gating promotion on results.',
      diagramComponentIds: ['evaluations'],
      codeSampleId: 'observe_sh',
      codeHighlightRange: [[7, 10]],
      awsServiceIds: ['agentcore_evaluations'],
      costNotes: ['Run evaluations in CI on representative datasets, not on every request.'],
    },
  ],

  codeSamples: [
    {
      id: 'secure_py',
      title: 'Guardrails + document-level ACL retrieval',
      language: 'python',
      filename: 'secure_agent.py',
      code: SECURE_PY,
      explanation:
        'Defense in depth: a Guardrail on the model, and a per-user ACL filter on retrieval so unauthorized passages are never fetched. Guardrail config and KB metadata-filter syntax change often — verify against current AWS docs.',
      annotations: [
        {
          lineRange: [10, 14],
          whatItDoes:
            'Attaches a Bedrock Guardrail to the model — screening inputs and outputs and redacting PII.',
          mapsToDiagramComponentId: 'guardrails',
          docUrl:
            'https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html',
          verifyAgainstDocs: true,
        },
        {
          lineRange: [22, 27],
          whatItDoes:
            'Filters retrieval by the user’s access groups, so unauthorized passages are never fetched.',
          technicalNote:
            'Authorizing at retrieval time is stronger than filtering generated text afterwards. The exact filter syntax changes — verify.',
          mapsToDiagramComponentId: 'acl_filter',
          docUrl:
            'https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html',
          verifyAgainstDocs: true,
        },
      ],
    },
    {
      id: 'observe_sh',
      title: 'Enable Observability and run Evaluations',
      language: 'bash',
      filename: 'observe_and_eval.sh',
      code: OBSERVE_SH,
      explanation:
        'Tracing to CloudWatch and evaluation gating make the assistant auditable and regression-safe. Observability env vars and CLI commands change often — verify against current AgentCore docs.',
    },
  ],

  meridianStage: {
    stageTitle: 'Secure, auditable, observed — the end-state',
    whatItAdds:
      'Delivers Meridian’s production assistant: guardrailed and PII-safe, access-controlled per user, least-privilege via IAM/Gateway, and fully traced and evaluated for audit.',
    narrative:
      'Everything the earlier stages introduced now runs together under safety, access control, and observability — the assistant Meridian can put in front of regulated users with confidence.',
  },

  awsServiceIds: [
    'bedrock_guardrails',
    'bedrock_kb_managed',
    'agentcore_gateway',
    'agentcore_identity',
    'agentcore_policy',
    'agentcore_observability',
    'agentcore_evaluations',
    'iam',
    'cloudwatch',
    'bedrock_foundation_models',
    'strands_sdk',
    's3',
  ],

  references: [
    { label: 'Amazon Bedrock Guardrails', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html', kind: 'aws-docs' },
    { label: 'AWS IAM — introduction', url: 'https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html', kind: 'aws-docs' },
    { label: 'Amazon CloudWatch — what is CloudWatch', url: 'https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html', kind: 'aws-docs' },
    { label: 'Amazon Bedrock AgentCore — Observability (developer guide)', url: 'https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html', kind: 'aws-docs' },
  ],

  accentColor: '#DC2626',
}
