import type { AwsServiceId, CodeLanguage, RagArchitectureId } from '../types'

/**
 * The Build track: a hands-on, ordered path to the Meridian end-state —
 * a guardrailed, secure, observable agentic-RAG assistant on Amazon Bedrock
 * AgentCore + the Strands Agents SDK.
 *
 * Every code sample is a REFERENCE implementation. Nothing here executes in the
 * app, and following it on a real AWS account incurs cost. Fast-moving SDK/CLI
 * syntax carries a "verify against current AWS docs" callout.
 */

export type BuildCalloutVariant = 'note' | 'tip' | 'warning' | 'security' | 'cost'

export interface BuildCallout {
  variant: BuildCalloutVariant
  title?: string
  body: string
}

export interface BuildCode {
  language: CodeLanguage
  filename?: string
  code: string
  explanation?: string
}

export interface BuildStep {
  instruction: string
  codeSample?: BuildCode
  awsServiceIds: AwsServiceId[]
  callouts?: BuildCallout[]
}

export interface BuildStage {
  id: string
  order: number
  title: string
  goal: string
  prerequisites: string[]
  steps: BuildStep[]
  whatYouShouldSee: string
  commonPitfalls: string[]
  /** Catalog patterns this stage realizes. */
  relatedArchitectureIds?: RagArchitectureId[]
}

const VERIFY = (what: string): BuildCallout => ({
  variant: 'warning',
  title: 'Verify against current AWS docs',
  body: `${what} change often. Treat this as the shape to confirm against the current Amazon Bedrock AgentCore and Strands documentation before running it.`,
})

