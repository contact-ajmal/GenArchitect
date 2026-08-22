import type { RagArchitecture } from '../../types'

const MEMORY_PY = `from strands import Agent, tool
from strands.models import BedrockModel
from bedrock_agentcore.memory import MemoryClient
import boto3

# Reference implementation — verify against current AgentCore/Strands docs.
memory = MemoryClient(region_name="us-west-2")
kb = boto3.client("bedrock-agent-runtime")
MEMORY_ID = "meridian-assistant-memory"
KB_ID = "MERIDIANKB01"

@tool
def recall_user_context(actor_id: str) -> list[str]:
    """MEMORY: who the user is and what they asked before (NOT authoritative)."""
    memories = memory.retrieve_memories(
        memory_id=MEMORY_ID,
        namespace="user/" + actor_id,      # long-term, cross-session
        query="role, desk, recent questions",
    )
    return [m["content"]["text"] for m in memories]

@tool
def retrieve_policy(query: str) -> list[dict]:
    """RAG: the current, authoritative policy text. This is the source of truth."""
    resp = kb.retrieve(knowledgeBaseId=KB_ID, retrievalQuery={"text": query})
    return [{"text": r["content"]["text"], "source": r["location"]} for r in resp["retrievalResults"]]

SYSTEM_PROMPT = (
    "Use recall_user_context to personalize (role, prior questions). "
    "Ground every factual claim in retrieve_policy — memory is context, "
    "never a source of truth. Cite policy sources."
)

model = BedrockModel(model_id="anthropic.claude-3-5-sonnet-20241022-v2:0")
agent = Agent(
    model=model,
    system_prompt=SYSTEM_PROMPT,
    tools=[recall_user_context, retrieve_policy],
)

print(agent("Given my role, what is my expense approval limit?").message)
`

