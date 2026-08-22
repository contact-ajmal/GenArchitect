import type { RagArchitecture } from '../../types'

const RETRIEVE_PY = `from strands import Agent, tool
from strands.models import BedrockModel
import boto3

# Reference implementation — verify against current AWS docs.
kb = boto3.client("bedrock-agent-runtime")
KB_ID = "MERIDIANKB01"

@tool
def retrieve(query: str) -> list[dict]:
    """Hybrid retrieval with reranking for higher precision."""
    resp = kb.retrieve(
        knowledgeBaseId=KB_ID,
        retrievalQuery={"text": query},
        retrievalConfiguration={
            "vectorSearchConfiguration": {
                "numberOfResults": 25,            # over-fetch candidates
                "overrideSearchType": "HYBRID",   # BM25 + semantic
                "rerankingConfiguration": {
                    "type": "BEDROCK_RERANKING_MODEL",
                    "bedrockRerankingConfiguration": {
                        "numberOfRerankedResults": 5,
                        "modelConfiguration": {
                            "modelArn": "arn:aws:bedrock:us-west-2::foundation-model/amazon.rerank-v1:0"
                        },
                    },
                },
            }
        },
    )
    return [
        {"text": r["content"]["text"], "source": r["location"], "score": r["score"]}
        for r in resp["retrievalResults"]
    ]

model = BedrockModel(model_id="anthropic.claude-3-5-sonnet-20241022-v2:0")
agent = Agent(
    model=model,
    tools=[retrieve],
    system_prompt="Answer only from retrieved passages; cite each source.",
)

print(agent("What changed in the 2026 expense policy for EU travel?").message)
`