export const BUILD_TRACK: BuildStage[] = [
  {
    id: 'prereqs',
    order: 0,
    title: 'Prerequisites',
    goal: 'Get an AWS account, model access, credentials, and a Python environment ready.',
    prerequisites: [
      'An AWS account with permission to use Amazon Bedrock and create IAM roles.',
      'Model access enabled for the models you plan to use (e.g. Anthropic Claude on Bedrock).',
      'Python 3.10+ and pip.',
    ],
    steps: [
      {
        instruction:
          'In the Bedrock console, enable model access for the models you will use (e.g. an Anthropic Claude model) in your chosen region. Note the exact model IDs — they are region-specific.',
        awsServiceIds: ['bedrock_foundation_models'],
        callouts: [VERIFY('Model IDs and regional availability')],
      },
      {
        instruction:
          'Configure AWS credentials locally and confirm they resolve to the right account and region.',
        awsServiceIds: ['iam'],
        codeSample: {
          language: 'bash',
          filename: 'setup_aws.sh',
          code: `# Configure credentials (SSO or access keys) and a default region.
aws configure
export AWS_REGION=us-west-2

# Confirm you are who you think you are.
aws sts get-caller-identity
`,
        },
      },
      {
        instruction:
          'Create a virtual environment and install the Strands SDK, its tools, the AgentCore runtime SDK, and the AgentCore CLI.',
        awsServiceIds: ['strands_sdk', 'strands_agents_tools', 'agentcore_runtime'],
        codeSample: {
          language: 'bash',
          filename: 'install.sh',
          code: `python -m venv .venv && source .venv/bin/activate

# Strands Agents SDK + prebuilt tools
pip install strands-agents strands-agents-tools

# AgentCore runtime SDK + starter toolkit (provides the "agentcore" CLI)
pip install bedrock-agentcore bedrock-agentcore-starter-toolkit

# (Some workflows also use the AgentCore CLI distributed as @aws/agentcore)
# npm install -g @aws/agentcore
`,
          explanation:
            'Package names and the exact CLI distribution move quickly — verify against current AWS docs.',
        },
        callouts: [VERIFY('Package names and the AgentCore CLI distribution')],
      },
    ],
    whatYouShouldSee:
      '`aws sts get-caller-identity` returns your account, and `python -c "import strands"` runs without error.',
    commonPitfalls: [
      'Model access not enabled in the region you are calling — requests fail with access-denied.',
      'A region mismatch between your credentials, the model, and later the Knowledge Base.',
      'Expired SSO credentials — re-authenticate before long sessions.',
    ],
  },

  {
    id: 'stage-a',
    order: 1,
    title: 'Stage A — Your first Strands agent, locally',
    goal: 'Run a model-driven agent with a system prompt and one simple tool.',
    prerequisites: ['Prerequisites complete; virtual environment activated.'],
    steps: [
      {
        instruction:
          'Define a model, a system prompt, and a single @tool. Run the agent — the model decides when to call the tool. This model-driven loop is the foundation everything else builds on.',
        awsServiceIds: ['strands_sdk', 'bedrock_foundation_models'],
        codeSample: {
          language: 'python',
          filename: 'first_agent.py',
          code: `from strands import Agent, tool
from strands.models import BedrockModel

@tool
def word_count(text: str) -> int:
    """Count the words in a piece of text."""
    return len(text.split())

model = BedrockModel(
    model_id="anthropic.claude-3-5-sonnet-20241022-v2:0",
    region_name="us-west-2",
)

agent = Agent(
    model=model,
    system_prompt="You are concise. Use tools when they help.",
    tools=[word_count],
)

result = agent("How many words are in: the quick brown fox jumps?")
print(result.message)
`,
          explanation:
            'The @tool docstring matters — the model reads it to decide when and how to call the tool.',
        },
        callouts: [
          {
            variant: 'tip',
            title: 'The agent loop',
            body: 'You never hand-code “now call the tool.” The model plans: it may answer directly, call word_count, read the result, and continue — that autonomy is what makes it an agent.',
          },
        ],
      },
    ],
    whatYouShouldSee:
      'The agent answers, and for a counting question it invokes word_count rather than guessing.',
    commonPitfalls: [
      'A wrong or region-unavailable model ID.',
      'A tool with no/weak docstring — the model won’t know when to use it.',
    ],
    relatedArchitectureIds: ['naive_rag'],
  },

  {
    id: 'stage-b',
    order: 2,
    title: 'Stage B — Ground it in a Knowledge Base',
    goal: 'Create a Bedrock Managed Knowledge Base over S3 and give the agent a retrieval tool with citations.',
    prerequisites: ['Stage A complete.', 'Source documents staged in an S3 bucket.'],
    steps: [
      {
        instruction:
          'Create a Knowledge Base with an S3 data source and start an ingestion job. Bedrock parses, chunks, embeds, and indexes the documents for you.',
        awsServiceIds: ['bedrock_kb_managed', 's3', 'opensearch_serverless'],
        codeSample: {
          language: 'bash',
          filename: 'create_kb.sh',
          code: `# Create the data source (S3), then run ingestion.
aws bedrock-agent create-data-source \\
  --knowledge-base-id "MERIDIANKB01" \\
  --name "s3-policies" \\
  --data-source-configuration file://s3-source.json

aws bedrock-agent start-ingestion-job \\
  --knowledge-base-id "MERIDIANKB01" \\
  --data-source-id "DSS301"
`,
        },
        callouts: [
          VERIFY('bedrock-agent CLI actions and parameters'),
          {
            variant: 'cost',
            title: 'Costs apply',
            body: 'Managed embedding and vector storage are billed. Start with a small corpus while you iterate.',
          },
        ],
      },
      {
        instruction:
          'Give the agent a retrieve tool backed by the Knowledge Base Retrieve API. Passages come back with citations you can surface.',
        awsServiceIds: ['bedrock_kb_managed', 'strands_sdk'],
        codeSample: {
          language: 'python',
          filename: 'grounded_agent.py',
          code: `from strands import Agent, tool
from strands.models import BedrockModel
import boto3

kb = boto3.client("bedrock-agent-runtime")
KB_ID = "MERIDIANKB01"

@tool
def retrieve(query: str, top_k: int = 5) -> list[dict]:
    """Retrieve cited passages from the Knowledge Base."""
    resp = kb.retrieve(
        knowledgeBaseId=KB_ID,
        retrievalQuery={"text": query},
        retrievalConfiguration={"vectorSearchConfiguration": {"numberOfResults": top_k}},
    )
    return [
        {"text": r["content"]["text"], "source": r["location"]}
        for r in resp["retrievalResults"]
    ]

agent = Agent(
    model=BedrockModel(model_id="anthropic.claude-3-5-sonnet-20241022-v2:0"),
    system_prompt="Answer only from retrieved passages and cite each source.",
    tools=[retrieve],
)

print(agent("What is our travel reimbursement limit?").message)
`,
          explanation:
            'This is the Managed KB RAG pattern in miniature — no embedding or index code on your side.',
        },
      },
    ],
    whatYouShouldSee:
      'Answers are grounded in your documents and include source locations you can trace back.',
    commonPitfalls: [
      'Querying before ingestion finishes — you’ll get empty results.',
      'A KB id or region mismatch.',
      'Assuming citations without checking `location` in the response.',
    ],
    relatedArchitectureIds: ['managed_kb_rag', 'hybrid_rerank_rag'],
  },

  {
    id: 'stage-c',
    order: 3,
    title: 'Stage C — Multiple sources via AgentCore Gateway',
    goal: 'Add SharePoint/Confluence connectors and expose the Knowledge Base(s) as MCP tools through AgentCore Gateway.',
    prerequisites: ['Stage B complete.'],
    steps: [
      {
        instruction:
          'Add SharePoint and Confluence as additional data sources (they carry access-control metadata). Then register the Knowledge Base as a target in an AgentCore Gateway so it becomes an MCP tool with centralized auth.',
        awsServiceIds: ['bedrock_kb_managed', 'agentcore_gateway', 'iam'],
        callouts: [
          VERIFY('Connector configuration and Gateway target setup'),
          {
            variant: 'security',
            title: 'Centralized auth',
            body: 'Gateway is where you centralize authentication and IAM for tool/data access, instead of wiring credentials into the agent.',
          },
        ],
      },
      {
        instruction:
          'Connect the agent to the Gateway over MCP and let it discover the available tools (one per corpus).',
        awsServiceIds: ['mcp', 'agentcore_gateway', 'strands_sdk'],
        codeSample: {
          language: 'python',
          filename: 'gateway_agent.py',
          code: `from strands import Agent
from strands.models import BedrockModel
from strands.tools.mcp import MCPClient
from mcp.client.streamable_http import streamablehttp_client

GATEWAY_URL = "https://EXAMPLE.gateway.bedrock-agentcore.us-west-2.amazonaws.com/mcp"
TOKEN = get_access_token()  # via AgentCore Identity

def connect():
    return streamablehttp_client(GATEWAY_URL, headers={"Authorization": "Bearer " + TOKEN})

mcp = MCPClient(connect)
with mcp:
    tools = mcp.list_tools_sync()  # policies_kb, product_kb, compliance_kb
    agent = Agent(
        model=BedrockModel(model_id="anthropic.claude-3-5-sonnet-20241022-v2:0"),
        system_prompt="Route each question to the right knowledge base; cite sources.",
        tools=tools,
    )
    print(agent("Which compliance rules apply to our new EU product?").message)
`,
        },
        callouts: [VERIFY('Gateway endpoints, auth flows, and MCP client APIs')],
      },
    ],
    whatYouShouldSee:
      'The agent lists multiple KB tools from the Gateway and routes a question to the right one.',
    commonPitfalls: [
      'Connector auth not granted — SharePoint/Confluence sync fails silently.',
      'Gateway target permissions too broad or too narrow.',
    ],
    relatedArchitectureIds: ['multi_kb_agentic_rag'],
  },

  {
    id: 'stage-d',
    order: 4,
    title: 'Stage D — Agentic retrieval + memory',
    goal: 'Let the model decide when/what to retrieve (multi-hop) and add AgentCore Memory for continuity — without confusing memory with truth.',
    prerequisites: ['Stage C complete.'],
    steps: [
      {
        instruction:
          'Switch the system prompt so the model plans retrieval: decide whether to retrieve, decompose multi-part questions, and call retrieve per sub-question.',
        awsServiceIds: ['strands_sdk', 'bedrock_kb_managed'],
        codeSample: {
          language: 'python',
          filename: 'agentic_prompt.py',
          code: `SYSTEM_PROMPT = """You are a research assistant.
First decide whether retrieval is needed. If a question has multiple parts,
break it into sub-questions, call retrieve for each, then reason over the
combined evidence. Never answer beyond what you retrieved; cite every source."""
`,
          explanation:
            'Single-shot Retrieve does exactly one lookup. Agentic retrieval lets the agent loop and multi-hop.',
        },
      },
      {
        instruction:
          'Add AgentCore Memory as a separate tool for user/session continuity. Keep it strictly distinct from retrieval.',
        awsServiceIds: ['agentcore_memory', 'strands_sdk'],
        codeSample: {
          language: 'python',
          filename: 'memory_tool.py',
          code: `from bedrock_agentcore.memory import MemoryClient

memory = MemoryClient(region_name="us-west-2")

@tool
def recall_user_context(actor_id: str) -> list[str]:
    """MEMORY: who the user is and prior questions. NOT a source of truth."""
    hits = memory.retrieve_memories(
        memory_id="meridian-assistant-memory",
        namespace="user/" + actor_id,
        query="role, desk, recent questions",
    )
    return [h["content"]["text"] for h in hits]
`,
        },
        callouts: [
          {
            variant: 'warning',
            title: 'Memory ≠ RAG',
            body: 'Memory personalizes (role, history); retrieval grounds (current, cited facts). Never store policy facts in memory, and never treat a memory as authoritative.',
          },
          VERIFY('AgentCore Memory APIs (namespaces, retrieve_memories)'),
        ],
      },
    ],
    whatYouShouldSee:
      'For a compound question the agent retrieves more than once; for a returning user it recalls context but still grounds facts in retrieval.',
    commonPitfalls: [
      'Letting the model answer from memory as if it were fact.',
      'Unbounded retrieval loops — cap the number of hops.',
    ],
    relatedArchitectureIds: ['agentic_rag', 'memory_augmented_rag'],
  },

  {
    id: 'stage-e',
    order: 5,
    title: 'Stage E — Secure and guardrailed',
    goal: 'Add Bedrock Guardrails, document-level ACLs / per-user access, and least-privilege IAM via Gateway.',
    prerequisites: ['Stage D complete.'],
    steps: [
      {
        instruction:
          'Create a Bedrock Guardrail (PII redaction, denied topics, grounding checks) and attach it to the model.',
        awsServiceIds: ['bedrock_guardrails', 'bedrock_foundation_models'],
        codeSample: {
          language: 'python',
          filename: 'guardrailed_model.py',
          code: `from strands.models import BedrockModel

model = BedrockModel(
    model_id="anthropic.claude-3-5-sonnet-20241022-v2:0",
    guardrail_id="gr-meridian-01",
    guardrail_version="DRAFT",
)
`,
        },
        callouts: [VERIFY('Guardrail configuration and model attachment')],
      },
      {
        instruction:
          'Enforce per-user access at retrieval time by filtering on document-level ACL metadata — unauthorized passages are never fetched.',
        awsServiceIds: ['bedrock_kb_managed', 'iam'],
        codeSample: {
          language: 'python',
          filename: 'acl_retrieve.py',
          code: `@tool
def retrieve(query: str, user: dict) -> list[dict]:
    """Retrieve ONLY documents this user may see."""
    resp = kb.retrieve(
        knowledgeBaseId=KB_ID,
        retrievalQuery={"text": query},
        retrievalConfiguration={
            "vectorSearchConfiguration": {
                "filter": {"in": {"key": "acl_group", "value": user["groups"]}}
            }
        },
    )
    return [{"text": r["content"]["text"], "source": r["location"]} for r in resp["retrievalResults"]]
`,
          explanation:
            'Authorizing at retrieval is stronger than filtering generated text after the fact. Metadata-filter syntax changes — verify.',
        },
        callouts: [
          {
            variant: 'security',
            title: 'Defense in depth',
            body: 'ACLs on retrieval and Guardrails on generation are complementary, not alternatives — use both.',
          },
          VERIFY('KB metadata-filter syntax and ACL configuration'),
        ],
      },
    ],
    whatYouShouldSee:
      'Two users asking the same question get answers scoped to what each is allowed to see; unsafe inputs/outputs are blocked or redacted.',
    commonPitfalls: [
      'Relying on prompt instructions instead of retrieval-time ACLs for access control.',
      'Guardrails too strict (blocking valid questions) or too loose — tune with real traffic.',
    ],
    relatedArchitectureIds: ['guardrailed_secure_rag'],
  },

  {
    id: 'stage-f',
    order: 6,
    title: 'Stage F — Deploy and operate',
    goal: 'Deploy to AgentCore Runtime and turn on Observability and Evaluations.',
    prerequisites: ['Stage E complete.'],
    steps: [
      {
        instruction:
          'Wrap the agent in an AgentCore Runtime entrypoint so it can be hosted serverlessly with session isolation.',
        awsServiceIds: ['agentcore_runtime', 'strands_sdk'],
        codeSample: {
          language: 'python',
          filename: 'app.py',
          code: `from bedrock_agentcore.runtime import BedrockAgentCoreApp

app = BedrockAgentCoreApp()

@app.entrypoint
def invoke(payload):
    return {"answer": str(agent(payload["prompt"]).message)}

if __name__ == "__main__":
    app.run()
`,
        },
      },
      {
        instruction:
          'Configure, deploy, and invoke the agent with the AgentCore CLI.',
        awsServiceIds: ['agentcore_runtime'],
        codeSample: {
          language: 'bash',
          filename: 'deploy.sh',
          code: `# Configure and deploy the runtime, then invoke it.
agentcore configure --entrypoint app.py
agentcore launch
agentcore invoke '{"prompt": "What is our EU data-retention policy?"}'
`,
        },
        callouts: [
          VERIFY('agentcore CLI commands and flags'),
          {
            variant: 'cost',
            title: 'Running costs',
            body: 'A deployed runtime, retrieval, guardrails, and model calls all bill while live. Tear down what you are not using.',
          },
        ],
      },
      {
        instruction:
          'Enable AgentCore Observability (traces/metrics to CloudWatch) and run Evaluations (e.g. LLM-as-judge on a labeled dataset) before promoting changes.',
        awsServiceIds: ['agentcore_observability', 'cloudwatch', 'agentcore_evaluations'],
        codeSample: {
          language: 'bash',
          filename: 'observe.sh',
          code: `# Traces + metrics flow to CloudWatch (OpenTelemetry-based).
export AGENTCORE_OBSERVABILITY_ENABLED=true

# Gate promotion on an evaluation suite.
aws bedrock-agentcore start-evaluation \\
  --agent-runtime-id "meridian-supervisor" \\
  --dataset "s3://meridian-eval/policy-qa.jsonl"
`,
        },
        callouts: [VERIFY('Observability env vars and evaluation CLI commands')],
      },
    ],
    whatYouShouldSee:
      'Invocations appear as traces in CloudWatch, and an evaluation run reports accuracy/tool-use metrics you can gate on.',
    commonPitfalls: [
      'Deploying without observability — you can’t debug or audit what you can’t see.',
      'Skipping evaluations and shipping a quality regression.',
      'Leaving the runtime and KB running and being surprised by the bill.',
    ],
    relatedArchitectureIds: ['multi_agent_rag', 'guardrailed_secure_rag'],
  },
]
