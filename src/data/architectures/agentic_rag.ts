import type { RagArchitecture } from '../../types'

const AGENTIC_PY = `from strands import Agent, tool
from strands.models import BedrockModel
import boto3

# Reference implementation — verify against current AWS/Strands docs.
kb = boto3.client("bedrock-agent-runtime")
KB_ID = "MERIDIANKB01"

@tool
def retrieve(query: str, top_k: int = 5) -> list[dict]:
    """Retrieve passages for ONE specific sub-question. Call as often as needed."""
    resp = kb.retrieve(
        knowledgeBaseId=KB_ID,
        retrievalQuery={"text": query},
        retrievalConfiguration={"vectorSearchConfiguration": {"numberOfResults": top_k}},
    )
    return [{"text": r["content"]["text"], "source": r["location"]} for r in resp["retrievalResults"]]

# The prompt licenses the model to PLAN retrieval rather than retrieve blindly.
SYSTEM_PROMPT = """You are a research assistant.
First decide whether retrieval is even needed. If a question has multiple parts,
break it into sub-questions, call retrieve for each, then reason over the
combined evidence. Never answer beyond what you retrieved; cite every source."""

model = BedrockModel(model_id="anthropic.claude-3-5-sonnet-20241022-v2:0")
agent = Agent(model=model, system_prompt=SYSTEM_PROMPT, tools=[retrieve])

# The model may call retrieve zero, one, or several times before it answers.
answer = agent(
    "Do EU contractors fall under the same expense limits as EU employees, "
    "and did that limit change in 2026?"
)
print(answer.message)
`

