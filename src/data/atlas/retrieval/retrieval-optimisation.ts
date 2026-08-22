import type { AtlasSection, AtlasTopic } from '../../../atlas/types'

const S = 'retrieval-optimisation'
const KB_DOCS = 'https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html'
const AOSS_DOCS = 'https://docs.aws.amazon.com/opensearch-service/latest/developerguide/serverless.html'

type T = Omit<AtlasTopic, 'atlasId' | 'sectionId'>
const t = (x: T): AtlasTopic => ({ ...x, atlasId: 'retrieval', sectionId: S })

export const retrievalOptimisation: AtlasSection = {
  id: S,
  atlasId: 'retrieval',
  title: 'Retrieval optimisation',
  order: 4,
  blurb:
    'Everything between the query arriving and the right passages being found — and how to tell whether any of it helped.',
  topics: [
    t({
      id: 'hybrid-search',
      title: 'Hybrid search — lexical and vector together',
      oneLiner:
        'Keyword search finds the exact string; vector search finds the paraphrase. Enterprise questions need both.',
      whyItMatters:
        'Pure vector search fails badly on precisely the tokens enterprise users type: error codes, part numbers, policy identifiers, surnames. These carry little semantic content and embed poorly, so a query for "clause 4.3.1" can miss the clause entirely while returning five paragraphs about claims in general.',
      explanation: {
        plain:
          'Keyword search matches the actual words, so it is unbeatable when someone types an exact code or a rare name. Vector search matches meaning, so it works when someone describes what they want in their own words. Running both and combining the results gives you a list that is good at both, which is what real questions demand.',
        technical:
          'Two retrievers run over the same corpus — BM25 over an inverted index, k-NN over the vector index — and their result lists are merged. Merging is the part that deserves thought, because the two produce scores on incomparable scales: a BM25 score of 12 and a cosine similarity of 0.82 cannot be added. Reciprocal rank fusion sidesteps this by combining positions rather than scores, which is robust and needs no tuning; weighted score fusion can beat it once normalised and calibrated, at the cost of a weight you now own. Managed knowledge bases expose a search type that runs both, which is the cheap way in — it requires a vector store that supports both retrieval modes, which is a concrete reason to pick a search engine over a plain vector store. The main cost is latency: two searches plus a merge, though they run concurrently.',
      },
      visual: {
        kind: 'flow_walkthrough',
        steps: [
          {
            id: 'query',
            label: 'One query, two paths',
            plain: 'The user’s question is sent to both kinds of search at the same time.',
            technical: 'The query text goes to the lexical analyser and to the embedding model concurrently. The added latency is the slower of the two, not their sum.',
          },
          {
            id: 'bm25',
            label: 'Lexical — BM25',
            plain: 'Finds documents containing the actual words typed, favouring rare ones.',
            technical: 'Term-frequency scoring over an inverted index, weighting rare terms higher. This is the path that reliably finds "clause 4.3.1" and the error code, because it matches the literal token rather than its meaning.',
          },
          {
            id: 'knn',
            label: 'Vector — k-NN',
            plain: 'Finds passages that mean the same thing even with entirely different wording.',
            technical: 'ANN search over the embedding index. This is the path that connects "how long do I have to report a claim" to a passage that never uses the word "report".',
          },
          {
            id: 'fuse',
            label: 'Fuse the two lists',
            plain: 'The two result lists are combined into one ranking.',
            technical: 'Reciprocal rank fusion combines by position and needs no score calibration, so it is the sane default. Weighted fusion can do better once both score distributions are normalised — and gives you a weight to maintain.',
            codeSampleId: 'rrf',
          },
          {
            id: 'candidates',
            label: 'One candidate set',
            plain: 'What comes out is a single list ready for reranking.',
            technical: 'Fetch deeper than you intend to use — a fused top-50 handed to a reranker consistently beats a fused top-5 used directly, because fusion optimises coverage and reranking optimises order.',
          },
        ],
      },
      codeSamples: [
        {
          id: 'rrf',
          title: 'Reciprocal rank fusion',
          language: 'python',
          filename: 'fuse.py',
          code: `"""Combine two ranked lists by position rather than by score.

BM25 scores and cosine similarities live on different scales and cannot be
added. RRF only looks at where each document ranked, which is why it works
without any calibration and is the right default.
"""
from collections import defaultdict

K = 60  # dampening constant; 60 is the conventional starting point


def reciprocal_rank_fusion(*ranked_lists, k=K, limit=50):
    scores = defaultdict(float)
    seen = {}

    for ranked in ranked_lists:
        for position, doc in enumerate(ranked):
            # Rank 0 contributes 1/(k+1), rank 1 contributes 1/(k+2), and so on.
            # A document found by both retrievers accumulates from both.
            scores[doc["id"]] += 1.0 / (k + position + 1)
            seen[doc["id"]] = doc

    ordered = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)
    return [seen[doc_id] for doc_id, _ in ordered[:limit]]`,
        },
      ],
      docUrl: KB_DOCS,
      verificationId: 'bedrock_kb_managed',
      coverageStatus: 'full',
      tags: ['hybrid', 'bm25', 'fusion', 'rrf', 'lexical'],
      relatedTopicIds: ['reranking', 'what-is-an-embedding'],
      appliedIn: [
        { label: 'Hybrid + rerank RAG', to: '/architecture/hybrid_rerank_rag' },
      ],
    }),

    t({
      id: 'reranking',
      title: 'Reranking',
      oneLiner:
        'A second, slower model reads each candidate against the query properly — and reorders what the fast search got approximately right.',
      whyItMatters:
        'It is usually the single highest-return change available, because it fixes the specific weakness of vector search without touching ingestion. Nothing has to be re-chunked, re-embedded or re-indexed; you fetch more candidates and add a step.',
      explanation: {
        plain:
          'The first search has to be fast, so it compares the question and each passage separately and hopes their coordinates line up. A reranker is allowed to be slow, so it reads the question and one passage together and judges how well that passage actually answers it. Run it over the top fifty and keep the best five, and the passage that genuinely holds the answer tends to rise to the top.',
        technical:
          'First-stage retrieval is a bi-encoder: query and document are embedded independently, so the model never sees them together and similarity is a proxy. A cross-encoder reranker takes the pair as a single input and scores their relevance directly, which is far more accurate and far too expensive to run over a whole corpus — hence the two stages. The pattern is retrieve deep, rerank, keep shallow: fetch 25–100 candidates, score them, pass the top 3–10 to the model. Bedrock exposes reranking as a distinct capability that can be applied to knowledge base results or to documents you supply yourself; verify the current model identifiers and API shape against the documentation. The costs are honest ones: added latency proportional to candidate count, and a per-document charge. The subtle trap is that a reranker can only reorder what the first stage found — if recall was poor, reranking produces a beautifully ordered list of the wrong passages.',
      },
      visual: {
        kind: 'rank_compare',
        firstStageLabel: 'First stage — vector top-8',
        rerankedLabel: 'After cross-encoder rerank',
        items: [
          { id: 'r1', label: 'notification-window', firstScore: 0.82, rerankScore: 0.41, note: 'Same topic, different question.' },
          { id: 'r2', label: 'settlement-timing', firstScore: 0.79, rerankScore: 0.38 },
          { id: 'r3', label: 'legal-evidence-std', firstScore: 0.77, rerankScore: 0.35 },
          { id: 'r4', label: 'complex-claims', firstScore: 0.74, rerankScore: 0.55 },
          { id: 'r5', label: 'proof-of-loss', firstScore: 0.71, rerankScore: 0.61 },
          { id: 'r6', label: 'claims-overview', firstScore: 0.69, rerankScore: 0.29 },
          { id: 'r7', label: 'late-notification-exception', firstScore: 0.66, rerankScore: 0.94, answerBearing: true, note: 'The only passage that states the exception process.' },
          { id: 'r8', label: 'glossary', firstScore: 0.63, rerankScore: 0.22 },
        ],
        takeaway:
          'For "what happens if I report a claim late?", the passage that actually answers it ranked seventh — outside any sensible top-5. Every chunk above it was about claims and about timing, which is precisely what a bi-encoder rewards. Reading the pair together instead moves it to first. Note also what this cannot fix: had the exception passage not been in the candidate set at all, the reranked list would look just as confident and still be wrong.',
      },
      docUrl: KB_DOCS,
      verificationId: 'bedrock_kb_managed',
      coverageStatus: 'full',
      tags: ['rerank', 'cross-encoder', 'two-stage', 'precision', 'flagship'],
      relatedTopicIds: ['hybrid-search', 'diversity-mmr', 'measuring-retrieval'],
      appliedIn: [
        { label: 'Hybrid + rerank RAG — the pattern built around this', to: '/architecture/hybrid_rerank_rag' },
      ],
    }),

    t({
      id: 'query-rewriting',
      title: 'Query rewriting and decomposition',
      oneLiner:
        'Fix the query before searching: resolve what "it" refers to, and split a question that is secretly three questions.',
      whyItMatters:
        'Real queries are short, full of pronouns, and often compound. A follow-up like "and for complex ones?" carries almost no retrievable content on its own, and a single search for a three-part question returns passages that partly answer each part and fully answer none.',
      explanation: {
        plain:
          'People ask questions the way they talk — leaning on what was said a moment ago and bundling several things together. Before searching, it helps to rewrite the question so it stands alone, and to split it into separate searches when it is really asking more than one thing. Each search then has a fair chance of finding its own answer.',
        technical:
          'Two distinct transformations, usually done by a fast model. Rewriting resolves anaphora and ellipsis against conversation history, turning "and for complex ones?" into "what is the settlement window for complex claims?" — without this, multi-turn retrieval degrades sharply after the first question, which is often misdiagnosed as a memory problem. Decomposition splits a compound question into independent sub-queries, retrieves for each, and merges the results, ensuring every part of the question has supporting passages rather than letting the dominant clause monopolise the top-k. Both cost a model call before retrieval even starts, so they belong behind a cheap check: single-clause questions with no pronouns need neither. In an agentic pattern this stops being a preprocessing step and becomes the agent’s own behaviour — deciding to search twice is a decision it can make, which is the substantive difference between agentic retrieval and a fixed pipeline.',
      },
      visual: {
        kind: 'sequence_trace',
        spans: [
          { id: 'in', label: 'User: “and how long do those take to settle?”', detail: 'Standalone, this retrieves almost nothing — "those" is the entire subject of the question and it is not in the text.', depth: 0, kind: 'entrypoint' },
          { id: 'hist', label: 'Load conversation history', detail: 'The previous turn asked about complex claims exceeding £25,000. That is where "those" is defined.', depth: 1, kind: 'memory' },
          { id: 'rewrite', label: 'Rewrite to a standalone query', detail: '→ "how long do complex claims over £25,000 take to settle?" Now every term that matters is present in the query text itself.', depth: 1, kind: 'model', note: 'A small, fast model is enough here' },
          { id: 'decomp', label: 'Check for multiple questions', detail: 'One clause, one intent — no decomposition needed. Skipping it saves a model call and some latency.', depth: 1, kind: 'model' },
          { id: 'retrieve', label: 'Retrieve on the rewritten query', detail: 'Hybrid search over the rewritten text. "complex claims" and "settle" are both now literal terms the lexical path can match.', depth: 1, kind: 'gateway' },
          { id: 'hit', label: 'Hit: §4.3 complex settlement', detail: 'The passage stating the 30-business-day window for complex claims. The original query would not have surfaced it.', depth: 2, kind: 'tool' },
          { id: 'answer', label: 'Answer, cited to §4.3', detail: 'The model answers from a passage that was reachable only because the pronoun was resolved before the search, not after it.', depth: 1, kind: 'response' },
        ],
      },
      docUrl: KB_DOCS,
      verificationId: 'bedrock_kb_managed',
      coverageStatus: 'full',
      tags: ['query rewriting', 'decomposition', 'multi-turn', 'anaphora'],
      relatedTopicIds: ['hyde', 'hybrid-search'],
      appliedIn: [
        { label: 'Agentic RAG — the agent decides how to search', to: '/architecture/agentic_rag' },
        { label: 'Memory-augmented RAG — history feeds the rewrite', to: '/architecture/memory_augmented_rag' },
      ],
    }),

    t({
      id: 'hyde',
      title: 'HyDE — searching with a hypothetical answer',
      oneLiner:
        'Have the model invent a plausible answer, then search with that instead of the question — answers look like answers, questions do not.',
      whyItMatters:
        'It addresses a real asymmetry: your index is full of declarative passages, but users submit interrogative fragments. A made-up answer, even a factually wrong one, is written in the register of the documents you are searching, and lands closer to them.',
      explanation: {
        plain:
          'A question and its answer are written very differently, so their coordinates are not always as close as you would hope. The trick is to ask the model to write what an answer might look like — accepting that it may be entirely wrong on the facts — and then search using that text. Its shape and vocabulary match real documents, so it finds them. The invented answer is thrown away; only the passages it retrieved are used.',
        technical:
          'Introduced as Hypothetical Document Embeddings. A generative model produces a hypothetical passage from the query, that passage is embedded, and retrieval runs against its vector rather than the query’s. The hallucinated content is deliberately never shown to the user or used as evidence — it functions purely as a query expansion in the document’s own idiom. It helps most on zero-shot and domain-shifted retrieval where the query vocabulary diverges from the corpus, and least where a strong lexical path already exists, since a made-up answer can introduce terms that pull retrieval away from the actual corpus. Costs are a generation call in the critical path before retrieval starts, and a failure mode worth naming: on a question whose subject matter the model knows nothing about, the hypothetical answer is confident nonsense that retrieves confident nonsense. Evaluate it against plain hybrid retrieval on your own golden set before adopting it — it is not a free win.',
      },
      visual: {
        kind: 'flow_walkthrough',
        steps: [
          {
            id: 'q',
            label: 'The question arrives',
            plain: '“Do I still get paid out if I report a claim two months late?”',
            technical: 'Interrogative, colloquial, and sharing little vocabulary with a policy document that says "late-notification exception process". Embedded directly, it sits between several topics and nearest to none.',
          },
          {
            id: 'draft',
            label: 'The model drafts an answer',
            plain: 'It writes what a plausible answer would look like, without looking anything up.',
            technical: 'A short generation, no retrieval. It may state the wrong number of days — that is expected and does not matter, because the text is used as a search probe rather than as evidence.',
          },
          {
            id: 'embed',
            label: 'Embed the draft, not the question',
            plain: 'The invented answer is turned into coordinates instead of the question.',
            technical: 'The draft is declarative and uses document vocabulary — "notification", "exception", "declined" — so its vector lands inside the cluster of real policy passages rather than between clusters.',
          },
          {
            id: 'retrieve',
            label: 'Retrieve real passages',
            plain: 'Search returns genuine documents near the draft.',
            technical: 'Standard ANN search on the draft’s vector. Everything returned is real corpus content; nothing invented enters the result set.',
          },
          {
            id: 'discard',
            label: 'Throw the draft away',
            plain: 'The invented answer is discarded and never shown to anyone.',
            technical: 'The model answers from the retrieved passages and the original question only. Letting the hypothetical text into the generation context would be handing the model its own guess as evidence — the exact failure HyDE is meant to work around.',
          },
        ],
      },
      docUrl: 'https://arxiv.org/abs/2212.10496',
      coverageStatus: 'full',
      tags: ['hyde', 'query expansion', 'zero-shot', 'retrieval'],
      relatedTopicIds: ['query-rewriting', 'measuring-retrieval'],
    }),

    t({
      id: 'diversity-mmr',
      title: 'Diversity and near-duplicate suppression',
      oneLiner:
        'A top-5 of five versions of the same paragraph is a top-1 that wasted four slots.',
      whyItMatters:
        'Enterprise corpora are full of duplication — drafts beside finals, the same policy in a handbook and an intranet page, quarterly documents that change three lines. Ranking purely by score fills the context window with the same sentence written five ways, and the model has no idea it was shown one fact rather than five.',
      explanation: {
        plain:
          'If several documents say almost the same thing, they all score about the same, so they all crowd into the top results together. That leaves no room for the other passages needed to answer the question properly. The fix is to pick results that are relevant but also different from what you have already picked.',
        technical:
          'Maximal marginal relevance selects greedily, scoring each remaining candidate as a weighted blend of its relevance to the query and its dissimilarity to the already-selected set. The weight is the knob: all relevance reproduces the original ranking, all diversity returns unrelated results, and the useful range sits well towards the relevance end. There is no managed API for this — it is implemented in your retrieval layer over the candidates the search returns, which is straightforward since you already hold the vectors. Cheaper approximations often suffice: deduplicate by source document so no single file contributes more than one or two chunks, or drop candidates whose similarity to an already-selected chunk exceeds a threshold. The failure to watch for is over-diversification on questions that genuinely have one answer, where forcing variety demotes the correct passage in favour of a merely different one.',
      },
      visual: {
        kind: 'rank_compare',
        firstStageLabel: 'By relevance score alone',
        rerankedLabel: 'With diversity applied',
        items: [
          { id: 'm1', label: 'evidence-list (v3, current)', firstScore: 0.88, rerankScore: 0.88 },
          { id: 'm2', label: 'evidence-list (v2, superseded)', firstScore: 0.87, rerankScore: 0.21, note: 'Near-identical to v3.' },
          { id: 'm3', label: 'evidence-list (v1, archived)', firstScore: 0.86, rerankScore: 0.19, note: 'Near-identical to v3.' },
          { id: 'm4', label: 'evidence-list (intranet copy)', firstScore: 0.85, rerankScore: 0.17, note: 'The same text on a different page.' },
          { id: 'm5', label: 'police-report-rule', firstScore: 0.72, rerankScore: 0.74, answerBearing: true, note: 'The theft-specific requirement.' },
          { id: 'm6', label: 'theft-definition', firstScore: 0.68, rerankScore: 0.69 },
          { id: 'm7', label: 'claim-form-guide', firstScore: 0.61, rerankScore: 0.58 },
        ],
        takeaway:
          'Asked what evidence a theft claim needs, relevance-only ranking spends four of its five slots on four copies of the same list, and the theft-specific rule falls outside the top-4. Suppressing near-duplicates costs nothing in relevance — the best copy is still first — and buys back three slots for passages that say something new.',
      },
      docUrl: AOSS_DOCS,
      verificationId: 'opensearch_serverless',
      coverageStatus: 'full',
      tags: ['mmr', 'diversity', 'deduplication', 'ranking'],
      relatedTopicIds: ['reranking', 'context-packing'],
    }),

    t({
      id: 'contextual-retrieval',
      title: 'Contextual retrieval',
      oneLiner:
        'Prepend a sentence to each chunk at ingest saying what it is and where it came from — then embed that.',
      whyItMatters:
        'It attacks the residual weakness that every chunking strategy shares. Even a perfectly-bounded chunk arrives stripped of the document, section and subject that made it meaningful, and no query-time technique can restore information that was never embedded.',
      explanation: {
        plain:
          'A chunk pulled from the middle of a document often makes no sense alone — "the window is 30 calendar days" does not say which window, or whose. Before embedding, have a model write a short line explaining what this chunk is and where it sits, and attach it to the front. Now the chunk carries its own context, and a search for "claim notification deadline" can find it.',
        technical:
          'A one-off ingest-time transformation described by Anthropic as contextual retrieval: for each chunk, a model is shown the chunk and its surrounding document and writes a brief situating preamble, which is prepended before embedding. Both the vector and the lexical index then contain the context, so it improves dense and BM25 retrieval together — the effect is largest on chunks dense with pronouns and bare references. The costs are real and worth stating plainly: one model call per chunk at ingest, which prompt caching over the shared document makes far cheaper than it first appears, plus a modest increase in stored text and a re-run whenever you re-chunk. A cheap approximation that captures much of the benefit for none of the model cost is to prepend the deterministic heading trail — document title and section path — which requires no inference at all. Do that first, measure, and add generated context where the measurement says the headings were not enough.',
      },
      visual: {
        kind: 'chunk_lab',
        document: {
          title: 'meridian-claims-policy.md · §4.1 (one chunk, two ways)',
          body: `## 4. Claims handling

### 4.1 Notification window
A member must notify Meridian of a claimable event within 30 calendar days. Claims filed after this window are reviewed under the late-notification exception process and are not automatically declined.`,
        },
        strategies: [
          {
            id: 'plain',
            label: 'As chunked',
            rule: 'Embed the chunk exactly as the splitter produced it.',
            benefit: 'Nothing extra to build, nothing extra to store, and no ingest-time model calls.',
            caveat:
              'Neither chunk names the company, the policy or the section. A query for "Meridian claim notification deadline" has only the word "notify" to work with, and the second chunk’s "this window" refers to a sentence that is no longer present.',
            chunks: [
              { id: 'c1', label: 'chunk 1', tokens: 18, text: 'A member must notify Meridian of a claimable event within 30 calendar days.' },
              {
                id: 'c2',
                label: 'chunk 2',
                tokens: 24,
                text: 'Claims filed after this window are reviewed under the late-notification exception process and are not automatically declined.',
                warning: '"this window" points at a chunk that is no longer here — the reference is unresolvable at query time.',
              },
            ],
          },
          {
            id: 'contextualised',
            label: 'With context prepended',
            rule: 'Show a model the chunk and its parent document, have it write one situating sentence, and prepend that before embedding.',
            config: 'one model call per chunk at ingest · prompt caching over the shared document · context stored with the chunk',
            benefit:
              'Every chunk now names the policy, the section and the subject, so both the vector and the lexical index contain the terms a user would actually type. The dangling "this window" is resolved in the prepended line rather than left to guesswork.',
            caveat:
              'Costs an inference pass over the whole corpus at ingest and grows stored text by the length of each preamble. Re-chunking means re-generating all of it. Try the deterministic heading trail first — it is free, and on well-structured documents it captures much of the same benefit.',
            chunks: [
              {
                id: 'x1',
                label: 'chunk 1',
                tokens: 42,
                overlapChars: 134,
                leadInNote: 'Tinted lead-in = the context generated and prepended at ingest',
                text: 'This passage is from §4.1 Notification window of the Meridian claims handling policy, and states the deadline for reporting a claim.\n\nA member must notify Meridian of a claimable event within 30 calendar days.',
              },
              {
                id: 'x2',
                label: 'chunk 2',
                tokens: 52,
                overlapChars: 157,
                leadInNote: 'Tinted lead-in = the context generated and prepended at ingest',
                text: 'This passage is from §4.1 Notification window of the Meridian claims handling policy, and describes what happens to claims filed after the 30-day deadline.\n\nClaims filed after this window are reviewed under the late-notification exception process and are not automatically declined.',
              },
            ],
          },
        ],
      },
      docUrl: 'https://www.anthropic.com/news/contextual-retrieval',
      coverageStatus: 'full',
      tags: ['contextual retrieval', 'ingest', 'context', 'bm25'],
      relatedTopicIds: ['recursive-chunking', 'chunking-decides', 'hybrid-search'],
    }),

    t({
      id: 'measuring-retrieval',
      title: 'Measuring retrieval on its own',
      oneLiner:
        'Score whether the right passage was found, separately from whether the answer read well — otherwise you cannot tell which half is broken.',
      whyItMatters:
        'Every technique in this section is a hypothesis. Judged by reading a few answers, they all seem to help, because a fluent model writes a convincing answer from mediocre passages. Retrieval metrics need no generation at all, which makes them cheap, fast, and the only honest way to compare two chunking strategies.',
      explanation: {
        plain:
          'Build a set of real questions and note, for each, which passages actually contain the answer. Then run retrieval and check whether it found them. This tells you about search quality alone — no model writing answers, no judgement calls about tone — so it is quick to run and hard to fool.',
        technical:
          'A golden set of query → relevant-passage-id pairs is the whole apparatus, and a hundred questions drawn from real usage beats a thousand synthetic ones. Retrieval scores then need no generation, so a full evaluation runs in seconds for pennies and can sit in CI. Choose the metric to match the pipeline: recall@k is the one that matters most before a reranker, because it asks whether the right passage is anywhere in the candidate set — and nothing downstream can recover from a no. MRR suits questions with a single correct passage; nDCG suits questions with several relevant passages of differing importance, since it rewards putting the best one first. Two disciplines make it useful rather than decorative: measure recall at your real candidate depth rather than at the depth you show the user, and re-score the same set after every ingestion change, so a regression from a chunking tweak surfaces immediately instead of as a slow drift in user trust.',
      },
      visual: {
        kind: 'comparison_matrix',
        columns: ['Recall@k', 'MRR', 'nDCG@k', 'Precision@k'],
        rows: [
          {
            label: 'The question it answers',
            cells: [
              'Is the right passage anywhere in the top k?',
              'How high did the first correct passage rank?',
              'Are the most relevant passages ranked above the merely relevant?',
              'What fraction of the top k is relevant?',
            ],
          },
          {
            label: 'Handles several correct passages',
            cells: [
              { text: 'Yes', tone: 'good' },
              { text: 'No — only the first counts', tone: 'bad' },
              { text: 'Yes, with graded relevance', tone: 'good' },
              { text: 'Yes', tone: 'good' },
            ],
          },
          {
            label: 'Effort to label',
            cells: [
              { text: 'Low — binary relevance', tone: 'good' },
              { text: 'Low — binary relevance', tone: 'good' },
              { text: 'High — graded relevance per passage', tone: 'bad' },
              { text: 'Low — binary relevance', tone: 'good' },
            ],
          },
          {
            label: 'Where it belongs',
            cells: [
              { text: 'First-stage retrieval — the metric to optimise', tone: 'good' },
              'After reranking, when one passage is correct',
              'After reranking, for graded relevance',
              'When context budget is tight and filler is costly',
            ],
            note: 'Recall@k before the reranker is the number that gates everything else.',
          },
        ],
      },
      docUrl: KB_DOCS,
      verificationId: 'bedrock_kb_managed',
      coverageStatus: 'full',
      tags: ['evaluation', 'recall', 'mrr', 'ndcg', 'golden set'],
      relatedTopicIds: ['reranking', 'choosing-chunking', 're-embedding-drift'],
      appliedIn: [
        { label: 'Evaluate — the wider evaluation and observability primer', to: '/evaluate' },
      ],
    }),
  ],
}
