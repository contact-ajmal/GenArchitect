import type { RagArchitecture } from '../../types'

const MULTIKB_PY = `from strands import Agent
from strands.models import BedrockModel
from strands.tools.mcp import MCPClient
from mcp.client.streamable_http import streamablehttp_client

# Reference implementation — verify against current AgentCore/Strands docs.
# The Gateway exposes each Bedrock Knowledge Base as an MCP tool target.
GATEWAY_URL = "https://EXAMPLE.gateway.bedrock-agentcore.us-west-2.amazonaws.com/mcp"
TOKEN = get_access_token()   # obtained via AgentCore Identity

def connect():
    return streamablehttp_client(GATEWAY_URL, headers={"Authorization": "Bearer " + TOKEN})

mcp = MCPClient(connect)

with mcp:
    tools = mcp.list_tools_sync()   # -> policies_kb, product_kb, compliance_kb
    agent = Agent(
        model=BedrockModel(model_id="anthropic.claude-3-5-sonnet-20241022-v2:0"),
        system_prompt=(
            "Route each question to the right knowledge base: policies_kb "
            "(HR/expense), product_kb (products/pricing), compliance_kb "
            "(regulatory). Query more than one when needed; cite every source."
        ),
        tools=tools,
    )
    print(agent("Which compliance rules apply to our new EU savings product?").message)
`

