import type { RagArchitecture } from '../../types'

const AGENT_PY = `from strands import Agent, tool
from strands.models import BedrockModel
import boto3

# Reference implementation — verify against current Strands/AWS docs.
_bedrock = boto3.client("bedrock-runtime")
_index = OpenSearchVectorIndex("meridian-policies")  # your own client

@tool
def retrieve(query: str, top_k: int = 5) -> list[dict]:
    """Embed the query and return the top_k most similar chunks."""
    vector = embed(query, client=_bedrock)      # amazon.titan-embed-text-v2
    hits = _index.knn_search(vector, k=top_k)   # cosine k-NN over the index
    return [{"text": h.text, "source": h.source} for h in hits]

model = BedrockModel(
    model_id="anthropic.claude-3-5-sonnet-20241022-v2:0",
    region_name="us-west-2",
)

SYSTEM_PROMPT = (
    "Answer only from the retrieved context and cite the source of each fact. "
    "If the context is insufficient, say so rather than guessing."
)

agent = Agent(model=model, system_prompt=SYSTEM_PROMPT, tools=[retrieve])

answer = agent("What is our travel expense reimbursement limit?")
print(answer.message)
`

const INGEST_PY = `# Offline ingestion — run once, then whenever documents change.
# Reference implementation — verify against current AWS SDK docs.
import boto3

s3 = boto3.client("s3")
bedrock = boto3.client("bedrock-runtime")
index = OpenSearchVectorIndex("meridian-policies")

for doc in list_documents(s3, bucket="meridian-corpus"):
    text = extract_text(doc)                       # parse PDF / HTML
    for chunk in split(text, size=512, overlap=64):
        vector = embed(chunk, client=bedrock)      # amazon.titan-embed-text-v2
        index.upsert(vector=vector, text=chunk, source=doc.key)
`

