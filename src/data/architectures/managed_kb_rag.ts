import type { RagArchitecture } from '../../types'

const CONNECTORS_SH = `# Create a Bedrock Knowledge Base data source and start ingestion.
# Reference implementation — verify against current AWS CLI docs.

# Native connectors: S3, SharePoint, Confluence, Google Drive, OneDrive, Web.
aws bedrock-agent create-data-source \\
  --knowledge-base-id "MERIDIANKB01" \\
  --name "sharepoint-policies" \\
  --data-source-configuration file://sharepoint-source.json

# Kick off managed parsing, chunking, embedding, and indexing.
aws bedrock-agent start-ingestion-job \\
  --knowledge-base-id "MERIDIANKB01" \\
  --data-source-id "DSSHAREPOINT1"
`

const AGENT_PY = `from strands import Agent, tool
from strands.models import BedrockModel
import boto3

# Reference implementation — verify against current AWS/Strands docs.
kb = boto3.client("bedrock-agent-runtime")
KB_ID = "MERIDIANKB01"

@tool
def retrieve(query: str, top_k: int = 5) -> list[dict]:
    """Retrieve cited passages from the managed Knowledge Base."""
    resp = kb.retrieve(
        knowledgeBaseId=KB_ID,
        retrievalQuery={"text": query},
        retrievalConfiguration={
            "vectorSearchConfiguration": {"numberOfResults": top_k}
        },
    )
    return [
        {
            "text": r["content"]["text"],
            "source": r["location"],   # citation metadata from the KB
            "score": r["score"],
        }
        for r in resp["retrievalResults"]
    ]

model = BedrockModel(model_id="anthropic.claude-3-5-sonnet-20241022-v2:0")
agent = Agent(
    model=model,
    system_prompt="Answer only from retrieved passages and cite each source.",
    tools=[retrieve],
)

print(agent("Summarize our EU client data-retention policy.").message)
`

