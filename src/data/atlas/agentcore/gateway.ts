import type { AtlasSection, AtlasTopic } from '../../../atlas/types'

const S = 'gateway'
const DOCS =
  'https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html'

type T = Omit<AtlasTopic, 'atlasId' | 'sectionId'>
const t = (x: T): AtlasTopic => ({ ...x, atlasId: 'agentcore', sectionId: S })

export const gateway: AtlasSection = {
  id: S,
  atlasId: 'agentcore',
  title: 'Gateway',
  order: 4,
  blurb: 'Turn APIs, Lambda functions, MCP servers, and Knowledge Bases into agent tools behind one secure endpoint.',
  topics: [
    t({
      id: 'gateway-targets',
      title: 'Turning things into tools',
      oneLiner:
        'Register APIs, Lambda functions, existing MCP servers, or Knowledge Bases as targets — the agent sees them all as MCP tools.',
      whyItMatters:
        'Most enterprise capability already exists as APIs and functions; Gateway makes it usable by an agent without hand-writing an integration for each one, and centralizes the auth.',
      explanation: {
        plain:
          'Gateway takes things you already have — a REST API, a Lambda function, an existing MCP server, or a Bedrock Knowledge Base — and exposes them to an agent as tools. Pick a target type below to see how the flow changes.',
        technical:
          'Each Gateway target is registered once and presented to agents as an MCP tool through a single secure endpoint, so the agent discovers and calls it with no bespoke integration. Targets include REST/OpenAPI APIs, AWS Lambda functions, existing MCP servers (federating other tool servers), and Bedrock Knowledge Bases — which ties Gateway directly to the RAG catalog.',
      },
      visual: {
        kind: 'concept_diagram',
        height: 300,
        nodes: [
          { id: 'agent', label: 'Agent', detail: 'Discovers and calls tools via MCP.', x: 12, y: 50, accent: 'rgb(13 148 136)' },
          { id: 'gw', label: 'AgentCore Gateway', sublabel: 'MCP endpoint', detail: 'One secure endpoint; central auth and routing.', x: 44, y: 50 },
          { id: 'api', label: 'REST / OpenAPI API', detail: 'An existing HTTP API becomes a tool.', x: 82, y: 14 },
          { id: 'lambda', label: 'AWS Lambda', detail: 'A function becomes a callable tool.', x: 82, y: 38 },
          { id: 'mcp', label: 'Existing MCP server', detail: 'Federate another MCP tool server.', x: 82, y: 62 },
          { id: 'kb', label: 'Bedrock Knowledge Base', detail: 'A KB becomes a retrieval tool — the RAG tie-in.', x: 82, y: 86 },
        ],
        edges: [
          { from: 'agent', to: 'gw' },
          { from: 'gw', to: 'api' },
          { from: 'gw', to: 'lambda' },
          { from: 'gw', to: 'mcp' },
          { from: 'gw', to: 'kb' },
        ],
        selector: {
          label: 'Target type',
          options: [
            { id: 'api', label: 'REST API', highlightNodeIds: ['gw', 'api'], note: 'An OpenAPI/REST API is registered as a target; the agent calls its operations as tools.' },
            { id: 'lambda', label: 'Lambda', highlightNodeIds: ['gw', 'lambda'], note: 'A Lambda function is exposed as a tool — good for custom logic without a public API.' },
            { id: 'mcp', label: 'MCP server', highlightNodeIds: ['gw', 'mcp'], note: 'An existing MCP server is federated, so its tools appear through the same Gateway endpoint.' },
            { id: 'kb', label: 'Knowledge Base', highlightNodeIds: ['gw', 'kb'], note: 'A Bedrock Knowledge Base becomes a retrieval tool — this is how multi-KB RAG routes through Gateway.' },
          ],
        },
      },
      docUrl: DOCS,
      verificationId: 'agentcore_gateway',
      coverageStatus: 'full',
      tags: ['gateway', 'mcp', 'targets', 'lambda', 'knowledge base'],
      relatedTopicIds: ['gateway-auth'],
      appliedIn: [
        { label: 'Multi-KB agentic RAG', to: '/architecture/multi_kb_agentic_rag' },
        { label: 'The composer’s Gateway toggle', to: '/compose' },
      ],
    }),
    t({
      id: 'gateway-auth',
      title: 'Authorization: OAuth & IAM',
      oneLiner:
        'Gateway centralizes who can reach which tool — with OAuth or IAM.',
      whyItMatters:
        'Centralized, consistent authorization is the difference between a demo and something you can put in front of regulated users; it’s where tool access is actually controlled.',
      explanation: {
        plain:
          'Because every tool goes through one Gateway endpoint, that’s where you enforce access. Gateway supports OAuth and IAM so you control which callers and agents can use which tools.',
        technical:
          'Gateway provides centralized authorization for its targets, supporting OAuth (token-based, often for user- or app-delegated access) and IAM (AWS-native, role-based). Concentrating auth at the Gateway means a tool’s access policy is defined once and applied consistently, rather than scattered across each integration — and it pairs with AgentCore Identity for scoped outbound credentials.',
      },
      visual: {
        kind: 'comparison_matrix',
        columns: ['OAuth', 'IAM'],
        rows: [
          { label: 'Style', cells: ['Token-based', 'AWS-native, role-based'] },
          { label: 'Good for', cells: ['User/app-delegated access, third-party identity', 'AWS workloads and least-privilege roles'] },
          { label: 'Enforced at', cells: [{ text: 'The Gateway endpoint', tone: 'good' }, { text: 'The Gateway endpoint', tone: 'good' }] },
          { label: 'Pairs with', cells: ['AgentCore Identity', 'IAM roles / policies'], note: 'Both centralize tool access.' },
        ],
      },
      docUrl: DOCS,
      verificationId: 'agentcore_gateway',
      coverageStatus: 'full',
      tags: ['gateway', 'oauth', 'iam', 'authorization'],
      relatedTopicIds: ['gateway-targets', 'identity'],
      appliedIn: [{ label: 'Security & compliance deep dive', to: '/security' }],
    }),
  ],
}
