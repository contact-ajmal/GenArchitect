import type { AwsServiceId } from '../types'

/**
 * Single source of brand + positioning copy for GenArchitect. Keeping it here
 * (not scattered across components) means the AWS-architect positioning and the
 * legally-required disclaimer live in one place.
 *
 * TRADEMARK NOTE: AWS service names are used factually/nominatively only. We do
 * not use the AWS corporate logo, "Powered by AWS", or any partner badge, and
 * we imply no partnership, endorsement, or certification.
 */

export const BRAND = {
  name: 'GenArchitect',
  tagline: 'AWS agentic architecture studio',

  heroTitle: 'The AWS agentic architecture studio',
  heroPositioning:
    'Built for AWS solutions architects, GenAI platform teams, and enterprise architects designing RAG and agentic systems on AWS.',
  heroSubhead:
    'Nine RAG architectures, Amazon Bedrock AgentCore and Strands Agents taught visually, downloadable notebooks, and a composer that generates reference implementations.',

  /**
   * The non-affiliation disclaimer. Rendered in the footer and on the home page.
   * Do not soften or remove this text.
   */
  disclaimer:
    'GenArchitect is an independent educational tool, not affiliated with, endorsed by, or sponsored by Amazon Web Services. AWS and AWS service names are trademarks of Amazon.com, Inc. or its affiliates.',

  /**
   * Optional AWS Community Builder badge slot. Off by default. Only renders when
   * `enabled` is true AND you supply `assetPath` (a local SVG/PNG under
   * src/assets/). The badge must be used per the AWS Community Builders program's
   * usage rules — you are responsible for compliance if you enable it.
   */
  communityBuilder: {
    enabled: false,
    assetPath: '' as string, // e.g. '/src/assets/community-builder.svg'
    profileUrl: '' as string,
  },
}

/* --------------------------------------------------------------------------
 * AWS service coverage strip — the strongest positioning signal on the home
 * page. Official service names only; icons resolve from src/assets/aws-icons/.
 * `to` links into the most relevant app surface (atlases fill in as they ship).
 * ------------------------------------------------------------------------ */

export interface CoverageItem {
  /** Icon file base name in src/assets/aws-icons/<iconId>.svg (fallback if absent). */
  iconId: string
  /** Official service name — rendered in mono as a technical label. */
  name: string
  role: string
  to: string
}

export interface CoverageGroup {
  title: string
  note?: string
  items: CoverageItem[]
}

export const COVERAGE_GROUPS: CoverageGroup[] = [
  {
    title: 'Agent platform',
    note: 'Amazon Bedrock AgentCore',
    items: [
      { iconId: 'agentcore-runtime', name: 'AgentCore Runtime', role: 'Serverless, isolated agent hosting', to: '/agentcore' },
      { iconId: 'agentcore-memory', name: 'AgentCore Memory', role: 'Short- and long-term memory', to: '/agentcore' },
      { iconId: 'agentcore-gateway', name: 'AgentCore Gateway', role: 'APIs and KBs as MCP tools', to: '/agentcore' },
      { iconId: 'agentcore-identity', name: 'AgentCore Identity', role: 'Scoped agent credentials', to: '/agentcore' },
      { iconId: 'agentcore-browser', name: 'AgentCore Browser', role: 'Managed headless browser', to: '/agentcore' },
      { iconId: 'agentcore-code-interpreter', name: 'AgentCore Code Interpreter', role: 'Sandboxed code execution', to: '/agentcore' },
      { iconId: 'agentcore-observability', name: 'AgentCore Observability', role: 'Traces and metrics to CloudWatch', to: '/agentcore' },
      { iconId: 'agentcore-evaluations', name: 'AgentCore Evaluations', role: 'LLM-as-judge scoring', to: '/agentcore' },
      { iconId: 'agentcore-policy', name: 'AgentCore Policy', role: 'Action/tool guardrails', to: '/agentcore' },
    ],
  },
  {
    title: 'Models & grounding',
    items: [
      { iconId: 'amazon-bedrock', name: 'Amazon Bedrock', role: 'Foundation and embedding models', to: '/agentcore' },
      { iconId: 'bedrock-knowledge-bases', name: 'Amazon Bedrock Knowledge Bases', role: 'Managed + customer-managed RAG', to: '/architecture/managed_kb_rag' },
      { iconId: 'bedrock-guardrails', name: 'Amazon Bedrock Guardrails', role: 'Input/output safety and PII', to: '/security' },
    ],
  },
  {
    title: 'Vector & data',
    items: [
      { iconId: 'opensearch-service', name: 'Amazon OpenSearch Serverless', role: 'Vector + keyword search', to: '/catalog' },
      { iconId: 'aurora', name: 'Amazon Aurora PostgreSQL (pgvector)', role: 'Vectors alongside SQL', to: '/catalog' },
      { iconId: 'neptune', name: 'Amazon Neptune', role: 'Graph-augmented retrieval', to: '/architecture/graph_rag' },
      { iconId: 'simple-storage-service', name: 'Amazon S3', role: 'Source document store', to: '/catalog' },
    ],
  },
  {
    title: 'Security & ops',
    items: [
      { iconId: 'iam', name: 'AWS IAM', role: 'Least-privilege access', to: '/security' },
      { iconId: 'cognito', name: 'Amazon Cognito', role: 'Authentication (Cognito/JWT)', to: '/agentcore' },
      { iconId: 'cloudwatch', name: 'Amazon CloudWatch', role: 'Metrics, logs, dashboards', to: '/evaluate' },
      { iconId: 'lambda', name: 'AWS Lambda', role: 'Tool targets via Gateway', to: '/agentcore' },
    ],
  },
  {
    title: 'Framework',
    note: 'Open source, not a managed AWS service',
    items: [
      { iconId: 'strands', name: 'Strands Agents SDK', role: 'Open-source, Apache-2.0 agent SDK', to: '/strands' },
    ],
  },
]

/** Map an AwsServiceId (used across the app/diagrams) to an icon file base name. */
export const SERVICE_ICON_FILE: Record<AwsServiceId, string> = {
  agentcore_runtime: 'agentcore-runtime',
  agentcore_memory: 'agentcore-memory',
  agentcore_gateway: 'agentcore-gateway',
  agentcore_identity: 'agentcore-identity',
  agentcore_browser: 'agentcore-browser',
  agentcore_code_interpreter: 'agentcore-code-interpreter',
  agentcore_observability: 'agentcore-observability',
  agentcore_evaluations: 'agentcore-evaluations',
  agentcore_policy: 'agentcore-policy',
  bedrock_kb_managed: 'bedrock-knowledge-bases',
  bedrock_kb_customer_managed: 'bedrock-knowledge-bases',
  bedrock_foundation_models: 'amazon-bedrock',
  bedrock_guardrails: 'bedrock-guardrails',
  opensearch_serverless: 'opensearch-service',
  aurora_pgvector: 'aurora',
  neptune: 'neptune',
  s3: 'simple-storage-service',
  iam: 'iam',
  cloudwatch: 'cloudwatch',
  strands_sdk: 'strands',
  strands_agents_tools: 'strands',
  mcp: 'mcp',
}