export const hybridRerankRag: RagArchitecture = {
  id: 'hybrid_rerank_rag',
  name: 'Hybrid + Rerank RAG',
  tagline: 'Precision retrieval: keyword + semantic, then a reranker picks the winners.',
  difficulty: 'intermediate',
  family: 'rag',

  summary:
    'Pure vector search misses exact terms (a policy code, a product name); pure keyword search misses meaning. Hybrid retrieval runs both, over-fetches candidates, then a reranker re-scores them so the few passages you actually send the model are the most relevant and current ones. This is the reliable default for enterprise RAG.',
  technicalSummary:
    'Over-fetch with hybrid search (BM25 + dense) for high recall, then apply a cross-encoder reranking model to re-order candidates for precision, keeping only the top-N. Pair it with a deliberate chunking strategy and incremental re-sync for freshness. In Bedrock this is expressed via the retrieval configuration (`overrideSearchType: HYBRID` + a reranking model); the reranker sits between retrieval and augmentation.',

  whenToUse: [
    'Answers hinge on exact identifiers or jargon as well as meaning.',
    'Top-k vector recall is good but precision is poor (near-miss passages).',
    'You need current passages and can run incremental syncs for freshness.',
  ],
  whenNotToUse: [
    'A tiny corpus where plain vector search already returns the right chunk.',
    'Ultra-low-latency paths where the extra rerank hop is unacceptable and unnecessary.',
  ],
  enterpriseConsiderations: [
    'Quality: reranking is usually the single biggest precision win after adopting a managed KB.',
    'Cost: reranking every candidate at a high fetch count adds per-query cost — cap candidates and cache.',
    'Freshness: define a re-sync cadence; stale indexes cause confidently wrong, well-cited answers.',
  ],

  layers: [
    { id: 'src', label: 'S3 corpus', layer: 'sources', role: 'corpus', awsServiceId: 's3' },
    { id: 'chunker', label: 'Chunking strategy', layer: 'ingestion', role: 'splitter', note: 'semantic / structured' },
    { id: 'kb_index', label: 'Hybrid index (BM25 + vectors)', layer: 'index', role: 'hybrid-index', awsServiceId: 'opensearch_serverless' },
    { id: 'hybrid_retriever', label: 'Hybrid retrieval', layer: 'retrieval', role: 'retriever', awsServiceId: 'bedrock_kb_managed', note: 'over-fetch ~25' },
    { id: 'reranker', label: 'Reranker', layer: 'retrieval', role: 'reranker', awsServiceId: 'bedrock_foundation_models', note: 'cross-encoder, top-N' },
    { id: 'context', label: 'Top-N cited context', layer: 'augmentation', role: 'augmenter' },
    { id: 'llm', label: 'LLM', layer: 'generation', role: 'generator', awsServiceId: 'bedrock_foundation_models' },
    { id: 'agent', label: 'Strands agent', layer: 'orchestration', role: 'orchestrator', awsServiceId: 'strands_sdk' },
  ],

  walkthrough: [
    {
      id: 'chunk',
      order: 1,
      title: 'Chunk deliberately and keep the index fresh',
      plainExplanation:
        'How documents are split decides what can be retrieved. Meridian splits along document structure (sections, tables) and re-syncs on changes so answers reflect the current policy.',
      technicalDetail:
        'Structure-aware chunking preserves semantic units and citation boundaries; incremental ingestion runs keep the index current. Chunking and freshness are upstream levers that bound achievable retrieval quality.',
      diagramComponentIds: ['src', 'chunker', 'kb_index'],
      awsServiceIds: ['s3', 'opensearch_serverless', 'bedrock_kb_managed'],
      tradeoffs: ['Bigger chunks = more context but noisier retrieval; smaller = precise but fragmented.'],
    },
    {
      id: 'hybrid',
      order: 2,
      title: 'Over-fetch with hybrid search',
      plainExplanation:
        'For each question, the assistant searches by keywords and by meaning at once, and deliberately pulls back more candidates than it needs — favoring recall first.',
      technicalDetail:
        'Hybrid search fuses BM25 and dense retrieval; `numberOfResults` is set high (~25) to maximize recall before precision filtering. This is the recall stage.',
      diagramComponentIds: ['hybrid_retriever', 'kb_index'],
      codeSampleId: 'retrieve_py',
      codeHighlightRange: [[17, 18]],
      awsServiceIds: ['bedrock_kb_managed', 'opensearch_serverless'],
    },
    {
      id: 'rerank',
      order: 3,
      title: 'Rerank for precision',
      plainExplanation:
        'A specialized model re-scores those candidates by how well they actually answer the question and keeps only the best few.',
      technicalDetail:
        'A cross-encoder reranking model re-orders candidates and truncates to top-N (~5). This precision stage is where near-miss passages are dropped before they ever reach the LLM.',
      diagramComponentIds: ['reranker', 'context'],
      codeSampleId: 'retrieve_py',
      codeHighlightRange: [[19, 28]],
      awsServiceIds: ['bedrock_foundation_models'],
      costNotes: ['Reranking cost scales with candidate count — tune the fetch/rerank ratio.'],
    },
    {
      id: 'generate',
      order: 4,
      title: 'Generate from the top passages',
      plainExplanation:
        'Only the highest-quality passages are handed to the model, which answers and cites them.',
      technicalDetail:
        'The agent sends the reranked top-N as context. Fewer, better passages improve grounding and reduce tokens versus stuffing a large top-k.',
      diagramComponentIds: ['llm', 'agent'],
      codeSampleId: 'retrieve_py',
      codeHighlightRange: [[36, 43]],
      awsServiceIds: ['bedrock_foundation_models', 'strands_sdk'],
    },
  ],

  codeSamples: [
    {
      id: 'retrieve_py',
      title: 'Hybrid retrieval + reranking as one tool',
      language: 'python',
      filename: 'hybrid_retrieve.py',
      code: RETRIEVE_PY,
      explanation:
        'The reranker sits inside the retrieval configuration: over-fetch with HYBRID, then keep the reranked top-N. Reranking model ARNs and config keys change often — verify against current AWS docs.',
    },
  ],

  meridianStage: {
    stageTitle: 'Retrieve the right, current passage',
    whatItAdds:
      'Raises retrieval precision so Meridian’s answers cite the exact, up-to-date clause rather than a plausible near-miss.',
  },

  awsServiceIds: ['bedrock_kb_managed', 'opensearch_serverless', 'bedrock_foundation_models', 's3', 'strands_sdk'],

  references: [
    { label: 'Amazon Bedrock Knowledge Bases', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html', kind: 'aws-docs' },
    { label: 'Rerank API (Bedrock Agent Runtime) reference', url: 'https://docs.aws.amazon.com/bedrock/latest/APIReference/API_agent-runtime_Rerank.html', kind: 'api-reference' },
    { label: 'Amazon OpenSearch Serverless — vector search', url: 'https://docs.aws.amazon.com/opensearch-service/latest/developerguide/serverless.html', kind: 'aws-docs' },
  ],

  accentColor: '#14B8A6',
}