export const agenticRag: RagArchitecture = {
  id: 'agentic_rag',
  name: 'Agentic RAG',
  tagline: 'The model decides when, what, and how many times to retrieve.',
  difficulty: 'advanced',

  summary:
    'Not every question needs one lookup — some need none, some need several. Agentic RAG lets the model run the show: it reads the question, decides whether to retrieve, splits complex questions into parts, retrieves for each, and reasons over the combined evidence. It trades predictable cost for the ability to answer genuinely multi-step questions.',
  technicalSummary:
    'The distinction is control. Single-shot Retrieve always performs exactly one similarity lookup per question and returns passages. Agentic retrieval puts a model-driven loop (the Strands agent) in charge: it infers intent, optionally decomposes the query into sub-questions, issues multiple retrieve calls (multi-hop), and stops when it has enough evidence. Bedrock can assist with managed query decomposition in RetrieveAndGenerate, but the essence is the agent loop choosing retrieval dynamically.',

  whenToUse: [
    'Questions that combine multiple facts or require follow-up lookups.',
    'Mixed traffic where some questions need no retrieval at all (avoid wasteful lookups).',
    'You want the agent to reason about retrieval, not just execute it once.',
  ],
  whenNotToUse: [
    'Simple, single-fact FAQ traffic — single-shot Retrieve is cheaper and more predictable.',
    'Hard latency/cost ceilings where an unbounded retrieval loop is unacceptable (cap the steps).',
  ],
  enterpriseConsiderations: [
    'Cost/latency: multiple retrieval hops per question raise and vary cost — bound the loop (max steps) and cache.',
    'Observability: log the plan and each retrieval so a reviewer can see why the agent looked where it did.',
    'Quality: decomposition dramatically improves multi-part answers but can over-retrieve — evaluate on real questions.',
  ],

  layers: [
    { id: 'src', label: 'S3 corpus', layer: 'sources', role: 'corpus', awsServiceId: 's3' },
    { id: 'kb_index', label: 'Vector index', layer: 'index', role: 'index', awsServiceId: 'opensearch_serverless' },
    { id: 'agent_loop', label: 'Strands agent loop', layer: 'orchestration', role: 'planner', awsServiceId: 'strands_sdk', note: 'decides when/what to retrieve' },
    { id: 'retriever', label: 'Agentic retrieval', layer: 'retrieval', role: 'retriever', awsServiceId: 'bedrock_kb_managed', note: 'multi-hop, per sub-question' },
    { id: 'evidence', label: 'Combined evidence', layer: 'augmentation', role: 'augmenter' },
    { id: 'llm', label: 'LLM', layer: 'generation', role: 'generator', awsServiceId: 'bedrock_foundation_models' },
  ],

  walkthrough: [
    {
      id: 'decide',
      order: 1,
      title: 'Decide whether to retrieve at all',
      plainExplanation:
        'The assistant first judges the question. Simple ones it may answer directly; anything needing facts triggers retrieval — no reflexive lookup on every turn.',
      technicalDetail:
        'The system prompt licenses the model to plan. The Strands loop lets the model choose tool calls, so retrieval becomes a decision rather than a fixed step — the core contrast with single-shot Retrieve.',
      diagramComponentIds: ['agent_loop'],
      codeSampleId: 'agentic_py',
      codeHighlightRange: [[20, 26]],
      awsServiceIds: ['strands_sdk', 'bedrock_foundation_models'],
    },
    {
      id: 'decompose',
      order: 2,
      title: 'Decompose complex questions',
      plainExplanation:
        'A multi-part question ("do contractors get the same limit, and did it change?") is split into focused sub-questions.',
      technicalDetail:
        'The model rewrites the query into sub-questions (intent inference / query decomposition). Each sub-question becomes a targeted retrieval, improving recall over a single blended query.',
      diagramComponentIds: ['agent_loop', 'retriever'],
      codeSampleId: 'agentic_py',
      codeHighlightRange: [[21, 23]],
      awsServiceIds: ['strands_sdk'],
    },
    {
      id: 'multi_hop',
      order: 3,
      title: 'Retrieve per sub-question (multi-hop)',
      plainExplanation:
        'The assistant looks up each sub-question separately, gathering evidence from potentially different passages.',
      technicalDetail:
        'The retrieve tool is called once per sub-question. This multi-hop pattern is what single-shot Retrieve cannot do — one lookup can only ever answer one facet.',
      diagramComponentIds: ['retriever', 'kb_index'],
      codeSampleId: 'agentic_py',
      codeHighlightRange: [[10, 17]],
      awsServiceIds: ['bedrock_kb_managed', 'opensearch_serverless'],
      costNotes: ['Each hop is a retrieval call — bound the number of hops.'],
    },
    {
      id: 'synthesize',
      order: 4,
      title: 'Reason over combined evidence',
      plainExplanation:
        'With evidence for every part in hand, the model composes a single grounded, cited answer.',
      technicalDetail:
        'The agent reasons across the accumulated passages and returns a final answer. Because retrieval was targeted per sub-question, grounding is stronger than a single blended lookup.',
      diagramComponentIds: ['evidence', 'llm', 'agent_loop'],
      codeSampleId: 'agentic_py',
      codeHighlightRange: [[28, 33]],
      awsServiceIds: ['bedrock_foundation_models', 'strands_sdk'],
    },
  ],

  codeSamples: [
    {
      id: 'agentic_py',
      title: 'Model-driven retrieval loop',
      language: 'python',
      filename: 'agentic_agent.py',
      code: AGENTIC_PY,
      explanation:
        'Same retrieve tool as before — the difference is the agent decides how to use it. Single-shot Retrieve = exactly one lookup; agentic = the model plans, decomposes, and loops. Verify Strands loop/tool-call behavior against current docs.',
      annotations: [
        {
          lineRange: [10, 17],
          whatItDoes:
            'Defines the retrieval tool the agent may call — once, several times, or not at all.',
          technicalNote:
            'The docstring tells the model this is per sub-question, which enables multi-hop calls.',
          mapsToDiagramComponentId: 'retriever',
          docUrl:
            'https://docs.aws.amazon.com/bedrock/latest/APIReference/API_agent-runtime_Retrieve.html',
          verifyAgainstDocs: true,
        },
        {
          lineRange: [20, 23],
          whatItDoes:
            'The system prompt licenses the model to plan: decide whether to retrieve, decompose, and reason over combined evidence.',
          technicalNote:
            'This is the difference between single-shot Retrieve and agentic retrieval — it lives in the prompt + loop, not a special API.',
          mapsToDiagramComponentId: 'agent_loop',
        },
        {
          lineRange: 26,
          whatItDoes:
            'Assembles the Strands agent from a model, a system prompt, and the tools it may use.',
          mapsToDiagramComponentId: 'agent_loop',
          docUrl: 'https://strandsagents.com/',
        },
      ],
    },
  ],

  meridianStage: {
    stageTitle: 'Answer multi-step questions',
    whatItAdds:
      'Lets Meridian’s assistant tackle compound questions — comparing rules across roles or across policy versions — by planning and doing several targeted lookups instead of one.',
  },

  awsServiceIds: ['bedrock_kb_managed', 'opensearch_serverless', 'bedrock_foundation_models', 's3', 'strands_sdk'],

  references: [
    { label: 'RetrieveAndGenerate API reference (orchestration / query decomposition)', url: 'https://docs.aws.amazon.com/bedrock/latest/APIReference/API_agent-runtime_RetrieveAndGenerate.html', kind: 'api-reference' },
    { label: 'Amazon Bedrock Knowledge Bases', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html', kind: 'aws-docs' },
    { label: 'Strands Agents SDK — agent loop & tools', url: 'https://strandsagents.com/', kind: 'aws-docs' },
  ],

  accentColor: '#8B5CF6',
}
