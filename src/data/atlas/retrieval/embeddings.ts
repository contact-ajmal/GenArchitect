import type { AtlasSection, AtlasTopic } from '../../../atlas/types'

const S = 'embeddings'
const MODELS_DOCS = 'https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html'
const KB_DOCS = 'https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html'

type T = Omit<AtlasTopic, 'atlasId' | 'sectionId'>
const t = (x: T): AtlasTopic => ({ ...x, atlasId: 'retrieval', sectionId: S })

export const embeddings: AtlasSection = {
  id: S,
  atlasId: 'retrieval',
  title: 'Embeddings',
  order: 2,
  blurb:
    'How text becomes a vector, which model to embed it with, and what it costs you to change your mind later.',
  topics: [
    t({
      id: 'what-is-an-embedding',
      title: 'What an embedding actually is',
      oneLiner:
        'A model reads a chunk and emits a list of numbers positioned so that texts about the same thing land near each other.',
      whyItMatters:
        'Everything retrieval does rests on one assumption: that nearness in this space means relatedness in meaning. Knowing where that assumption holds — and the specific places it fails — is what separates tuning a system from guessing at it.',
      explanation: {
        plain:
          'An embedding model turns a piece of text into a long list of numbers, which you can think of as coordinates. Texts that mean similar things get similar coordinates, so they end up near each other. Searching is then just geometry: embed the question the same way, and look for the nearest pieces of text.',
        technical:
          'The model maps text to a dense fixed-length vector — commonly 256 to 1536 dimensions — trained so that semantically related inputs have small angular distance. Because the length is fixed regardless of input length, a long chunk and a short one are equally comparable, which is exactly why chunk size changes what a vector means: a chunk spanning several topics produces a vector that sits between all of them and is strongly similar to none. Two failure modes matter in practice. Embeddings capture topical similarity, not logical relationships — "claims must be filed within 30 days" and "claims need not be filed within 30 days" are near neighbours. And they carry no notion of recency or authority, so a superseded policy embeds just as strongly as the current one. Both are handled with metadata and reranking, not with a better embedding model.',
      },
      visual: {
        kind: 'vector_space',
        query: { label: 'how long do I have to report a claim?', x: 42, y: 48 },
        topK: 3,
        groups: [
          { id: 'claims', label: 'Claims policy' },
          { id: 'hr', label: 'HR handbook' },
          { id: 'finance', label: 'Finance' },
        ],
        points: [
          { id: 'p1', label: 'notification-window', x: 34, y: 38, group: 'claims', similarity: 0.89, meta: { doc: 'claims-policy' } },
          { id: 'p2', label: 'late-notification', x: 54, y: 40, group: 'claims', similarity: 0.84, meta: { doc: 'claims-policy' } },
          { id: 'p3', label: 'settlement-timing', x: 30, y: 62, group: 'claims', similarity: 0.71, meta: { doc: 'claims-policy' } },
          { id: 'p4', label: 'evidence-list', x: 58, y: 60, group: 'claims', similarity: 0.66, meta: { doc: 'claims-policy' } },
          { id: 'p5', label: 'complex-claims', x: 24, y: 58, group: 'claims', similarity: 0.63, meta: { doc: 'claims-policy' } },
          { id: 'p6', label: 'leave-policy', x: 76, y: 26, group: 'hr', similarity: 0.41, meta: { doc: 'hr-handbook' } },
          { id: 'p7', label: 'pricing-fy26', x: 84, y: 68, group: 'finance', similarity: 0.33, meta: { doc: 'finance' } },
          { id: 'p8', label: 'onboarding', x: 72, y: 88, group: 'hr', similarity: 0.29, meta: { doc: 'hr-handbook' } },
          { id: 'p9', label: 'security-standard', x: 4, y: 10, group: 'finance', similarity: 0.27, meta: { doc: 'finance' } },
        ],
        note: 'Two dimensions here stand in for a thousand or more — the real space cannot be drawn, and projecting it to a page distorts distances. What survives the projection is the part that matters: the claims chunks cluster, the HR and finance chunks do not, and top-3 draws its line to whatever is nearest whether or not it deserves to be.',
      },
      docUrl: MODELS_DOCS,
      verificationId: 'bedrock_foundation_models',
      coverageStatus: 'full',
      tags: ['embeddings', 'vectors', 'similarity', 'flagship'],
      relatedTopicIds: ['distance-metrics', 'embedding-models', 'hybrid-search'],
      appliedIn: [
        { label: 'Naive RAG — embedding is the whole retrieval story', to: '/architecture/naive_rag' },
      ],
    }),

    t({
      id: 'embedding-models',
      title: 'Choosing an embedding model',
      oneLiner:
        'On Bedrock the practical choice is Titan Text Embeddings or Cohere Embed — and the deciding factors are rarely benchmark scores.',
      whyItMatters:
        'The embedding model is the hardest component to change after launch, because changing it invalidates every vector you have ever stored. It deserves more thought up front than the generation model, which you can swap on a Tuesday afternoon.',
      explanation: {
        plain:
          'A handful of models are available to turn your text into vectors. They differ in how many languages they handle well, how many numbers they produce per chunk, and whether they let you tell them apart a document from a question. Pick for your corpus — the language it is written in and the jargon it uses — rather than for a leaderboard position.',
        technical:
          'Three axes decide it in practice. Language coverage: multilingual variants exist for both families and matter enormously if your corpus is not monolingual English. Asymmetry: Cohere’s models take an input type parameter distinguishing documents from queries, and using the wrong one at query time is a silent, significant quality loss — Titan does not make this distinction. Dimensionality: fewer dimensions means less storage and faster search, and Titan V2 lets you request a smaller output size directly. Domain fit beats general benchmark position; a model that scores well on open-web retrieval may do worse on dense legal or clinical language than one that scores lower overall. Check the exact model identifiers, supported dimensions and input limits against the current Bedrock model documentation — this list moves.',
      },
      visual: {
        kind: 'comparison_matrix',
        columns: ['Titan Text Embeddings V2', 'Cohere Embed (English / Multilingual)', 'Bring your own'],
        rows: [
          {
            label: 'Output dimensions',
            cells: [
              { text: 'Selectable — 1024, 512 or 256', tone: 'good' },
              { text: 'Fixed at the model’s native size', tone: 'neutral' },
              { text: 'Whatever the model emits', tone: 'neutral' },
            ],
            note: 'Fewer dimensions means cheaper storage and faster search.',
          },
          {
            label: 'Query vs document asymmetry',
            cells: [
              { text: 'No distinction — embed both the same way', tone: 'neutral' },
              { text: 'Input type parameter separates them', tone: 'good' },
              { text: 'Model-dependent', tone: 'neutral' },
            ],
            note: 'Where the distinction exists, getting it wrong at query time costs quality silently.',
          },
          {
            label: 'Multilingual corpora',
            cells: [
              { text: 'Multilingual support in the V2 family', tone: 'neutral' },
              { text: 'A dedicated multilingual variant', tone: 'good' },
              { text: 'Depends entirely on the model', tone: 'neutral' },
            ],
          },
          {
            label: 'Managed knowledge base support',
            cells: [
              { text: 'Selectable directly', tone: 'good' },
              { text: 'Selectable directly', tone: 'good' },
              { text: 'Needs a customer-managed pipeline', tone: 'bad' },
            ],
            note: 'Choosing a model outside the managed list means owning ingestion yourself.',
          },
          {
            label: 'Operational burden',
            cells: [
              { text: 'Serverless, no capacity to manage', tone: 'good' },
              { text: 'Serverless, no capacity to manage', tone: 'good' },
              { text: 'You host, scale and patch it', tone: 'bad' },
            ],
          },
        ],
      },
      docUrl: MODELS_DOCS,
      verificationId: 'bedrock_foundation_models',
      coverageStatus: 'full',
      tags: ['titan', 'cohere', 'model selection', 'embeddings'],
      relatedTopicIds: ['dimensions-truncation', 're-embedding-drift'],
    }),

    t({
      id: 'dimensions-truncation',
      title: 'Dimensions, truncation and what you give up',
      oneLiner:
        'Some models are trained so the first N numbers are the most informative — letting you cut the vector short and keep most of the quality.',
      whyItMatters:
        'Vector storage and search cost scale with dimensions, and at corpus scale that is a line item you can halve deliberately. It is one of the few retrieval knobs where the trade is explicit and measurable rather than a matter of taste.',
      explanation: {
        plain:
          'A vector with 1024 numbers costs four times as much to store and search as one with 256. Some models are trained so that the earlier numbers carry the most meaning, which means you can simply keep the first 256 and throw the rest away — losing some accuracy, but far less than you would expect from discarding three quarters of the data.',
        technical:
          'This is the Matryoshka representation idea: training so that leading sub-vectors are themselves usable representations, nested like the dolls. Titan Text Embeddings V2 exposes it as a selectable output dimension. The economics are straightforward — index memory, storage and per-query distance computation all scale roughly linearly with dimension count, so 1024 → 256 is close to a 4× reduction in the vector-store bill and a meaningful latency win at scale. The accuracy loss is real but usually small, and crucially it is measurable before you commit: embed a sample at both sizes and compare recall@k on a golden set. The rule that is not negotiable is consistency — queries and documents must be embedded at the same dimension by the same model, or the distances are meaningless.',
      },
      visual: {
        kind: 'comparison_matrix',
        columns: ['1024 dimensions', '512 dimensions', '256 dimensions'],
        rows: [
          {
            label: 'Relative vector storage',
            cells: [
              { text: 'Baseline', tone: 'neutral' },
              { text: '≈ half', tone: 'good' },
              { text: '≈ a quarter', tone: 'good' },
            ],
            note: 'Applies to index memory as well as at-rest storage.',
          },
          {
            label: 'Distance computation per query',
            cells: [
              { text: 'Baseline', tone: 'neutral' },
              { text: '≈ half the work', tone: 'good' },
              { text: '≈ a quarter the work', tone: 'good' },
            ],
          },
          {
            label: 'Retrieval quality',
            cells: [
              { text: 'Highest available', tone: 'good' },
              { text: 'Slightly reduced', tone: 'neutral' },
              { text: 'Noticeably reduced on fine distinctions', tone: 'bad' },
            ],
            note: 'Measure it on your own corpus — the size of the loss is corpus-specific, not universal.',
          },
          {
            label: 'When to pick it',
            cells: [
              'Small corpus, or quality is the binding constraint',
              'A sensible default at scale once measured',
              'Very large corpus where storage dominates cost',
            ],
          },
        ],
      },
      docUrl: MODELS_DOCS,
      verificationId: 'bedrock_foundation_models',
      coverageStatus: 'full',
      tags: ['dimensions', 'matryoshka', 'cost', 'embeddings'],
      relatedTopicIds: ['embedding-models', 'index-sizing'],
    }),

    t({
      id: 'distance-metrics',
      title: 'Distance metrics and normalisation',
      oneLiner:
        'Cosine, dot product and Euclidean answer slightly different questions — and on normalised vectors two of them are the same question.',
      whyItMatters:
        'The metric is configured once when the index is created and is frequently left at a default that does not match how the embedding model was trained. It is a five-minute check that occasionally explains months of mediocre retrieval.',
      explanation: {
        plain:
          'Once text is a set of coordinates, you need a rule for what "near" means. One rule cares only about direction, ignoring how long the vector is. Another multiplies direction by length, so longer vectors score higher. A third measures straight-line distance. If the model already makes all its vectors the same length, the first two rules agree.',
        technical:
          'Cosine similarity measures the angle only and is scale-invariant. Dot product incorporates magnitude, which rewards vectors with larger norms — useful when magnitude encodes something meaningful, actively harmful when it merely reflects chunk length. Euclidean (L2) distance measures absolute separation. On unit-normalised vectors, cosine ranking and dot-product ranking are identical, and L2 ordering agrees with both, so the choice stops mattering — which is the strongest practical argument for normalising. Titan V2 offers normalisation directly. The rule to enforce is that the metric configured on the index must match what the embedding model was trained for, and must be the same at query time as at ingest time; a mismatch does not error, it just quietly returns worse results.',
      },
      visual: {
        kind: 'comparison_matrix',
        columns: ['Cosine', 'Dot product', 'Euclidean (L2)'],
        rows: [
          {
            label: 'What it measures',
            cells: ['Angle between vectors', 'Angle and magnitude together', 'Straight-line distance'],
          },
          {
            label: 'Sensitive to vector length',
            cells: [
              { text: 'No', tone: 'good' },
              { text: 'Yes', tone: 'bad' },
              { text: 'Yes', tone: 'neutral' },
            ],
            note: 'Length often tracks chunk length rather than relevance.',
          },
          {
            label: 'On normalised vectors',
            cells: [
              { text: 'Ranks identically to dot product', tone: 'good' },
              { text: 'Ranks identically to cosine', tone: 'good' },
              { text: 'Ranks consistently with both', tone: 'good' },
            ],
            note: 'Normalise and the argument disappears.',
          },
          {
            label: 'Typical default',
            cells: [
              'The safe choice for text retrieval',
              'Fastest to compute; correct only if the model expects it',
              'Common in general-purpose vector libraries',
            ],
          },
        ],
      },
      docUrl: MODELS_DOCS,
      verificationId: 'bedrock_foundation_models',
      coverageStatus: 'full',
      tags: ['cosine', 'dot product', 'normalisation', 'metric'],
      relatedTopicIds: ['what-is-an-embedding', 'ann-algorithms'],
    }),

    t({
      id: 'multimodal-embeddings',
      title: 'Multimodal embeddings',
      oneLiner:
        'Put images and the text describing them into one shared space, and a text query can retrieve a diagram.',
      whyItMatters:
        'A great deal of enterprise knowledge is not prose — it is architecture diagrams, screenshots in runbooks, scanned forms and product photography. A text-only pipeline silently drops all of it, and nobody notices because the answers still sound fine.',
      explanation: {
        plain:
          'A multimodal model can turn both a picture and a sentence into coordinates in the same space. That means a written question can find a relevant image, because the image and the words describing it end up near each other — no captions required.',
        technical:
          'A single shared embedding space accepts either modality, so cross-modal retrieval is just nearest-neighbour search as usual; Amazon Titan Multimodal Embeddings supports text, image, and combined text-and-image inputs. Two design questions follow. First, index composition: a mixed index of text and image vectors returns both for one query, which is usually what you want but does change how you assemble context. Second, generation: retrieving an image is only half the job — the answering model must itself accept images, or you need a text description generated at ingest to stand in for it. A pragmatic middle path that avoids a second index entirely is to caption images with a vision model at ingest and embed the captions as ordinary text.',
      },
      visual: {
        kind: 'concept_diagram',
        height: 340,
        nodes: [
          { id: 'text', label: 'Text chunk', sublabel: 'policy paragraph', detail: 'Ordinary prose from the corpus, embedded as usual.', x: 12, y: 22 },
          { id: 'image', label: 'Image', sublabel: 'architecture diagram', detail: 'A PNG from a runbook — no caption, no alt text, no surrounding prose.', x: 12, y: 74 },
          { id: 'model', label: 'Multimodal embedding model', sublabel: 'one model, either input', detail: 'Accepts text, an image, or both together, and emits vectors into a single shared space.', x: 42, y: 48, accent: 'rgb(20 184 166)' },
          { id: 'space', label: 'Shared vector space', sublabel: 'both modalities, one index', detail: 'An image of a retrieval pipeline and the sentence describing one sit near each other, so either can find the other.', x: 71, y: 48 },
          { id: 'query', label: 'Text query', sublabel: '“show me the ingestion flow”', detail: 'Embedded by the same model and matched against everything in the space, images included.', x: 71, y: 14 },
          { id: 'answer', label: 'Mixed results', sublabel: 'paragraphs and diagrams', detail: 'The generating model must accept images too — or the image needs a text stand-in produced at ingest.', x: 92, y: 78 },
        ],
        edges: [
          { from: 'text', to: 'model' },
          { from: 'image', to: 'model' },
          { from: 'model', to: 'space', label: 'one space' },
          { from: 'query', to: 'space', label: 'search', dashed: true },
          { from: 'space', to: 'answer' },
        ],
      },
      docUrl: MODELS_DOCS,
      verificationId: 'bedrock_foundation_models',
      coverageStatus: 'full',
      tags: ['multimodal', 'images', 'titan', 'embeddings'],
      relatedTopicIds: ['what-is-an-embedding', 'embedding-models'],
    }),

    t({
      id: 're-embedding-drift',
      title: 'Re-embedding and version drift',
      oneLiner:
        'Vectors from two different models cannot be compared — so changing the embedding model means rebuilding the entire index.',
      whyItMatters:
        'This is the migration people discover halfway through. A partially re-embedded index does not fail loudly; it returns plausible, quietly wrong results, because half the corpus is being measured with a different ruler.',
      explanation: {
        plain:
          'Different embedding models produce coordinates that have nothing to do with each other. If half your documents were processed by the old model and half by the new one, distances between them are meaningless — and nothing will warn you, because the numbers still compute and the answers still read fine.',
        technical:
          'Vector spaces from different models — and from different versions of the same model — are not comparable, so migration is all-or-nothing per index. The safe pattern is blue/green: build a second index with the new model, run both against a golden set, compare recall@k, then cut over and delete the old one. That costs double storage during the migration and a full re-embedding pass over the corpus, which for a large one is the dominant expense. Two things reduce the pain. Pin the exact model version rather than a floating alias, so a provider-side update cannot silently change your space. And keep the original chunk text in the index rather than only its vector, so re-embedding is a compute job over data you already hold rather than a full re-ingestion from source. The same discipline applies to changing dimensions or turning normalisation on — both produce an incompatible space.',
      },
      visual: {
        kind: 'lifecycle_timeline',
        stages: [
          {
            id: 'decide',
            label: 'Establish the baseline',
            plain: 'Measure how well the current setup retrieves before changing anything.',
            technical: 'Score the existing index against a golden set of question/passage pairs. Without this number the migration cannot be judged, only hoped about.',
          },
          {
            id: 'green',
            label: 'Build the second index',
            plain: 'Create a new, separate index and fill it using the new model.',
            technical: 'Re-embed from stored chunk text into a new index. Both indexes exist simultaneously — budget for the double storage and the one-off embedding cost of the full corpus.',
          },
          {
            id: 'compare',
            label: 'Compare on the same questions',
            plain: 'Run the same test questions against both and see which does better.',
            technical: 'Score recall@k and MRR for both indexes on the identical golden set. A new model that scores worse on your corpus is a normal outcome, and the reason this stage exists.',
          },
          {
            id: 'cutover',
            label: 'Cut over',
            plain: 'Point the application at the new index in one move.',
            technical: 'Switch atomically at the retrieval configuration. Never split traffic across both indexes for the same query — mixed-space results are meaningless.',
          },
          {
            id: 'retire',
            label: 'Retire the old index',
            plain: 'Delete the previous index once the new one has been trusted for a while.',
            technical: 'Keep it long enough to roll back, then delete it — an idle vector index is a continuing charge, and a stale one is a rollback target that gets less correct every day.',
          },
        ],
      },
      docUrl: KB_DOCS,
      verificationId: 'bedrock_kb_managed',
      coverageStatus: 'full',
      tags: ['migration', 'versioning', 'drift', 'embeddings'],
      relatedTopicIds: ['embedding-models', 'index-freshness', 'measuring-retrieval'],
      appliedIn: [
        { label: 'Accuracy — what we verify and when', to: '/accuracy' },
      ],
    }),
  ],
}