export const memoryAugmentedRag: RagArchitecture = {
  id: 'memory_augmented_rag',
  name: 'Memory-Augmented RAG',
  tagline: 'Memory knows the user; RAG knows the truth. Use both — never confuse them.',
  difficulty: 'advanced',
  family: 'rag',

  summary:
    'A good assistant remembers you — your role, your desk, what you asked yesterday — so it doesn’t make you repeat yourself. But it must never treat those memories as facts. Memory-Augmented RAG combines AgentCore long-term Memory (personal context) with RAG (current authoritative documents): memory personalizes, retrieval grounds.',
  technicalSummary:
    'The crucial distinction: Memory ≠ RAG. AgentCore Memory holds short-term session state and long-term, per-user memories (role, preferences, prior questions) — mutable, personal, and NOT a source of truth. RAG retrieves current authoritative passages from documents — the source of truth, with citations. This pattern wires both as separate tools and instructs the model to personalize from memory but ground every factual claim in retrieval. Never store policy facts in memory; never rely on RAG for who the user is.',

  whenToUse: [
    'Assistants with returning users who benefit from continuity (role, history, preferences).',
    'You need personalization without letting personal context become an unverified fact source.',
    'Multi-turn/multi-session workflows where repeating context is friction.',
  ],
  whenNotToUse: [
    'Stateless, anonymous Q&A where personalization adds nothing.',
    'Cases where storing any user context raises privacy concerns you can’t govern.',
  ],
  enterpriseConsiderations: [
    'Correctness: keep memory and truth separate — a memorized "fact" can go stale while the policy changes; only cited retrieval is authoritative.',
    'Privacy/security: long-term memory is user data — scope it per user (namespaces), govern retention, and honor deletion.',
    'Cost: memory recall is cheap relative to retrieval, but adds a call per turn; scope what you store.',
  ],

  layers: [
    { id: 'user', label: 'User & session', layer: 'sources', role: 'actor', note: 'actor id' },
    { id: 'src', label: 'Policy corpus', layer: 'sources', role: 'corpus', awsServiceId: 's3' },
    { id: 'memory_store', label: 'AgentCore Memory (long-term)', layer: 'memory', role: 'memory-store', awsServiceId: 'agentcore_memory', note: 'user facts, prior sessions — not authoritative' },
    { id: 'memory_recall', label: 'Memory recall', layer: 'memory', role: 'memory-retriever', awsServiceId: 'agentcore_memory' },
    { id: 'kb_index', label: 'Policy KB', layer: 'index', role: 'knowledge-base', awsServiceId: 'bedrock_kb_managed' },
    { id: 'rag_retrieve', label: 'RAG retrieval', layer: 'retrieval', role: 'retriever', awsServiceId: 'bedrock_kb_managed', note: 'authoritative, cited' },
    { id: 'agent', label: 'Strands agent', layer: 'orchestration', role: 'orchestrator', awsServiceId: 'strands_sdk' },
    { id: 'llm', label: 'LLM', layer: 'generation', role: 'generator', awsServiceId: 'bedrock_foundation_models' },
  ],

  walkthrough: [
    {
      id: 'recall',
      order: 1,
      title: 'Recall who the user is (Memory)',
      plainExplanation:
        'The assistant looks up what it remembers about this employee — their role, desk, and recent questions — so it can tailor the answer.',
      technicalDetail:
        'A memory tool retrieves long-term, per-user memories from AgentCore Memory using a user-scoped namespace. This is personal context, explicitly labeled NOT authoritative.',
      diagramComponentIds: ['user', 'memory_store', 'memory_recall'],
      codeSampleId: 'memory_py',
      codeHighlightRange: [[12, 20]],
      awsServiceIds: ['agentcore_memory', 'strands_sdk'],
      securityNotes: ['Memory is per-user data — namespace it and govern retention/deletion.'],
    },
    {
      id: 'ground',
      order: 2,
      title: 'Retrieve authoritative facts (RAG)',
      plainExplanation:
        'For anything factual — the actual approval limit — it retrieves the current policy text, which is the source of truth.',
      technicalDetail:
        'A separate retrieval tool queries the policy Knowledge Base and returns cited passages. Facts come only from here, never from memory.',
      diagramComponentIds: ['kb_index', 'rag_retrieve'],
      codeSampleId: 'memory_py',
      codeHighlightRange: [[22, 26]],
      awsServiceIds: ['bedrock_kb_managed'],
    },
    {
      id: 'discipline',
      order: 3,
      title: 'Keep memory ≠ source of truth',
      plainExplanation:
        'The assistant is explicitly told: use memory to personalize, but base every factual claim on retrieved policy — and cite it.',
      technicalDetail:
        'The system prompt enforces the separation. This discipline prevents a stale or wrong memory from being presented as policy — the single most important rule of this pattern.',
      diagramComponentIds: ['agent'],
      codeSampleId: 'memory_py',
      codeHighlightRange: [[28, 32]],
      awsServiceIds: ['strands_sdk'],
    },
    {
      id: 'answer',
      order: 4,
      title: 'Personalize and ground the answer',
      plainExplanation:
        'The model combines "you’re an approver on the EU desk" (memory) with "the current limit is X, per policy §4" (retrieval) into one tailored, cited answer.',
      technicalDetail:
        'The agent runs both tools and composes an answer that is personalized by memory and grounded by citations. Memory shapes tone and relevance; retrieval supplies every fact.',
      diagramComponentIds: ['llm', 'agent'],
      codeSampleId: 'memory_py',
      codeHighlightRange: [[34, 41]],
      awsServiceIds: ['bedrock_foundation_models', 'strands_sdk'],
    },
  ],

  codeSamples: [
    {
      id: 'memory_py',
      title: 'One agent, two clearly-separated tools: memory and RAG',
      language: 'python',
      filename: 'memory_rag_agent.py',
      code: MEMORY_PY,
      explanation:
        'The tool docstrings and system prompt encode the Memory≠RAG rule: memory personalizes, retrieval is the source of truth. AgentCore Memory APIs (namespaces, retrieve_memories) change often — verify against current docs.',
      annotations: [
        {
          lineRange: [12, 20],
          whatItDoes:
            'Recalls long-term memory about the user (role, prior questions) — personal context, explicitly NOT authoritative.',
          mapsToDiagramComponentId: 'memory_recall',
          docUrl:
            'https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html',
          verifyAgainstDocs: true,
        },
        {
          lineRange: [22, 26],
          whatItDoes:
            'Retrieves the current, authoritative policy text — the only source of facts.',
          mapsToDiagramComponentId: 'rag_retrieve',
        },
        {
          lineRange: [28, 32],
          whatItDoes:
            'The prompt enforces the rule: personalize from memory, but ground every factual claim in retrieval.',
          technicalNote:
            'This is the single most important line of the pattern — it keeps a stale memory from being presented as policy.',
          mapsToDiagramComponentId: 'agent',
        },
      ],
    },
  ],

  meridianStage: {
    stageTitle: 'Remember the user, ground the facts',
    whatItAdds:
      'Gives Meridian’s assistant continuity — an employee’s role and prior questions — while every factual answer still comes from current, cited policy, not from memory.',
  },

  awsServiceIds: ['agentcore_memory', 'bedrock_kb_managed', 'bedrock_foundation_models', 's3', 'strands_sdk'],

  references: [
    { label: 'Amazon Bedrock AgentCore — Memory (developer guide)', url: 'https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html', kind: 'aws-docs' },
    { label: 'Amazon Bedrock Knowledge Bases', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html', kind: 'aws-docs' },
    { label: 'Strands Agents SDK documentation', url: 'https://strandsagents.com/', kind: 'aws-docs' },
  ],

  accentColor: '#F59E0B',
}
