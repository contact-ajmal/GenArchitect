import type { AtlasSection, AtlasTopic } from '../../../atlas/types'

const S = 'vector-stores'
const AOSS_DOCS = 'https://docs.aws.amazon.com/opensearch-service/latest/developerguide/serverless.html'
const AURORA_DOCS = 'https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/AuroraPostgreSQL.VectorDB.html'
const KB_DOCS = 'https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html'

type T = Omit<AtlasTopic, 'atlasId' | 'sectionId'>
const t = (x: T): AtlasTopic => ({ ...x, atlasId: 'retrieval', sectionId: S })

export const vectorStores: AtlasSection = {
  id: S,
  atlasId: 'retrieval',
  title: 'Vector stores',
  order: 3,
  blurb:
    'Where the vectors live, how a search finds neighbours without comparing everything, and what the index really costs.',
  topics: [
    t({
      id: 'what-an-index-is',
      title: 'What a vector index actually is',
      oneLiner:
        'A data structure that finds probable nearest neighbours without comparing the query to every vector you own.',
      whyItMatters:
        'The word "index" hides the important part: these searches are approximate by design. Results you never see were not filtered out for being irrelevant — the search simply did not look at them, and that is a deliberate trade you are making.',
      explanation: {
        plain:
          'Comparing a question to every single chunk you have stored would be exact, and far too slow once there are millions of them. So a vector index organises the vectors in advance in a way that lets a search jump towards the right neighbourhood and check only a small fraction of the collection. It usually finds the true nearest matches — but it is allowed to miss one, and it will not tell you when it does.',
        technical:
          'An exact k-NN scan is O(n) per query in both distance computations and memory bandwidth, which stops being viable well before enterprise corpus scale. Approximate nearest neighbour structures trade a bounded, tunable recall loss for sublinear search: they build a navigable structure at ingest, then traverse only a small candidate set at query time. Every ANN index therefore exposes a knob that trades recall against latency, and the honest framing is that the default setting is a guess about your workload. Two operational consequences follow. Recall loss is invisible from inside the application — a missed neighbour looks exactly like a chunk that was never relevant — so it can only be detected by measuring against known-good answers. And the index is a derived artefact: it can always be rebuilt from the chunks and the embedding model, which is why keeping the chunk text is worth the storage.',
      },
      visual: {
        kind: 'concept_diagram',
        height: 360,
        nodes: [
          { id: 'chunks', label: 'Chunks', sublabel: 'text + metadata', detail: 'The output of chunking. Worth storing alongside the vectors — the index can be rebuilt from these, but not from vectors alone.', x: 9, y: 30 },
          { id: 'embed', label: 'Embedding model', sublabel: 'text → vector', detail: 'Runs once per chunk at ingest, and once per query at search time. Must be the same model on both sides.', x: 30, y: 30 },
          { id: 'index', label: 'ANN index', sublabel: 'graph or cluster structure', detail: 'Built at ingest so that search can jump towards the right neighbourhood instead of scanning everything. This is the part that makes the search approximate.', x: 54, y: 30, accent: 'rgb(20 184 166)' },
          { id: 'meta', label: 'Metadata fields', sublabel: 'tenant, ACL, date, source', detail: 'Stored beside each vector so results can be filtered — and, critically, so filtering can happen before distance is computed.', x: 54, y: 76 },
          { id: 'query', label: 'Query', sublabel: 'embedded the same way', detail: 'Embedded by the same model and dimension as the chunks, or the distances mean nothing.', x: 9, y: 76 },
          { id: 'candidates', label: 'Candidates', sublabel: 'top-k, probably', detail: 'The k nearest the traversal found. Usually the true nearest — but a miss is silent, which is why recall has to be measured rather than assumed.', x: 84, y: 52 },
        ],
        edges: [
          { from: 'chunks', to: 'embed' },
          { from: 'embed', to: 'index', label: 'build' },
          { from: 'chunks', to: 'meta', label: 'stored beside', dashed: true },
          { from: 'query', to: 'embed', label: 'same model' },
          { from: 'index', to: 'candidates', label: 'traverse' },
          { from: 'meta', to: 'candidates', label: 'filter first', dashed: true },
        ],
      },
      docUrl: AOSS_DOCS,
      verificationId: 'opensearch_serverless',
      coverageStatus: 'full',
      tags: ['index', 'ann', 'vector store', 'flagship'],
      relatedTopicIds: ['ann-algorithms', 'metadata-filtering'],
    }),

    t({
      id: 'ann-algorithms',
      title: 'HNSW, IVF and exact search',
      oneLiner:
        'Three ways to organise vectors, trading build cost, memory and update behaviour against how often the search is right.',
      whyItMatters:
        'The algorithm is chosen once at index creation and is awkward to change afterwards. Its parameters, meanwhile, are the fastest quality lever in the whole retrieval stack — a single number can move recall several points without touching a chunk or a model.',
      explanation: {
        plain:
          'Exact search compares everything and is always right, but gets slow as the collection grows. One popular alternative builds a network of links between vectors so a search can hop from neighbour to neighbour towards the answer. Another sorts vectors into buckets in advance and searches only the few buckets nearest the question. Both are fast, both are occasionally wrong, and both let you dial how hard they look.',
        technical:
          'Flat (exact) search computes every distance: perfect recall, linear cost, entirely reasonable below roughly a hundred thousand vectors, and the correct baseline to measure the others against. HNSW builds a multi-layer proximity graph and greedily descends it; recall is controlled at build time by the graph’s connectivity and at query time by how wide the search frontier is kept. It is the strongest general-purpose choice, handles incremental inserts well, and pays for it in memory, since the graph links are a substantial cost on top of the vectors themselves. IVF partitions the space into clusters and probes only the nearest few; it is far more memory-efficient and quicker to build, but the partitioning is derived from a training sample, so recall degrades as the data drifts away from that sample and the index eventually wants rebuilding. Quantisation is orthogonal to all three and can be layered on to compress vectors at a further, measurable recall cost.',
      },
      visual: {
        kind: 'comparison_matrix',
        columns: ['Flat (exact)', 'HNSW', 'IVF'],
        rows: [
          {
            label: 'Recall',
            cells: [
              { text: 'Perfect by definition', tone: 'good' },
              { text: 'High, tunable at query time', tone: 'good' },
              { text: 'Good, degrades as data drifts', tone: 'neutral' },
            ],
            note: 'Flat is the baseline the other two should be measured against.',
          },
          {
            label: 'Query latency at scale',
            cells: [
              { text: 'Grows linearly — the binding limit', tone: 'bad' },
              { text: 'Sublinear, consistently fast', tone: 'good' },
              { text: 'Fast; depends on how many buckets you probe', tone: 'good' },
            ],
          },
          {
            label: 'Memory footprint',
            cells: [
              { text: 'Vectors only', tone: 'good' },
              { text: 'Vectors plus graph links — the heaviest', tone: 'bad' },
              { text: 'Vectors plus small cluster metadata', tone: 'good' },
            ],
            note: 'HNSW graph links are often a large fraction of index size, not a rounding error.',
          },
          {
            label: 'Incremental inserts',
            cells: [
              { text: 'Trivial — just append', tone: 'good' },
              { text: 'Supported, gradually degrades', tone: 'neutral' },
              { text: 'Clusters go stale; wants periodic rebuild', tone: 'bad' },
            ],
          },
          {
            label: 'Best fit',
            cells: [
              'Small corpora, and as the correctness baseline',
              'The general-purpose default for RAG',
              'Very large corpora where memory is the constraint',
            ],
          },
        ],
      },
      docUrl: AOSS_DOCS,
      verificationId: 'opensearch_serverless',
      coverageStatus: 'full',
      tags: ['hnsw', 'ivf', 'ann', 'recall', 'latency'],
      relatedTopicIds: ['what-an-index-is', 'index-sizing', 'measuring-retrieval'],
    }),

    t({
      id: 'aws-vector-options',
      title: 'Where to put the vectors on AWS',
      oneLiner:
        'The right store usually follows from what else the data has to do, not from vector benchmarks.',
      whyItMatters:
        'Most of these options retrieve well enough that raw vector performance is rarely the deciding factor. What decides it is whether you need transactional joins to the same data, whether relationships between documents matter, and who is willing to operate the thing.',
      explanation: {
        plain:
          'Several AWS services can store vectors. A search service gives you keyword and vector search together in one query. A relational database lets you keep vectors right beside the business data they describe, so one query can do both. A graph database adds the relationships between documents. And you can always point at a third-party vector database instead.',
        technical:
          'OpenSearch Serverless is the default for managed knowledge bases and the only option here that gives you lexical BM25 and vector search in the same engine, which makes hybrid retrieval a query-shape change rather than an architecture change. Aurora PostgreSQL with pgvector is compelling when the vectors belong next to relational data: a single transaction can filter on a join and rank by distance, and you inherit the backup, IAM and compliance story you already have. Neptune Analytics matters when the relationships between chunks are part of the answer — entity graphs, citation chains, dependency trails — and it is what a graph-augmented pattern is built on. Third-party stores remain a legitimate choice and are supported as knowledge base targets. AWS has continued to add vector storage options aimed at lower-cost, higher-scale workloads; check the current knowledge base documentation for the supported list before designing around any one of them.',
      },
      visual: {
        kind: 'comparison_matrix',
        columns: ['OpenSearch Serverless', 'Aurora PostgreSQL + pgvector', 'Neptune Analytics', 'Third-party'],
        rows: [
          {
            label: 'Lexical + vector in one query',
            cells: [
              { text: 'Yes — BM25 and k-NN together', tone: 'good' },
              { text: 'Full-text search exists but is separate work', tone: 'neutral' },
              { text: 'Not its purpose', tone: 'bad' },
              { text: 'Varies by vendor', tone: 'neutral' },
            ],
            note: 'This is what makes hybrid retrieval cheap to adopt.',
          },
          {
            label: 'Joins to your business data',
            cells: [
              { text: 'No — separate system', tone: 'bad' },
              { text: 'Yes — same database, same transaction', tone: 'good' },
              { text: 'Traversals rather than joins', tone: 'neutral' },
              { text: 'No', tone: 'bad' },
            ],
          },
          {
            label: 'Relationships between documents',
            cells: [
              { text: 'Flat metadata only', tone: 'neutral' },
              { text: 'Relational, via foreign keys', tone: 'neutral' },
              { text: 'First-class graph traversal', tone: 'good' },
              { text: 'Flat metadata only', tone: 'neutral' },
            ],
          },
          {
            label: 'Operational burden',
            cells: [
              { text: 'Serverless — capacity units to watch', tone: 'good' },
              { text: 'A database you already run', tone: 'neutral' },
              { text: 'Managed, with a graph model to learn', tone: 'neutral' },
              { text: 'Another vendor, another bill, another audit', tone: 'bad' },
            ],
          },
          {
            label: 'Reach for it when',
            cells: [
              'Hybrid retrieval, or you want the managed default',
              'Vectors belong beside relational data',
              'The relationships are part of the answer',
              'You are already committed to it',
            ],
          },
        ],
      },
      docUrl: KB_DOCS,
      verificationId: 'bedrock_kb_managed',
      coverageStatus: 'full',
      tags: ['opensearch', 'pgvector', 'neptune', 'vector store'],
      relatedTopicIds: ['what-an-index-is', 'index-sizing'],
      appliedIn: [
        { label: 'Graph RAG — where Neptune earns its place', to: '/architecture/graph_rag' },
        { label: 'Compose — choose a vector store', to: '/compose' },
      ],
    }),

    t({
      id: 'metadata-filtering',
      title: 'Metadata filtering and access control',
      oneLiner:
        'Filter before you rank, not after — post-filtering a top-k is how a system returns four results and an accidental disclosure.',
      whyItMatters:
        'This is where retrieval quality and security stop being separate concerns. The same mechanism that keeps a query inside the right department is the one that keeps a user out of documents they are not cleared for, and doing it in the wrong order breaks both at once.',
      explanation: {
        plain:
          'Every chunk can carry labels — which team owns it, when it was written, who is allowed to see it. A query can then restrict itself to chunks with the right labels. The order matters enormously: if you fetch the ten nearest chunks and then throw away the ones the user cannot see, you might be left with two. Restricting first means the ten you get back are ten the user can actually read.',
        technical:
          'Pre-filtering applies the metadata predicate before or during the ANN traversal, so the k returned are k eligible results. Post-filtering ranks first and discards afterwards, which silently reduces the result count — sometimes to nothing — and gets worse as the filter gets more selective. Managed knowledge bases accept a metadata filter on the retrieve call, and the vector store must support filtered search for it to be applied efficiently. For access control the essential rule is that the filter must be derived from the authenticated identity server-side, never from anything the client can set: a filter the caller supplies is a suggestion, not a control. Two further points earn their keep. Metadata is written at ingest, so a permission model that changes shape later means re-indexing. And absence is not denial — a chunk ingested without an ACL field will not match a filter requiring one, which fails closed for security and fails silently for retrieval quality.',
      },
      visual: {
        kind: 'vector_space',
        query: { label: 'what evidence do we need?', x: 46, y: 50 },
        topK: 3,
        filter: { label: 'dept = claims', key: 'dept', value: 'claims' },
        groups: [
          { id: 'claims', label: 'dept = claims' },
          { id: 'legal', label: 'dept = legal (restricted)' },
        ],
        points: [
          { id: 'm1', label: 'legal-evidence-std', x: 40, y: 42, group: 'legal', similarity: 0.91, meta: { dept: 'legal' } },
          { id: 'm2', label: 'evidence-list', x: 56, y: 44, group: 'claims', similarity: 0.86, meta: { dept: 'claims' } },
          { id: 'm3', label: 'legal-disclosure', x: 34, y: 62, group: 'legal', similarity: 0.8, meta: { dept: 'legal' } },
          { id: 'm4', label: 'proof-of-loss', x: 62, y: 66, group: 'claims', similarity: 0.74, meta: { dept: 'claims' } },
          { id: 'm5', label: 'notification-window', x: 24, y: 34, group: 'claims', similarity: 0.68, meta: { dept: 'claims' } },
          { id: 'm6', label: 'settlement-timing', x: 76, y: 30, group: 'claims', similarity: 0.55, meta: { dept: 'claims' } },
          { id: 'm7', label: 'legal-retention', x: 84, y: 74, group: 'legal', similarity: 0.44, meta: { dept: 'legal' } },
          { id: 'm8', label: 'complex-claims', x: 14, y: 84, group: 'claims', similarity: 0.38, meta: { dept: 'claims' } },
        ],
        note: 'Unfiltered, the two nearest chunks include a restricted legal document — nearness knows nothing about permission. Turn the filter on and the ineligible points stop being candidates at all, so three eligible chunks come back rather than one survivor of a post-hoc cull.',
      },
      docUrl: KB_DOCS,
      verificationId: 'bedrock_kb_managed',
      coverageStatus: 'full',
      tags: ['metadata', 'filtering', 'acl', 'security', 'pre-filter'],
      relatedTopicIds: ['what-an-index-is', 'index-freshness'],
      appliedIn: [
        { label: 'Guardrailed secure RAG — ACLs enforced at retrieval', to: '/architecture/guardrailed_secure_rag' },
        { label: 'Security & compliance', to: '/security' },
      ],
    }),

    t({
      id: 'index-sizing',
      title: 'What an index actually costs',
      oneLiner:
        'The vectors are rarely the largest line — graph links, metadata and stored text usually outweigh them.',
      whyItMatters:
        'Sizing estimates built from "vectors × dimensions × 4 bytes" come in low by a factor that surprises people at renewal time. Knowing which layer dominates tells you which lever — dimensions, algorithm, or what you store — is worth pulling.',
      explanation: {
        plain:
          'It is tempting to estimate cost by multiplying the number of chunks by the size of a vector. That is the floor, not the bill. The structure that makes search fast has its own substantial size, the labels used for filtering add more, and if you keep the original text alongside — which you should — that is often the biggest piece of all.',
        technical:
          'Work upward through the layers. Raw vectors are count × dimensions × 4 bytes at float32, and this is the part that scales down cleanly with a smaller output dimension or quantisation. The ANN structure sits on top: an HNSW graph’s links are frequently comparable to the vectors themselves, which is the concrete reason IVF gets chosen for very large corpora. Metadata and filterable fields add per-document overhead that grows with how many fields are indexed rather than merely stored. Stored source text is optional to the search and close to mandatory in practice — you need it to build context, to show citations, and to re-embed without re-ingesting. Then multiply: replicas for availability multiply the whole stack, and a blue/green embedding migration doubles it again for the duration. The practical estimate is to build a real index from a representative one percent of the corpus and measure, rather than to compute.',
      },
      visual: {
        kind: 'layered_stack',
        layers: [
          {
            id: 'text',
            label: 'Stored chunk text',
            role: 'Often the largest layer',
            detail: 'Optional for search, near-mandatory in practice: it is what you assemble into context, what you cite from, and what lets you re-embed later without re-ingesting from source. Frequently exceeds the vectors it accompanies.',
          },
          {
            id: 'meta',
            label: 'Metadata and filter fields',
            role: 'Grows with fields indexed, not fields stored',
            detail: 'Tenant, ACL, source, date. Indexing a field so it can be filtered on costs more than merely storing it — index what you filter on, store the rest.',
            topicId: 'metadata-filtering',
          },
          {
            id: 'graph',
            label: 'ANN structure',
            role: 'Comparable to the vectors for HNSW',
            detail: 'The graph links or cluster assignments that make search sublinear. This layer is the reason a very large corpus may be better served by IVF, and it is the layer most often left out of an estimate.',
            topicId: 'ann-algorithms',
          },
          {
            id: 'vectors',
            label: 'Raw vectors',
            role: 'count × dimensions × 4 bytes',
            detail: 'The floor of the estimate, and the only layer that shrinks cleanly with a smaller output dimension or with quantisation.',
            topicId: 'dimensions-truncation',
            accent: 'rgb(20 184 166)',
          },
        ],
      },
      docUrl: AURORA_DOCS,
      verificationId: 'aurora_pgvector',
      coverageStatus: 'full',
      tags: ['cost', 'sizing', 'memory', 'capacity'],
      relatedTopicIds: ['ann-algorithms', 'dimensions-truncation'],
    }),

    t({
      id: 'index-freshness',
      title: 'Keeping the index current',
      oneLiner:
        'An index is a copy, and every copy is out of date — the question is by how much, and whether deletions actually propagate.',
      whyItMatters:
        'Deletion is the one that carries real risk. A document withdrawn from the source of truth but still answerable from the index is a compliance problem that looks, from the outside, exactly like the system working normally.',
      explanation: {
        plain:
          'The vector index is a copy of your documents, made at the moment they were last processed. Change a document and the index keeps answering from the old version until the next sync. Delete a document and — unless deletion is handled properly — the system will happily keep citing it.',
        technical:
          'Ingestion jobs are the sync mechanism, and the practical questions are how they detect change, what they do about removal, and how long the gap is. Incremental sync should re-process only new and modified objects, which usually means comparing modification timestamps or checksums; a full re-crawl of an unchanged corpus is pure cost. Deletions require the source scan to notice absence rather than merely process presence — verify this explicitly, because it is the failure that stays quiet. Set the sync cadence from how fast the corpus actually changes and how stale an answer is allowed to be, and make the answer visible: surface the last-sync time to users where staleness would mislead them. Where a document must become unanswerable immediately, do not wait for the next sync — enforce it with a metadata filter that excludes withdrawn documents at query time, which takes effect on the next request rather than the next job.',
      },
      visual: {
        kind: 'lifecycle_timeline',
        stages: [
          {
            id: 'change',
            label: 'The source changes',
            plain: 'Someone edits, adds or withdraws a document in the bucket.',
            technical: 'From this moment the index is knowingly wrong. Everything downstream is about shortening this window and bounding its blast radius.',
          },
          {
            id: 'detect',
            label: 'The sync notices',
            plain: 'A scheduled job scans the source and works out what is different.',
            technical: 'Change detection by timestamp or checksum. Confirm it detects absence as well as modification — a scan that only iterates present objects will never remove anything.',
          },
          {
            id: 'process',
            label: 'Re-chunk and re-embed',
            plain: 'Only the changed documents are cut up and converted again.',
            technical: 'Incremental processing of the delta. Chunking is deterministic, so an unchanged document produces identical chunks and can be skipped entirely — this is where most of the cost saving lives.',
          },
          {
            id: 'upsert',
            label: 'Write to the index',
            plain: 'New vectors go in, changed ones are replaced, removed ones are deleted.',
            technical: 'Upsert by stable chunk id, and issue real deletes for withdrawn sources. Chunk ids must be stable across runs or updates become duplicate inserts rather than replacements.',
          },
          {
            id: 'verify',
            label: 'Verify, and show the age',
            plain: 'Check a withdrawn document can no longer be retrieved, and tell users how fresh the answers are.',
            technical: 'Assert deletion by querying for a known-removed chunk rather than trusting the job’s exit code, and surface the last successful sync time wherever staleness could mislead.',
          },
        ],
      },
      docUrl: KB_DOCS,
      verificationId: 'bedrock_kb_managed',
      coverageStatus: 'full',
      tags: ['sync', 'freshness', 'deletion', 'ingestion'],
      relatedTopicIds: ['metadata-filtering', 're-embedding-drift'],
      appliedIn: [
        { label: 'Failure modes — stale or withdrawn sources', to: '/failure-modes' },
      ],
    }),
  ],
}