export const managedKbRag: RagArchitecture = {
  id: 'managed_kb_rag',
  name: 'Managed Knowledge Base RAG',
  tagline: 'Delete the pipeline: let Bedrock own ingestion, indexing, and citations.',
  difficulty: 'intermediate',

  summary:
    'Instead of hand-building the chunk → embed → index pipeline, point a Bedrock Managed Knowledge Base at your sources. It connects natively to S3, SharePoint, Confluence and more, parses and embeds automatically, stores the vectors for you, and returns passages with citations — so you focus on the assistant, not the plumbing.',
  technicalSummary:
    'Bedrock Knowledge Bases with a managed (quick-create) vector store. Native connectors sync sources; Bedrock handles parsing, chunking, embedding, and indexing, and enforces document-level access metadata from connectors like SharePoint. Retrieval uses the Retrieve API (passages + citations) or RetrieveAndGenerate; a Strands agent calls Retrieve as a tool. This removes the undifferentiated heavy lifting of naive RAG.',

  whenToUse: [
    'You want production RAG quickly without owning embedding/index lifecycle.',
    'Your content lives in supported sources (S3, SharePoint, Confluence, Drive, OneDrive, web).',
    'You need citations and connector-provided access metadata out of the box.',
  ],
  whenNotToUse: [
    'You require a specific vector store or index configuration the managed store does not expose (use the customer-managed variant).',
    'Your sources are unsupported by connectors and cannot be staged into S3.',
    'You need deeply custom chunking/parsing that the managed pipeline cannot express.',
  ],
  enterpriseConsiderations: [
    'Security: connectors can carry document-level ACL metadata so retrieval is filtered per user — a prerequisite for Meridian.',
    'Ops: Bedrock manages re-embedding on ingestion runs; you schedule/trigger syncs instead of maintaining a pipeline.',
    'Cost: you trade some control for managed storage and embedding costs; still far less operational overhead than DIY.',
  ],

  layers: [
    { id: 'src_s3', label: 'S3 corpus', layer: 'sources', role: 'corpus', awsServiceId: 's3' },
    { id: 'src_sharepoint', label: 'SharePoint', layer: 'sources', role: 'connector-source', note: 'ACL metadata' },
    { id: 'src_confluence', label: 'Confluence', layer: 'sources', role: 'connector-source' },
    { id: 'connectors', label: 'Native connectors', layer: 'ingestion', role: 'connector', awsServiceId: 'bedrock_kb_managed' },
    { id: 'kb_pipeline', label: 'Managed parse + embed', layer: 'ingestion', role: 'managed-pipeline', awsServiceId: 'bedrock_kb_managed' },
    { id: 'kb_index', label: 'Managed vector store', layer: 'index', role: 'managed-index', awsServiceId: 'opensearch_serverless' },
    { id: 'retrieve_api', label: 'Retrieve API', layer: 'retrieval', role: 'retriever', awsServiceId: 'bedrock_kb_managed' },
    { id: 'citations', label: 'Cited context', layer: 'augmentation', role: 'augmenter' },
    { id: 'llm', label: 'LLM', layer: 'generation', role: 'generator', awsServiceId: 'bedrock_foundation_models' },
    { id: 'agent', label: 'Strands agent', layer: 'orchestration', role: 'orchestrator', awsServiceId: 'strands_sdk' },
  ],

  walkthrough: [
    {
      id: 'connect',
      order: 1,
      title: 'Connect sources with native connectors',
      plainExplanation:
        'You register Meridian’s document locations — S3, SharePoint, Confluence — and Bedrock ingests them for you: reading, splitting, embedding, and storing every document automatically.',
      technicalDetail:
        'Create a Knowledge Base and one data source per system. An ingestion job performs managed parsing, chunking, embedding, and indexing into the managed vector store. Connectors like SharePoint carry access-control metadata used later to filter retrieval per user.',
      diagramComponentIds: ['src_s3', 'src_sharepoint', 'src_confluence', 'connectors', 'kb_pipeline', 'kb_index'],
      codeSampleId: 'connectors_sh',
      codeHighlightRange: [[5, 8], [11, 13]],
      awsServiceIds: ['bedrock_kb_managed', 's3', 'opensearch_serverless'],
      costNotes: ['You pay for managed embedding and vector storage; schedule syncs to control ingestion spend.'],
    },
    {
      id: 'retrieve',
      order: 2,
      title: 'Retrieve cited passages',
      plainExplanation:
        'When a question arrives, the assistant asks the Knowledge Base for the most relevant passages, which come back with citations pointing at the exact source.',
      technicalDetail:
        'A Strands @tool calls the Retrieve API with the query text and a results count. Bedrock returns passages plus `location` citation metadata and scores — no embedding or index code on your side.',
      diagramComponentIds: ['retrieve_api', 'kb_index', 'citations'],
      codeSampleId: 'agent_py',
      codeHighlightRange: [[9, 26]],
      awsServiceIds: ['bedrock_kb_managed'],
    },
    {
      id: 'generate',
      order: 3,
      title: 'Generate a grounded, cited answer',
      plainExplanation:
        'The passages are handed to the model, which answers using only that context and cites each source.',
      technicalDetail:
        'The Strands agent wires the model, prompt, and Retrieve tool. (RetrieveAndGenerate can do retrieval + generation in one managed call, but calling Retrieve as a tool keeps the agent in control of the loop.)',
      diagramComponentIds: ['llm', 'agent'],
      codeSampleId: 'agent_py',
      codeHighlightRange: [[28, 33]],
      awsServiceIds: ['bedrock_foundation_models', 'strands_sdk'],
    },
  ],

  codeSamples: [
    {
      id: 'connectors_sh',
      title: 'Create a data source and run ingestion',
      language: 'bash',
      filename: 'connect_sources.sh',
      code: CONNECTORS_SH,
      explanation:
        'Native connectors replace the entire hand-built ingestion file from naive RAG. CLI action/parameter names change often — verify against current AWS CLI docs for bedrock-agent.',
    },
    {
      id: 'agent_py',
      title: 'Strands agent over the Knowledge Base Retrieve API',
      language: 'python',
      filename: 'kb_agent.py',
      code: AGENT_PY,
      explanation:
        'Retrieval is now a single Retrieve API call returning passages with citations — the reduction in undifferentiated heavy lifting is the whole point. Verify API shapes and model IDs against current AWS docs.',
    },
  ],

  meridianStage: {
    stageTitle: 'Ground answers in the real corpus',
    whatItAdds:
      'Connects Meridian’s actual documents across S3, SharePoint, and Confluence with managed ingestion and built-in citations — no bespoke connector or pipeline to maintain.',
  },

  awsServiceIds: ['bedrock_kb_managed', 's3', 'opensearch_serverless', 'bedrock_foundation_models', 'strands_sdk'],

  references: [
    { label: 'Amazon Bedrock Knowledge Bases', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html', kind: 'aws-docs' },
    { label: 'Retrieve API (Bedrock Agent Runtime) reference', url: 'https://docs.aws.amazon.com/bedrock/latest/APIReference/API_agent-runtime_Retrieve.html', kind: 'api-reference' },
    { label: 'Strands Agents SDK documentation', url: 'https://strandsagents.com/', kind: 'aws-docs' },
  ],

  accentColor: '#0EA5E9',
}
