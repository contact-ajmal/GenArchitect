import type { CodeLanguage } from '../types'
import { VECTOR_STORE_LABELS, type RagComposition } from './composition'

/**
 * Live code generation for the composer. Code is assembled from typed fragments
 * keyed by choice — never one giant hardcoded string — so combinations produce
 * coherent multi-file reference output. Nothing here is executed.
 */

export interface GeneratedFile {
  filename: string
  language: CodeLanguage
  code: string
}

const MODEL_ID = 'anthropic.claude-3-5-sonnet-20241022-v2:0'
const BANNER =
  '# Reference implementation — verify exact syntax against current AWS docs.'

/* --------------------------------------------------------------------------
 * System prompt — varies with reasoning, routing, and memory choices.
 * ------------------------------------------------------------------------ */
function systemPrompt(c: RagComposition): string {
  const lines: string[] = []
  if (c.retrievalMode === 'agentic_retrieval') {
    lines.push(
      'Decide whether retrieval is needed. For multi-part questions, break them',
      'into sub-questions, retrieve for each, then reason over the evidence.',
    )
  } else {
    lines.push('Retrieve relevant passages, then answer from them.')
  }
  if (c.multiKb) {
    lines.push(
      'Route each question to the right knowledge base before retrieving.',
    )
  }
  if (c.memory === 'long_term') {
    lines.push(
      'Use recalled memory to personalize (role, prior questions), but never',
      'treat memory as fact — ground every claim in retrieval.',
    )
  }
  lines.push('Answer only from retrieved, authorized passages. Cite every source.')
  return lines.join('\n')
}

/* --------------------------------------------------------------------------
 * Retrieval tool (local, non-Gateway path).
 * ------------------------------------------------------------------------ */
function rerankingBlock(): string {
  return [
    '                "rerankingConfiguration": {',
    '                    "type": "BEDROCK_RERANKING_MODEL",',
    '                    "bedrockRerankingConfiguration": {',
    '                        "numberOfRerankedResults": 5,',
    '                        "modelConfiguration": {',
    '                            "modelArn": "arn:aws:bedrock:us-west-2::foundation-model/amazon.rerank-v1:0"',
    '                        }',
    '                    }',
    '                }',
  ].join('\n')
}

function vectorSearchConfig(c: RagComposition): string {
  const props: string[] = []
  props.push('                "numberOfResults": ' + (c.reranking ? '25' : '5'))
  if (c.reranking) {
    props.push('                "overrideSearchType": "HYBRID"')
    props.push(rerankingBlock())
  }
  if (c.accessControl === 'document_acls') {
    props.push(
      '                "filter": {"in": {"key": "acl_group", "value": user["groups"]}}',
    )
  }
  return props.join(',\n')
}

function toolsPy(c: RagComposition): string {
  const acl = c.accessControl === 'document_acls'
  const storeNote =
    c.knowledgeBase === 'customer_managed'
      ? 'customer-managed vector store: ' + VECTOR_STORE_LABELS[c.vectorStore]
      : 'managed Knowledge Base'
  const doc =
    c.retrievalMode === 'agentic_retrieval'
      ? 'Retrieve passages for ONE sub-question. The agent may call this repeatedly.'
      : 'Retrieve cited passages for the query.'
  const sig = acl ? 'query: str, user: dict' : 'query: str'

  return `${BANNER}
import boto3
from strands import tool

kb = boto3.client("bedrock-agent-runtime")
KB_ID = "MERIDIANKB01"  # ${storeNote}


@tool
def retrieve(${sig}) -> list[dict]:
    """${doc}"""
    resp = kb.retrieve(
        knowledgeBaseId=KB_ID,
        retrievalQuery={"text": query},
        retrievalConfiguration={
            "vectorSearchConfiguration": {
${vectorSearchConfig(c)}
            }
        },
    )
    return [
        {"text": r["content"]["text"], "source": r["location"]}
        for r in resp["retrievalResults"]
    ]
`
}

/* --------------------------------------------------------------------------
 * Memory (long-term recall tool).
 * ------------------------------------------------------------------------ */
function memoryPy(c: RagComposition): string {
  if (c.memory === 'session') {
    return `${BANNER}
# Session (short-term) memory is working memory scoped to a single session —
# it is managed by the agent/runtime, not a retrieval tool. Long-term,
# cross-session memory (below) is a separate opt-in.
`
  }
  return `${BANNER}
from strands import tool
from bedrock_agentcore.memory import MemoryClient

memory = MemoryClient(region_name="us-west-2")
MEMORY_ID = "your-assistant-memory"


@tool
def recall_user_context(actor_id: str) -> list[str]:
    """MEMORY: who the user is and prior questions. NOT a source of truth."""
    hits = memory.retrieve_memories(
        memory_id=MEMORY_ID,
        namespace="user/" + actor_id,
        query="role, desk, recent questions",
    )
    return [h["content"]["text"] for h in hits]
`
}

/* --------------------------------------------------------------------------
 * agent.py — assembled from the choices.
 * ------------------------------------------------------------------------ */
function modelBlock(c: RagComposition): string {
  const guard = c.guardrails
    ? '\n    guardrail_id="gr-your-guardrail-01",\n    guardrail_version="DRAFT",'
    : ''
  return `model = BedrockModel(
    model_id="${MODEL_ID}",
    region_name="us-west-2",${guard})`
}