export const naiveRag: RagArchitecture = {
  id: 'naive_rag',
  name: 'Naive RAG',
  tagline: 'The baseline: embed, retrieve once, stuff the context, generate.',
  difficulty: 'foundational',

  summary:
    'The simplest retrieval-augmented generation: split documents into chunks, turn them into vectors, find the closest few to a question, paste them into the prompt, and let the model answer. It is the right first thing to build — and the fastest way to see where RAG needs hardening.',
  technicalSummary:
    'A hand-built pipeline over a customer-managed vector store. An offline job chunks and embeds the corpus into an ANN index; at query time a single similarity search returns top-k chunks that are concatenated into the prompt. There is no access control, no keyword signal, no reranking, and no query planning — retrieval is one fixed lookup per question.',

  whenToUse: [
    'A prototype or internal demo to prove RAG on your own content.',
    'A small, non-sensitive corpus where everyone may see everything.',
    'Learning the moving parts (chunking, embeddings, ANN search) before adopting managed services.',
  ],
  whenNotToUse: [
    'Any corpus with per-user access requirements — there are no document-level ACLs here.',
    'Questions needing multi-hop reasoning or precise retrieval (naive top-k misses).',
    'Production workloads where you would rather not own embedding, indexing, and freshness.',
  ],
  enterpriseConsiderations: [
    'Security: no access control — every chunk is retrievable by anyone. Not acceptable for Meridian’s mixed-sensitivity corpus.',
    'Quality: single-shot similarity search is prone to near-miss retrieval and unsupported (hallucinated) answers; grounding depends entirely on chunking quality.',
    'Ops/cost: you own the embedding model choice, the index lifecycle, and re-embedding on document change — undifferentiated heavy lifting that managed KBs remove.',
  ],

  layers: [
    { id: 'src_docs', label: 'Source docs', layer: 'sources', role: 'corpus', awsServiceId: 's3', note: 'PDFs/HTML in S3' },
    { id: 'chunker', label: 'Chunker', layer: 'ingestion', role: 'splitter', note: 'fixed-size + overlap' },
    { id: 'embedder', label: 'Embedder', layer: 'ingestion', role: 'embedder', awsServiceId: 'bedrock_foundation_models' },
    { id: 'vector_store', label: 'Vector store', layer: 'index', role: 'ann-index', awsServiceId: 'opensearch_serverless' },
    { id: 'retriever', label: 'Similarity search', layer: 'retrieval', role: 'retriever', note: 'top-k k-NN' },
    { id: 'context', label: 'Context stuffing', layer: 'augmentation', role: 'augmenter' },
    { id: 'llm', label: 'LLM', layer: 'generation', role: 'generator', awsServiceId: 'bedrock_foundation_models' },
    { id: 'agent', label: 'Strands agent', layer: 'orchestration', role: 'orchestrator', awsServiceId: 'strands_sdk' },
  ],

  walkthrough: [
    {
      id: 'ingest',
      order: 1,
      title: 'Ingest and embed the corpus (offline)',
      plainExplanation:
        'Before any question is asked, the documents are chopped into small chunks and each chunk is turned into a vector — a list of numbers capturing its meaning — and stored in a search index.',
      technicalDetail:
        'A batch job extracts text, splits it into overlapping chunks (~512 tokens, ~64 overlap), embeds each with a Bedrock embedding model, and upserts the vectors into an ANN index. Chunk size and overlap dominate downstream quality.',
      diagramComponentIds: ['src_docs', 'chunker', 'embedder', 'vector_store'],
      codeSampleId: 'ingest_py',
      codeHighlightRange: [[9, 13]],
      awsServiceIds: ['s3', 'bedrock_foundation_models', 'opensearch_serverless'],
      tradeoffs: ['Chunking strategy is a quality lever you now own and must tune.'],
    },
    {
      id: 'retrieve',
      order: 2,
      title: 'Retrieve the nearest chunks',
      plainExplanation:
        'When someone asks a question, the assistant embeds the question the same way and pulls back the handful of chunks whose vectors are closest.',
      technicalDetail:
        'A Strands @tool embeds the query and runs a cosine k-NN search, returning the top-k chunks with their source. This is a single, fixed retrieval — no keyword signal, no reranking, no decision about whether to retrieve.',
      diagramComponentIds: ['retriever', 'embedder', 'vector_store'],
      codeSampleId: 'agent_py',
      codeHighlightRange: [[9, 14]],
      awsServiceIds: ['opensearch_serverless', 'bedrock_foundation_models', 'strands_sdk'],
      tradeoffs: ['Top-k similarity often returns near-misses; there is no second-stage precision filter.'],
    },
    {
      id: 'generate',
      order: 3,
      title: 'Stuff the context and generate',
      plainExplanation:
        'The retrieved chunks are pasted into the prompt and the model writes an answer, instructed to use only that context and to cite it.',
      technicalDetail:
        'The model + system prompt + tools form the Strands agent. The prompt constrains the model to the retrieved context and asks for citations, but nothing enforces grounding — if retrieval missed, the model may still answer.',
      diagramComponentIds: ['context', 'llm', 'agent'],
      codeSampleId: 'agent_py',
      codeHighlightRange: [[17, 26]],
      awsServiceIds: ['bedrock_foundation_models', 'strands_sdk'],
      securityNotes: ['No document-level ACLs: any user can surface any chunk.'],
    },
  ],

  codeSamples: [
    {
      id: 'ingest_py',
      title: 'Offline ingestion pipeline',
      language: 'python',
      filename: 'ingest.py',
      code: INGEST_PY,
      explanation:
        'The undifferentiated heavy lifting you own in naive RAG: parsing, chunking, embedding, and indexing. Managed Knowledge Bases replace this file entirely. Verify embedding model IDs against current AWS docs.',
    },
    {
      id: 'agent_py',
      title: 'Minimal Strands agent with a retrieval tool',
      language: 'python',
      filename: 'agent.py',
      code: AGENT_PY,
      explanation:
        'The canonical Strands shape — model + system prompt + tools. The @tool decorator turns a plain function into something the model can call. Here retrieval always runs once. Verify Strands and Bedrock model IDs against current docs.',
    },
  ],

  meridianStage: {
    stageTitle: 'Prove the concept',
    whatItAdds:
      'Shows RAG working on a slice of Meridian’s policy documents — and surfaces exactly what must be fixed next: access control, retrieval precision, and grounding.',
    narrative:
      'Meridian starts here to build intuition. The demo answers expense-policy questions, but anyone can retrieve anything and answers occasionally drift from the sources — motivating every later stage.',
  },

  awsServiceIds: ['s3', 'opensearch_serverless', 'bedrock_foundation_models', 'strands_sdk'],

  references: [
    { label: 'Retrieval-Augmented Generation on AWS (Bedrock User Guide)', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html', kind: 'aws-docs' },
    { label: 'Amazon OpenSearch Serverless — vector search', url: 'https://docs.aws.amazon.com/opensearch-service/latest/developerguide/serverless.html', kind: 'aws-docs' },
    { label: 'Strands Agents SDK documentation', url: 'https://strandsagents.com/', kind: 'aws-docs' },
  ],

  accentColor: '#64748B',
}