export const multiKbAgenticRag: RagArchitecture = {
  id: 'multi_kb_agentic_rag',
  name: 'Multi-KB Agentic RAG',
  tagline: 'One agent, many knowledge bases — routed to the right source via Gateway.',
  difficulty: 'advanced',

  summary:
    'Enterprises rarely have one corpus. Meridian has policies, product, and compliance content — different owners, sensitivities, and update cycles. Here a single agent reasons across several knowledge bases exposed through AgentCore Gateway as tools, routing each question (or sub-question) to the source that can actually answer it.',
  technicalSummary:
    'Each Bedrock Knowledge Base is registered as a target in AgentCore Gateway, which presents them to the agent as MCP tools with centralized auth (IAM/Identity), routing, and observability. A Strands agent discovers the tools over MCP and the model chooses which KB(s) to query per question. This keeps corpora separately governed while giving one agent unified, access-controlled reach.',

  whenToUse: [
    'Multiple distinct corpora with different owners, sensitivities, or refresh cadences.',
    'You want centralized auth and observability over tool/data access (Gateway) rather than bespoke wiring.',
    'Questions that may span sources and need routing or fan-out.',
  ],
  whenNotToUse: [
    'A single homogeneous corpus — one KB with good retrieval is simpler.',
    'You are not ready to operate Gateway/Identity and per-KB access policies.',
  ],
  enterpriseConsiderations: [
    'Security: Gateway centralizes auth and IAM so each KB stays independently governed; the agent only reaches what its identity permits.',
    'Ops: adding a corpus is adding a Gateway target, not re-plumbing the agent.',
    'Cost: routing avoids querying every KB for every question — but a poorly-routed agent can fan out expensively; evaluate routing quality.',
  ],

  layers: [
    { id: 'src_policies', label: 'Policies corpus', layer: 'sources', role: 'corpus', awsServiceId: 's3' },
    { id: 'src_product', label: 'Product corpus', layer: 'sources', role: 'corpus' },
    { id: 'src_compliance', label: 'Compliance corpus', layer: 'sources', role: 'corpus' },
    { id: 'policies_kb', label: 'Policies KB', layer: 'index', role: 'knowledge-base', awsServiceId: 'bedrock_kb_managed' },
    { id: 'product_kb', label: 'Product KB', layer: 'index', role: 'knowledge-base', awsServiceId: 'bedrock_kb_managed' },
    { id: 'compliance_kb', label: 'Compliance KB', layer: 'index', role: 'knowledge-base', awsServiceId: 'bedrock_kb_managed' },
    { id: 'gateway', label: 'AgentCore Gateway', layer: 'orchestration', role: 'tool-gateway', awsServiceId: 'agentcore_gateway', note: 'KBs as MCP tools; central auth/IAM' },
    { id: 'mcp_client', label: 'MCP tool client', layer: 'orchestration', role: 'tool-client', awsServiceId: 'mcp' },
    { id: 'router', label: 'Routing agent', layer: 'orchestration', role: 'router', awsServiceId: 'strands_sdk', note: 'picks the KB(s)' },
    { id: 'retriever', label: 'Per-KB retrieval', layer: 'retrieval', role: 'retriever', awsServiceId: 'bedrock_kb_managed' },
    { id: 'llm', label: 'LLM', layer: 'generation', role: 'generator', awsServiceId: 'bedrock_foundation_models' },
  ],

  walkthrough: [
    {
      id: 'expose',
      order: 1,
      title: 'Expose each KB as a Gateway tool',
      plainExplanation:
        'Every knowledge base is registered with AgentCore Gateway, which hands the agent a set of tools — one per corpus — behind a single secure endpoint.',
      technicalDetail:
        'Gateway turns each Bedrock KB into an MCP tool target and centralizes authentication, IAM, routing, and observability. The agent connects to one MCP endpoint instead of integrating each KB directly.',
      diagramComponentIds: ['policies_kb', 'product_kb', 'compliance_kb', 'gateway'],
      codeSampleId: 'multikb_py',
      codeHighlightRange: [[8, 14]],
      awsServiceIds: ['agentcore_gateway', 'bedrock_kb_managed', 'mcp'],
      securityNotes: ['Gateway + Identity enforce which KBs a given caller may reach.'],
    },
    {
      id: 'discover',
      order: 2,
      title: 'Discover tools over MCP',
      plainExplanation:
        'The agent asks the Gateway what tools exist and gets back the list of knowledge bases it is allowed to use.',
      technicalDetail:
        'The Strands MCP client lists the Gateway’s tools (policies_kb, product_kb, compliance_kb). Tool discovery is dynamic — new corpora appear without code changes.',
      diagramComponentIds: ['mcp_client', 'gateway'],
      codeSampleId: 'multikb_py',
      codeHighlightRange: [[16, 17]],
      awsServiceIds: ['mcp', 'agentcore_gateway'],
    },
    {
      id: 'route',
      order: 3,
      title: 'Route the question to the right source',
      plainExplanation:
        'The model reads the question and decides which knowledge base (or bases) can answer it — product and compliance, for a question about a new product’s rules.',
      technicalDetail:
        'The system prompt describes each KB’s domain; the model selects tool(s) accordingly. This is routing, not blanket fan-out — the agent queries only what is relevant.',
      diagramComponentIds: ['router', 'retriever'],
      codeSampleId: 'multikb_py',
      codeHighlightRange: [[20, 24]],
      awsServiceIds: ['strands_sdk'],
    },
    {
      id: 'answer',
      order: 4,
      title: 'Retrieve and synthesize across sources',
      plainExplanation:
        'The agent pulls passages from the selected knowledge bases and composes one cited answer.',
      technicalDetail:
        'Each selected KB returns cited passages via the Retrieve API behind Gateway; the model synthesizes across them. Citations preserve which corpus each fact came from.',
      diagramComponentIds: ['retriever', 'llm'],
      codeSampleId: 'multikb_py',
      codeHighlightRange: [[27, 27]],
      awsServiceIds: ['bedrock_kb_managed', 'bedrock_foundation_models'],
    },
  ],

  codeSamples: [
    {
      id: 'multikb_py',
      title: 'Agent over multiple KBs via AgentCore Gateway (MCP)',
      language: 'python',
      filename: 'multi_kb_agent.py',
      code: MULTIKB_PY,
      explanation:
        'Gateway presents each KB as an MCP tool; the agent discovers and routes among them. Gateway/Identity endpoints, auth flows, and MCP client APIs change often — verify against current AgentCore and Strands docs.',
    },
  ],

  meridianStage: {
    stageTitle: 'Route across corpora',
    whatItAdds:
      'Lets Meridian keep Policies, Product, and Compliance as separately-governed knowledge bases while one assistant routes each question to the right one.',
  },

  awsServiceIds: ['agentcore_gateway', 'bedrock_kb_managed', 'mcp', 'strands_sdk', 'bedrock_foundation_models', 'iam', 's3'],

  references: [
    { label: 'Amazon Bedrock AgentCore — developer guide', url: 'https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html', kind: 'aws-docs' },
    { label: 'Model Context Protocol (MCP)', url: 'https://github.com/modelcontextprotocol', kind: 'github' },
    { label: 'Strands Agents SDK — MCP tools', url: 'https://strandsagents.com/', kind: 'aws-docs' },
  ],

  accentColor: '#6366F1',
}
