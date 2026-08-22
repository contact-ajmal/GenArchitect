import type { AtlasSection, AtlasTopic } from '../../../atlas/types'
import {
  ALL_STRATEGIES,
  FIXED_SIZE,
  HIERARCHICAL,
  POLICY_DOC,
  RECURSIVE,
  SEMANTIC,
  SENTENCE_WINDOW,
} from './sample-chunks'

const S = 'chunking'
const KB_DOCS = 'https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html'

type T = Omit<AtlasTopic, 'atlasId' | 'sectionId'>
const t = (x: T): AtlasTopic => ({ ...x, atlasId: 'retrieval', sectionId: S })

export const chunking: AtlasSection = {
  id: S,
  atlasId: 'retrieval',
  title: 'Chunking',
  order: 1,
  blurb:
    'How a document becomes the units a retriever can return — and why that decision outlives every other one you make.',
  topics: [
    t({
      id: 'chunking-decides',
      title: 'Why chunking decides everything downstream',
      oneLiner:
        'The chunk is the unit of retrieval: nothing smaller can ever be returned, and nothing outside it can ever come with it.',
      whyItMatters:
        'Teams reach for a better embedding model or a reranker when answers come back wrong, and leave the chunking at whatever the default was. But a reranker can only reorder what retrieval found, and retrieval can only find chunks that exist. If the sentence that answers the question was cut in half at ingest, no amount of downstream sophistication puts it back together.',
      explanation: {
        plain:
          'Before anything can be searched, long documents have to be cut into pieces small enough to look up. Those pieces are what the system stores, what it searches, and what it eventually hands to the model to read. So where you cut matters enormously: cut in the wrong place and you get a piece that is missing the thing that made it make sense.',
        technical:
          'Chunking fixes the granularity of the whole pipeline. It sets what a vector represents, which determines whether similarity is a meaningful signal — a chunk covering four topics has a vector that is the average of four things and strongly similar to none of them. It sets the precision ceiling for retrieval, because a chunk is atomic: top-k returns whole chunks or nothing. And it sets how much irrelevant text rides along into the context window on every hit, which is both a cost line and a distraction the model has to work around. Re-chunking means re-embedding and rebuilding the index, so it is the one decision that is expensive to revisit.',
      },
      visual: {
        kind: 'chunk_lab',
        document: POLICY_DOC,
        strategies: ALL_STRATEGIES,
      },
      docUrl: KB_DOCS,
      verificationId: 'bedrock_kb_managed',
      coverageStatus: 'full',
      tags: ['chunking', 'ingestion', 'granularity', 'flagship'],
      relatedTopicIds: ['choosing-chunking', 'contextual-retrieval'],
      appliedIn: [
        { label: 'Managed KB RAG — where chunking is configured', to: '/architecture/managed_kb_rag' },
        { label: 'Failure modes — retrieval returns the wrong thing', to: '/failure-modes' },
      ],
    }),

    t({
      id: 'fixed-size-chunking',
      title: 'Fixed-size chunking',
      oneLiner:
        'Cut every N tokens, overlap by a fixed amount, and accept whatever falls on the seam.',
      whyItMatters:
        'It is the default nearly everywhere, including in most managed pipelines, so it is the strategy you are using unless you chose otherwise. Knowing exactly what it costs is how you decide whether the default is good enough for your corpus.',
      explanation: {
        plain:
          'The simplest possible rule: count off a set number of tokens, cut, then start the next piece slightly before the cut so a little text is repeated. Nothing checks whether the cut lands in the middle of a sentence, a table row, or a word — it just cuts.',
        technical:
          'Two parameters do all the work. Size trades precision against context: smaller chunks give sharper vectors and more of them, larger chunks give fuller context and mushier vectors. Overlap is damage control — repeating a tail means a concept severed at a boundary survives whole in at least one chunk, at the cost of embedding and storing that text twice. Overlap of 10–20% of chunk size is the common setting; it reduces boundary loss rather than eliminating it.',
      },
      visual: {
        kind: 'chunk_lab',
        document: POLICY_DOC,
        strategies: [FIXED_SIZE],
      },
      docUrl: KB_DOCS,
      verificationId: 'bedrock_kb_managed',
      coverageStatus: 'full',
      tags: ['fixed-size', 'overlap', 'chunking'],
      relatedTopicIds: ['recursive-chunking', 'chunking-decides'],
    }),

    t({
      id: 'recursive-chunking',
      title: 'Recursive and structure-aware chunking',
      oneLiner:
        'Split on the document’s own structure first — headings, then paragraphs, then sentences — and cut blindly only as a last resort.',
      whyItMatters:
        'Most enterprise corpora are structured: policies have numbered sections, runbooks have steps, API docs have endpoints. Splitting along that structure is nearly free and removes the entire class of failures where a rule is severed from its condition.',
      explanation: {
        plain:
          'Instead of cutting at a fixed length, try the biggest natural break first. If a section is still too big, split it into paragraphs. If a paragraph is still too big, split it into sentences. Only if a single sentence is somehow over budget do you fall back to cutting blindly.',
        technical:
          'Implemented as an ordered separator list — typically headings, then blank lines, then sentence terminators, then whitespace — applied recursively until every piece fits the budget. For Markdown, HTML and code, the separator list can be made format-specific so a fenced code block or a table is never split internally. This eliminates severed sentences; it does not eliminate lost context, since a chunk taken from deep in a document arrives without the heading trail that told you what it was about. Prepending that trail to each chunk is a separate step, and a cheap one.',
      },
      visual: {
        kind: 'chunk_lab',
        document: POLICY_DOC,
        strategies: [RECURSIVE],
      },
      docUrl: KB_DOCS,
      verificationId: 'bedrock_kb_managed',
      coverageStatus: 'full',
      tags: ['recursive', 'structure', 'markdown', 'chunking'],
      relatedTopicIds: ['fixed-size-chunking', 'semantic-chunking', 'contextual-retrieval'],
    }),

    t({
      id: 'semantic-chunking',
      title: 'Semantic chunking',
      oneLiner:
        'Let the embeddings decide the boundaries: cut where consecutive sentences stop being about the same thing.',
      whyItMatters:
        'Structure-aware splitting is only as good as the document’s structure. Meeting transcripts, support threads, scanned contracts and anything converted from PDF often have no reliable headings at all — and that is exactly where a semantic boundary earns its cost.',
      explanation: {
        plain:
          'Embed each sentence on its own, then walk through the document comparing each sentence to the one before it. Where the similarity suddenly drops, the topic has changed, so that is where you cut. The result is chunks that each cover one idea, whether or not the author marked it with a heading.',
        technical:
          'Each sentence is embedded, consecutive similarities are computed, and a breakpoint is placed wherever the similarity falls below a threshold — usually expressed as a percentile of the distribution across the document rather than an absolute value, so it adapts to how varied the text is. The cost is an extra embedding pass over the whole corpus at ingest, and a threshold that needs tuning: too sensitive and you get one-sentence chunks, too lenient and you get the whole document back. On well-structured documents it frequently converges on the same boundaries recursive splitting would have found for free.',
      },
      visual: {
        kind: 'chunk_lab',
        document: POLICY_DOC,
        strategies: [SEMANTIC],
      },
      docUrl: KB_DOCS,
      verificationId: 'bedrock_kb_managed',
      coverageStatus: 'full',
      tags: ['semantic', 'embeddings', 'breakpoint', 'chunking'],
      relatedTopicIds: ['recursive-chunking', 'what-is-an-embedding'],
    }),

    t({
      id: 'hierarchical-chunking',
      title: 'Hierarchical chunking (parent–child)',
      oneLiner:
        'Embed small pieces so matching is precise; return the large piece they came from so reading is coherent.',
      whyItMatters:
        'It dissolves the central tension of chunking rather than trading against it. Every other strategy is a compromise between a chunk small enough to match well and large enough to read well — this one refuses the compromise by using different units for the two jobs.',
      explanation: {
        plain:
          'Cut the document twice: into large pieces, and then each large piece into small ones. Only the small pieces get searched, so matching stays sharp. But when a small piece is found, the system hands the model the large piece it belongs to, so the answer arrives with its surroundings intact.',
        technical:
          'Only child vectors go into the index; parents are stored and fetched by reference on a hit. Two consequences follow. First, deduplication matters — several children of the same parent may appear in one top-k, and the parent should be returned once, not three times. Second, the effective context cost per hit is the parent size, not the child size, so a top-5 of children with large parents can fill a context window faster than you expect. This is also sold as "small-to-big" retrieval; the mechanism is identical.',
      },
      visual: {
        kind: 'chunk_lab',
        document: POLICY_DOC,
        strategies: [HIERARCHICAL],
      },
      docUrl: KB_DOCS,
      verificationId: 'bedrock_kb_managed',
      coverageStatus: 'full',
      tags: ['hierarchical', 'parent-child', 'small-to-big', 'chunking'],
      relatedTopicIds: ['sentence-window-chunking', 'choosing-chunking'],
      appliedIn: [
        { label: 'Hybrid + rerank RAG — precision at both stages', to: '/architecture/hybrid_rerank_rag' },
      ],
    }),

    t({
      id: 'sentence-window-chunking',
      title: 'Sentence-window retrieval',
      oneLiner:
        'Embed single sentences, then widen the result to its neighbours before the model reads it.',
      whyItMatters:
        'The purest form of the precision/context split. Where hierarchical chunking widens to a pre-defined parent, this widens by a fixed radius around whatever matched — which suits flowing prose that has no natural parent unit.',
      explanation: {
        plain:
          'Each sentence becomes its own searchable piece, which makes matching very precise because one sentence is about one thing. When a sentence matches, the system pulls back the sentences immediately before and after it so the model reads a passage rather than a fragment.',
        technical:
          'Index granularity is one sentence; retrieval granularity is a window of ±k sentences reconstructed at query time from stored positional metadata. The trade is index size — sentence-level indexing can multiply vector count several times over, raising storage cost and giving a reranker far more candidates to sort. The real weakness is anaphora: sentences beginning "this", "such claims" or "it" embed as fragments whose subject is in a different chunk, so they match poorly no matter how good the model is.',
      },
      visual: {
        kind: 'chunk_lab',
        document: POLICY_DOC,
        strategies: [SENTENCE_WINDOW],
      },
      docUrl: KB_DOCS,
      verificationId: 'bedrock_kb_managed',
      coverageStatus: 'full',
      tags: ['sentence window', 'context expansion', 'chunking'],
      relatedTopicIds: ['hierarchical-chunking', 'contextual-retrieval'],
    }),

    t({
      id: 'custom-chunking',
      title: 'Custom chunking in a managed pipeline',
      oneLiner:
        'When no built-in strategy fits the document, a transform step lets you supply the chunks yourself.',
      whyItMatters:
        'Some corpora have a natural unit no generic splitter will find: one chunk per claim record, per API endpoint, per table row with its header repeated. Being able to hand the pipeline your own chunks means an odd corpus does not force you off a managed ingestion path entirely.',
      explanation: {
        plain:
          'A managed knowledge base normally reads your documents and splits them for you. If none of its built-in ways of splitting suits your files, you can insert your own step: the pipeline hands you the raw document, your code returns the pieces, and ingestion carries on from there as normal.',
        technical:
          'Bedrock Knowledge Bases supports a custom transformation step backed by a Lambda function during ingestion, alongside its built-in strategies. Your function receives document content and returns the chunk list, with intermediate objects exchanged through an S3 bucket you specify. This is the escape hatch for record-oriented data, for repeating a table header into every row-chunk, and for attaching per-chunk metadata that the built-in splitters would not know to produce. The exact request and response contract is versioned and worth reading before you build against it.',
      },
      visual: {
        kind: 'lifecycle_timeline',
        stages: [
          {
            id: 'source',
            label: 'Source',
            plain: 'Your documents sit in their bucket, untouched.',
            technical: 'The data source is scanned and the set of new or changed objects is determined for this sync.',
          },
          {
            id: 'parse',
            label: 'Parse',
            plain: 'Each file is read and turned into text the pipeline can work with.',
            technical: 'Format-specific parsing extracts text and structure; a parsing strategy may itself use a foundation model for complex layouts such as tables in scanned PDFs.',
          },
          {
            id: 'transform',
            label: 'Your transform',
            plain: 'Your own code receives the document and returns the pieces it should become.',
            technical: 'The Lambda transform is invoked with the parsed content via the intermediate S3 location and returns the chunk list, including any per-chunk metadata to be indexed alongside.',
          },
          {
            id: 'embed',
            label: 'Embed',
            plain: 'Every piece you returned is converted into a vector.',
            technical: 'Each chunk is embedded with the knowledge base’s configured embedding model. Chunk count decided in the previous step is what this step is billed on.',
          },
          {
            id: 'index',
            label: 'Index',
            plain: 'The vectors and their metadata are written to the vector store.',
            technical: 'Vectors, source attribution and metadata fields are upserted into the configured index; deleted source objects are removed on the next sync.',
          },
        ],
      },
      codeSamples: [
        {
          id: 'custom-chunk-lambda',
          title: 'A custom chunking transform',
          language: 'python',
          filename: 'chunk_transform.py',
          code: `"""Custom chunking transform for a Bedrock Knowledge Base ingestion job.

One chunk per claim record, with the table header repeated into each chunk so
a row is readable on its own. Verify the exact event/response contract against
the current Bedrock Knowledge Bases documentation before deploying.
"""
import json
import boto3

s3 = boto3.client("s3")


def lambda_handler(event, context):
    # The pipeline passes documents through an intermediate S3 location rather
    # than inline, so large files never hit the Lambda payload limit.
    output = []

    for doc in event["inputFiles"]:
        bucket = doc["contentBatches"][0]["key"].split("/")[0]
        chunks = []

        for batch in doc["contentBatches"]:
            body = s3.get_object(Bucket=bucket, Key=batch["key"])["Body"].read()
            content = json.loads(body)

            for item in content["fileContents"]:
                text = item["contentBody"]
                header, *rows = text.splitlines()

                # One chunk per row — and the header rides along, so "30" is
                # never orphaned from the column that says what it counts.
                for row in rows:
                    if not row.strip():
                        continue
                    chunks.append(
                        {
                            "contentBody": f"{header}\\n{row}",
                            "contentType": item["contentType"],
                            "contentMetadata": item.get("contentMetadata", {}),
                        }
                    )

        output.append({"originalFileLocation": doc["originalFileLocation"], "chunks": chunks})

    return {"outputFiles": output}`,
          verifyServices: ['bedrock_kb_managed'],
        },
      ],
      docUrl: KB_DOCS,
      verificationId: 'bedrock_kb_managed',
      coverageStatus: 'full',
      tags: ['custom chunking', 'lambda', 'ingestion', 'transform'],
      relatedTopicIds: ['chunking-decides', 'index-freshness'],
      appliedIn: [
        { label: 'Managed KB RAG', to: '/architecture/managed_kb_rag' },
      ],
    }),

    t({
      id: 'choosing-chunking',
      title: 'Choosing a chunking strategy',
      oneLiner:
        'Let the shape of the corpus decide, then measure — chunking is the cheapest thing to A/B and the most expensive thing to leave wrong.',
      whyItMatters:
        'There is no strategy that wins everywhere, and the honest answer to "which one" is a question about your documents. What is universal is the method: pick from structure, then verify with a retrieval measurement rather than by reading a few answers and feeling reassured.',
      explanation: {
        plain:
          'Work from what your documents look like. If they have clear headings, split on them. If they are shapeless prose, let the meaning decide the boundaries. If answers keep arriving without enough surrounding context, use a strategy that returns a bigger piece than it searched. Then check the change with a proper measurement instead of a hunch.',
        technical:
          'Start from the corpus: structured Markdown, HTML or code favours recursive splitting with format-aware separators; unstructured transcripts favour semantic; reference material where a hit needs its surroundings favours hierarchical or sentence-window; record-oriented data usually needs a custom transform. Then treat the choice as an experiment. Chunking changes are measurable on retrieval metrics alone — recall@k against a golden set of question/passage pairs — without generating a single answer, which makes the loop fast and cheap. Re-chunking requires a full re-embed and index rebuild, so the cost is real but bounded, and it is far lower than shipping a system that quietly cannot retrieve its own answers.',
      },
      visual: {
        kind: 'decision_tree',
        root: {
          id: 'root',
          question: 'Do your documents have reliable structure — headings, sections, code blocks, tables?',
          options: [
            {
              label: 'Yes, they are well structured',
              next: {
                id: 'structured',
                question: 'When a chunk is retrieved on its own, is it readable without its surroundings?',
                options: [
                  {
                    label: 'Yes, sections stand alone',
                    next: {
                      id: 'recursive-leaf',
                      recommendation: 'Recursive, structure-aware chunking',
                      reasoning:
                        'Split on the document’s own separators with a format-aware list, and prepend the heading trail to each chunk so it knows what it belongs to. This is the cheapest good answer and the right default for policies, runbooks and API docs.',
                    },
                  },
                  {
                    label: 'No, a hit needs its surroundings',
                    next: {
                      id: 'hier-leaf',
                      recommendation: 'Hierarchical (parent–child) chunking',
                      reasoning:
                        'Embed section-level children for precise matching and return the parent section on a hit. Budget for the parent size in your context window, and de-duplicate parents when several children match.',
                    },
                  },
                ],
              },
            },
            {
              label: 'No — transcripts, scans, converted PDFs',
              next: {
                id: 'unstructured',
                question: 'Is the corpus large enough that an extra embedding pass at ingest is a real cost?',
                options: [
                  {
                    label: 'No, it is manageable',
                    next: {
                      id: 'semantic-leaf',
                      recommendation: 'Semantic chunking',
                      reasoning:
                        'Let boundaries fall where the topic changes, since there is no markup to trust. Tune the breakpoint threshold on a sample and check the resulting chunk-size distribution before committing to a full ingest.',
                    },
                  },
                  {
                    label: 'Yes, it is millions of documents',
                    next: {
                      id: 'fixed-leaf',
                      recommendation: 'Fixed-size with generous overlap',
                      reasoning:
                        'Predictable cost and no per-document analysis. Push overlap to the higher end of the 10–20% range to limit boundary damage, and revisit only if retrieval measurement says the seams are actually hurting you.',
                    },
                  },
                ],
              },
            },
            {
              label: 'They are records, not prose',
              next: {
                id: 'records-leaf',
                recommendation: 'A custom transform, one chunk per record',
                reasoning:
                  'Rows, tickets, claims and endpoints have a natural unit that no generic splitter will find. Repeat the header or key context into every chunk, and attach the record’s fields as metadata so they can be filtered on at query time.',
              },
            },
          ],
        },
      },
      docUrl: KB_DOCS,
      verificationId: 'bedrock_kb_managed',
      coverageStatus: 'full',
      tags: ['strategy', 'decision', 'chunking', 'evaluation'],
      relatedTopicIds: ['chunking-decides', 'measuring-retrieval'],
      appliedIn: [
        { label: 'Compose — pick chunking for your architecture', to: '/compose' },
      ],
    }),
  ],
}
