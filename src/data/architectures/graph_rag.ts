import type { RagArchitecture } from '../../types'

const GRAPH_PY = `from strands import Agent, tool
from strands.models import BedrockModel
import boto3

# Reference implementation — verify against current AWS docs.
# This KB was created with a Neptune Analytics graph store (GraphRAG):
# Bedrock extracts entities and relationships during ingestion.
kb = boto3.client("bedrock-agent-runtime")
GRAPH_KB_ID = "MERIDIANGRAPH1"

@tool
def graph_retrieve(query: str, top_k: int = 10) -> list[dict]:
    """Retrieve passages using graph-aware traversal over related entities."""
    resp = kb.retrieve(
        knowledgeBaseId=GRAPH_KB_ID,
        retrievalQuery={"text": query},
        retrievalConfiguration={"vectorSearchConfiguration": {"numberOfResults": top_k}},
    )
    return [{"text": r["content"]["text"], "source": r["location"]} for r in resp["retrievalResults"]]

model = BedrockModel(model_id="anthropic.claude-3-5-sonnet-20241022-v2:0")
agent = Agent(
    model=model,
    tools=[graph_retrieve],
    system_prompt="Answer relationship questions from connected evidence; cite sources.",
)

# Needs traversal: controls -> regulations -> the product they govern.
print(agent("Which internal controls cover the regulations that apply to Product X?").message)
`

export const graphRag: RagArchitecture = {
  id: 'graph_rag',
  name: 'GraphRAG',
  tagline: 'Retrieve by relationships, not just similarity.',
  difficulty: 'advanced',

  summary:
    'Some questions are about how things connect — which regulations govern a product, which controls satisfy those regulations. Pure vector search finds passages that look similar to the question, but it can’t traverse relationships. GraphRAG builds a knowledge graph of entities and their links, so the assistant can follow connections across documents.',
  technicalSummary:
    'During ingestion, Bedrock (with a Neptune Analytics graph store) extracts entities and relationships into a knowledge graph alongside vector embeddings. Retrieval combines semantic search with graph traversal, so multi-hop, relationship-centric questions pull in connected evidence a flat vector index would miss. Graph beats pure vector when the answer depends on paths between entities rather than surface similarity.',

  whenToUse: [
    'Questions requiring multi-hop traversal across related entities (A governs B, B requires C).',
    'Corpora rich in cross-references (regulations, controls, products, policies).',
    'Aggregations over relationships ("all products affected by regulation Y").',
  ],
  whenNotToUse: [
    'Straightforward lookup questions where semantic similarity already suffices.',
    'Sparse or unstructured content with few meaningful entity relationships.',
    'Teams not ready to operate a graph store and entity extraction.',
  ],
  enterpriseConsiderations: [
    'Quality: dramatically better on relationship questions; little benefit (and more cost) on simple lookups.',
    'Ops/cost: a graph store (Neptune Analytics) plus entity extraction adds ingestion complexity and cost versus a plain vector index.',
    'Data modeling: extraction quality bounds traversal quality — validate the entities/relations that get built.',
  ],

  layers: [
    { id: 'src', label: 'Docs (entities & relations)', layer: 'sources', role: 'corpus', awsServiceId: 's3' },
    { id: 'entity_extractor', label: 'Entity + relation extraction', layer: 'ingestion', role: 'graph-builder', awsServiceId: 'bedrock_kb_customer_managed', note: 'during ingestion' },
    { id: 'graph_store', label: 'Knowledge graph', layer: 'index', role: 'graph-index', awsServiceId: 'neptune', note: 'Neptune Analytics (+ vectors)' },
    { id: 'graph_retriever', label: 'Graph-aware retrieval', layer: 'retrieval', role: 'retriever', awsServiceId: 'bedrock_kb_customer_managed', note: 'multi-hop traversal + semantic' },
    { id: 'context', label: 'Connected evidence', layer: 'augmentation', role: 'augmenter' },
    { id: 'llm', label: 'LLM', layer: 'generation', role: 'generator', awsServiceId: 'bedrock_foundation_models' },
    { id: 'agent', label: 'Strands agent', layer: 'orchestration', role: 'orchestrator', awsServiceId: 'strands_sdk' },
  ],

  walkthrough: [
    {
      id: 'build_graph',
      order: 1,
      title: 'Build a knowledge graph at ingestion',
      plainExplanation:
        'As documents are ingested, the system pulls out the important things (regulations, controls, products) and the links between them, forming a graph on top of the usual vector index.',
      technicalDetail:
        'Bedrock GraphRAG extracts entities and relationships into a Neptune Analytics graph while also embedding chunks. The graph captures structure that a flat vector store discards.',
      diagramComponentIds: ['src', 'entity_extractor', 'graph_store'],
      codeSampleId: 'graph_py',
      codeHighlightRange: [[5, 9]],
      awsServiceIds: ['bedrock_kb_customer_managed', 'neptune', 's3'],
      costNotes: ['Entity extraction + a graph store add ingestion cost over a plain vector index.'],
    },
    {
      id: 'traverse',
      order: 2,
      title: 'Traverse relationships at query time',
      plainExplanation:
        'For a relationship question, the assistant follows the links — from a product to the regulations that apply, to the controls that satisfy them — gathering evidence along the path.',
      technicalDetail:
        'Retrieval combines semantic matching with graph traversal, returning connected passages across multiple hops. This is what pure vector top-k cannot do: it has no notion of paths between entities.',
      diagramComponentIds: ['graph_retriever', 'graph_store', 'context'],
      codeSampleId: 'graph_py',
      codeHighlightRange: [[11, 19]],
      awsServiceIds: ['bedrock_kb_customer_managed', 'neptune'],
    },
    {
      id: 'answer',
      order: 3,
      title: 'Answer the relationship question',
      plainExplanation:
        'The model composes an answer from the connected evidence, citing each source in the chain.',
      technicalDetail:
        'The agent synthesizes over the traversed subgraph’s passages. Citations can span several documents linked only through the graph.',
      diagramComponentIds: ['llm', 'agent'],
      codeSampleId: 'graph_py',
      codeHighlightRange: [[21, 29]],
      awsServiceIds: ['bedrock_foundation_models', 'strands_sdk'],
    },
  ],

  codeSamples: [
    {
      id: 'graph_py',
      title: 'Agent over a GraphRAG knowledge base',
      language: 'python',
      filename: 'graph_agent.py',
      code: GRAPH_PY,
      explanation:
        'The retrieve call looks familiar, but the KB is backed by a Neptune Analytics graph, so retrieval traverses relationships. GraphRAG setup and options change often — verify against current AWS docs.',
    },
  ],

  meridianStage: {
    stageTitle: 'Answer relationship questions',
    whatItAdds:
      'Lets Meridian answer traversal questions — how regulations, controls, and products relate — that flat vector retrieval cannot express.',
  },

  awsServiceIds: ['bedrock_kb_customer_managed', 'neptune', 'bedrock_foundation_models', 's3', 'strands_sdk'],

  references: [
    { label: 'Amazon Neptune — user guide', url: 'https://docs.aws.amazon.com/neptune/latest/userguide/intro.html', kind: 'aws-docs' },
    { label: 'Amazon Neptune Analytics', url: 'https://docs.aws.amazon.com/neptune-analytics/latest/userguide/what-is-neptune-analytics.html', kind: 'aws-docs' },
    { label: 'Amazon Bedrock Knowledge Bases', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html', kind: 'aws-docs' },
  ],

  accentColor: '#EC4899',
}