function agentPy(c: RagComposition): string {
  const usesGateway = c.gateway || c.multiKb
  const hasMemoryTool = c.memory === 'long_term'

  const imports: string[] = ['from strands import Agent', 'from strands.models import BedrockModel']
  if (usesGateway) {
    imports.push('from strands.tools.mcp import MCPClient')
    imports.push('from mcp.client.streamable_http import streamablehttp_client')
  } else {
    imports.push('from tools import retrieve')
  }
  if (hasMemoryTool) imports.push('from memory import recall_user_context')

  const prompt = systemPrompt(c)
  const head = `${BANNER}
${imports.join('\n')}

${modelBlock(c)}

SYSTEM_PROMPT = """${prompt}"""
`

  // Tools expression differs by path.
  const memoryToolAdd = hasMemoryTool ? ' + [recall_user_context]' : ''

  if (usesGateway) {
    const toolsExpr = `mcp.list_tools_sync()${memoryToolAdd}`
    const body = c.orchestration === 'multi_agent'
      ? multiAgentBody(toolsExpr, true)
      : singleAgentBody(toolsExpr, true)
    return `${head}
# Knowledge bases are exposed as MCP tools by AgentCore Gateway (central auth).
GATEWAY_URL = "https://EXAMPLE.gateway.bedrock-agentcore.us-west-2.amazonaws.com/mcp"
TOKEN = get_access_token()  # via AgentCore Identity


def connect():
    return streamablehttp_client(GATEWAY_URL, headers={"Authorization": "Bearer " + TOKEN})


mcp = MCPClient(connect)
with mcp:
${body}
`
  }

  const toolsExpr = `[retrieve]${memoryToolAdd}`
  const body = c.orchestration === 'multi_agent'
    ? multiAgentBody(toolsExpr, false)
    : singleAgentBody(toolsExpr, false)
  return `${head}
${body}
`
}

function singleAgentBody(toolsExpr: string, indented: boolean): string {
  const pad = indented ? '    ' : ''
  return `${pad}agent = Agent(model=model, system_prompt=SYSTEM_PROMPT, tools=${toolsExpr})
${pad}print(agent("What is our EU data-retention policy?").message)`
}

function multiAgentBody(toolsExpr: string, indented: boolean): string {
  const pad = indented ? '    ' : ''
  return `${pad}# Specialists — each a Strands agent with a narrow job.
${pad}retriever = Agent(model=model, tools=${toolsExpr},
${pad}                  system_prompt="Retrieve cited passages for the query.")
${pad}reviewer = Agent(model=model,
${pad}                 system_prompt="Review the draft answer for compliance; flag issues.")

${pad}@tool
${pad}def find_evidence(q: str) -> str:
${pad}    """Retriever specialist."""
${pad}    return str(retriever(q).message)

${pad}@tool
${pad}def review(draft: str) -> str:
${pad}    """Compliance reviewer specialist."""
${pad}    return str(reviewer(draft).message)

${pad}supervisor = Agent(
${pad}    model=model,
${pad}    system_prompt=SYSTEM_PROMPT + " Gather evidence, draft, then review before answering.",
${pad}    tools=[find_evidence, review],
${pad})
${pad}print(supervisor("Can we market Product X to retail clients in France?").message)`
}

/* --------------------------------------------------------------------------
 * Ops / deploy scripts.
 * ------------------------------------------------------------------------ */
function requirementsTxt(c: RagComposition): string {
  const pkgs = ['strands-agents', 'strands-agents-tools', 'boto3']
  if (
    c.deployTarget === 'agentcore_runtime' ||
    c.memory !== 'none' ||
    c.observability ||
    c.evaluations
  ) {
    pkgs.push('bedrock-agentcore', 'bedrock-agentcore-starter-toolkit')
  }
  if (c.gateway || c.multiKb) pkgs.push('mcp')
  return pkgs.join('\n') + '\n'
}

function deploySh(): string {
  return `${BANNER}
# Deploy the agent to AgentCore Runtime, then invoke it.
agentcore configure --entrypoint agent.py
agentcore launch
agentcore invoke '{"prompt": "What is our EU data-retention policy?"}'
`
}

function observeSh(c: RagComposition): string {
  const parts: string[] = [BANNER]
  if (c.observability) {
    parts.push(
      '# Traces + metrics flow to CloudWatch (OpenTelemetry-based).',
      'export AGENTCORE_OBSERVABILITY_ENABLED=true',
    )
  }
  if (c.evaluations) {
    parts.push(
      '',
      '# Gate promotion on an evaluation suite (LLM-as-judge).',
      'aws bedrock-agentcore start-evaluation \\',
      '  --agent-runtime-id "your-agent" \\',
      '  --dataset "s3://your-eval/qa.jsonl"',
    )
  }
  return parts.join('\n') + '\n'
}

/* --------------------------------------------------------------------------
 * Assemble the file set for a composition.
 * ------------------------------------------------------------------------ */
export function generateCode(c: RagComposition): GeneratedFile[] {
  const files: GeneratedFile[] = []
  files.push({ filename: 'agent.py', language: 'python', code: agentPy(c) })

  if (!(c.gateway || c.multiKb)) {
    files.push({ filename: 'tools.py', language: 'python', code: toolsPy(c) })
  }
  if (c.memory !== 'none') {
    files.push({ filename: 'memory.py', language: 'python', code: memoryPy(c) })
  }
  files.push({
    filename: 'requirements.txt',
    language: 'bash',
    code: requirementsTxt(c),
  })
  if (c.deployTarget === 'agentcore_runtime') {
    files.push({ filename: 'deploy.sh', language: 'bash', code: deploySh() })
  }
  if (c.observability || c.evaluations) {
    files.push({ filename: 'observe.sh', language: 'bash', code: observeSh(c) })
  }
  return files
}
