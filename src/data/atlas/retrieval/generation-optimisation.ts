import type { AtlasSection, AtlasTopic } from '../../../atlas/types'

const S = 'generation-optimisation'
const KB_DOCS = 'https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html'
const GUARDRAILS_DOCS = 'https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html'

type T = Omit<AtlasTopic, 'atlasId' | 'sectionId'>
const t = (x: T): AtlasTopic => ({ ...x, atlasId: 'retrieval', sectionId: S })

export const generationOptimisation: AtlasSection = {
  id: S,
  atlasId: 'retrieval',
  title: 'Generation optimisation',
  order: 5,
  blurb:
    'What happens after the passages are found — how they are assembled, cited, and checked before the answer is trusted.',
  topics: [
    t({
      id: 'context-packing',
      title: 'Packing the context window',
      oneLiner:
        'What you include and where you put it both matter — attention is not uniform across a long prompt.',
      whyItMatters:
        'Retrieval work is routinely undone here. A pipeline that found the right passage and buried it seventh in a wall of context performs like one that never found it, and the symptom looks identical from the outside: a confident answer that misses what the document said.',
      explanation: {
        plain:
          'Once the passages are found, they have to be arranged into a single prompt. Two habits cause trouble. Sending everything retrieved, on the theory that more context cannot hurt — it can, because irrelevant passages compete for the model’s attention. And putting the best passage in the middle, which is the position models are least reliable at using.',
        technical:
          'Models attend unevenly across long inputs, with material at the beginning and end used more reliably than material in the middle — an effect documented as "lost in the middle" and one that persists as context windows grow. Two practical rules follow. Order deliberately: put the highest-ranked passages at the edges of the context block rather than letting them fall wherever the ranking happened to place them. And bound what you include: pass the top 3–5 reranked passages, not the top 50 retrieved — precision beats volume, and every extra passage is both a cost line and a distraction. Structure earns its keep too. Delimit each passage clearly and label it with a stable identifier, which makes citation possible and makes it far easier for the model to tell one source from another. Leave real headroom for the answer: a context block sized to fill the window leaves the model nowhere to write.',
      },
      visual: {
        kind: 'layered_stack',
        layers: [
          {
            id: 'question',
            label: 'The question, restated last',
            role: 'End position — high attention',
            detail: 'Repeating the question after the context is a cheap and reliable improvement. It sits in the most-attended position and re-anchors the model on what was actually asked after a long block of source material.',
            accent: 'rgb(20 184 166)',
          },
          {
            id: 'tail',
            label: 'Ranks 2–3',
            role: 'End of the context block',
            detail: 'The other strong passages go at the end of the block, where they are used more reliably than the middle. Ordering by rank alone leaves them wherever they fall.',
          },
          {
            id: 'middle',
            label: 'Weaker passages, if any',
            role: 'Middle — lowest attention',
            detail: 'If a passage is only good enough for the middle, ask whether it is good enough to include at all. This is where context earns its reputation for diminishing returns.',
          },
          {
            id: 'top',
            label: 'Rank 1 passage',
            role: 'Start of the context block',
            detail: 'The best passage from reranking, delimited and labelled with a stable id so the model can cite it. Placed first, where attention is strongest.',
            topicId: 'reranking',
          },
          {
            id: 'instructions',
            label: 'Instructions and grounding rules',
            role: 'Before the context',
            detail: 'How to answer, how to cite, and what to do when the passages do not contain the answer. This must precede the context — rules stated afterwards are competing with everything they were meant to govern.',
            topicId: 'rag-prompt-templates',
          },
          {
            id: 'system',
            label: 'System prompt',
            role: 'Foundation — stable across requests',
            detail: 'Role and persistent constraints. Keeping it byte-stable across requests is also what makes prompt caching effective, since the cache is keyed on an unchanging prefix.',
          },
        ],
      },
      docUrl: 'https://arxiv.org/abs/2307.03172',
      coverageStatus: 'full',
      tags: ['context window', 'lost in the middle', 'ordering', 'prompt'],
      relatedTopicIds: ['rag-prompt-templates', 'diversity-mmr', 'reranking'],
    }),

    t({
      id: 'citations-grounding',
      title: 'Citations and source attribution',
      oneLiner:
        'An answer nobody can check is an answer nobody should act on — attribution is a retrieval property, not a formatting flourish.',
      whyItMatters:
        'In a regulated setting the citation is often the deliverable. It is what lets a reviewer verify a claim, what an auditor asks to see, and what turns a wrong answer from an incident into a caught mistake.',
      explanation: {
        plain:
          'Every statement in an answer should be traceable to the passage it came from, and that passage should be traceable to the document it was cut out of. This only works if the identifiers travel all the way through — from the original file, into the chunk, into the prompt, and back out in the answer.',
        technical:
          'Attribution is a chain, and it breaks at whichever link was not designed for it. Source metadata must be attached at ingest and stored alongside the vector; the retrieve call must return it; the context assembly must label each passage with a stable identifier; and the prompt must require the model to cite those identifiers. Managed knowledge bases return source attribution with retrieved results, which supplies the middle of the chain — the ends are still yours to build. Two properties are worth enforcing rather than hoping for. Citations must be verified programmatically, not trusted: check that every identifier the model emitted exists in the passages you actually supplied, because a fabricated citation is worse than none. And they should resolve to something a user can open — a document plus a section, not an opaque chunk id — since a citation nobody can follow provides the appearance of verifiability without the substance.',
      },
      visual: {
        kind: 'sequence_trace',
        spans: [
          { id: 'ingest', label: 'Ingest: attach source metadata', detail: 'Document uri, title, section path and version are written alongside each chunk. Nothing later in the chain can recover what was not captured here.', depth: 0, kind: 'entrypoint' },
          { id: 'retrieve', label: 'Retrieve: metadata comes back with the passage', detail: 'The retrieve response carries source attribution per result, not just the text. This is the link the managed service provides for you.', depth: 1, kind: 'gateway' },
          { id: 'assemble', label: 'Assemble: label each passage', detail: 'Each passage is delimited and tagged with a stable id — [S1], [S2] — mapped back to its source metadata in a table you keep server-side.', depth: 1, kind: 'tool' },
          { id: 'instruct', label: 'Instruct: require citation of those ids', detail: 'The prompt states that every factual claim must carry a bracketed source id, and that claims not supported by a passage must not be made at all.', depth: 1, kind: 'model' },
          { id: 'generate', label: 'Generate: answer with inline ids', detail: 'The model writes the answer citing [S1] and [S3]. At this point the citations are a claim by the model, not yet a fact.', depth: 2, kind: 'model' },
          { id: 'verify', label: 'Verify: every cited id was actually supplied', detail: 'Programmatically check each emitted id against the set you sent. An id you never supplied is a fabricated citation — reject or regenerate rather than render it.', depth: 1, kind: 'auth', note: 'The step most often skipped' },
          { id: 'render', label: 'Render: resolve ids to openable links', detail: 'Ids become document titles and deep links a reader can follow. A citation that cannot be opened is decoration.', depth: 1, kind: 'response' },
        ],
      },
      docUrl: KB_DOCS,
      verificationId: 'bedrock_kb_managed',
      coverageStatus: 'full',
      tags: ['citations', 'attribution', 'audit', 'traceability'],
      relatedTopicIds: ['grounding-checks', 'metadata-filtering'],
      appliedIn: [
        { label: 'Guardrailed secure RAG — citations as a control', to: '/architecture/guardrailed_secure_rag' },
        { label: 'Security & compliance', to: '/security' },
      ],
    }),

    t({
      id: 'grounding-checks',
      title: 'Grounding and relevance checks',
      oneLiner:
        'Two separate questions, asked automatically before the answer ships: is it supported by the passages, and does it answer what was asked?',
      whyItMatters:
        'These catch the two failures a fluent answer hides best. A response can be beautifully grounded in the retrieved passages and entirely beside the point, or perfectly on topic and quietly invented — and neither is visible from reading it.',
      explanation: {
        plain:
          'Before showing an answer, check it twice. First, is everything it says actually supported by the passages that were retrieved — or did the model add something of its own? Second, does it address the question that was asked, rather than an adjacent one? Failing either check should stop the answer, not decorate it with a warning.',
        technical:
          'Bedrock Guardrails provides a contextual grounding check that scores a response against the source passages and against the query, with configurable thresholds for each — grounding for support, relevance for on-topic-ness. Treat the thresholds as a policy decision rather than a default: a higher grounding threshold refuses more answers, which is correct where a wrong answer is costly and wrong where the tool is exploratory. What matters as much as the score is the behaviour on failure, and there are only three honest options — refuse and say so, retry with different retrieval, or escalate to a human. Rendering the answer with a caveat attached is not one of them; users read the answer and skip the caveat. Log every failure with its query and passages, because a rising grounding-failure rate is the earliest reliable signal that retrieval has degraded — typically the first symptom of an index that has gone stale.',
      },
      visual: {
        kind: 'decision_tree',
        root: {
          id: 'root',
          question: 'Is every claim in the answer supported by the retrieved passages?',
          options: [
            {
              label: 'Yes — it is grounded',
              next: {
                id: 'relevance',
                question: 'Does the answer address the question that was actually asked?',
                options: [
                  {
                    label: 'Yes',
                    next: {
                      id: 'ship',
                      recommendation: 'Ship it, with citations',
                      reasoning:
                        'Grounded and relevant. Render the answer with resolvable citations and log the grounding and relevance scores — the trend in those numbers is your early warning that retrieval is drifting.',
                    },
                  },
                  {
                    label: 'No — it answers something adjacent',
                    next: {
                      id: 'requery',
                      recommendation: 'Retry retrieval, do not re-prompt',
                      reasoning:
                        'A grounded but irrelevant answer usually means retrieval returned the wrong passages, and the model faithfully summarised them. Rewrite or decompose the query and retrieve again. Asking the same model to try harder on the same passages will not help — the material it needs is not in front of it.',
                    },
                  },
                ],
              },
            },
            {
              label: 'No — some claims are unsupported',
              next: {
                id: 'unsupported',
                question: 'Did retrieval return anything genuinely relevant at all?',
                options: [
                  {
                    label: 'Yes, but the model went beyond it',
                    next: {
                      id: 'regenerate',
                      recommendation: 'Regenerate with a stricter instruction',
                      reasoning:
                        'The passages were adequate and the model filled a gap on its own. Tighten the instruction to answer only from the supplied passages and to state plainly when they are insufficient, then generate again from the same context.',
                    },
                  },
                  {
                    label: 'No, the passages were poor',
                    next: {
                      id: 'refuse',
                      recommendation: 'Refuse, and say why',
                      reasoning:
                        'Tell the user the knowledge base does not cover this, rather than producing an answer with a hedge attached — caveats are not read. Log the query: a cluster of these is a content gap, which is a retrieval problem no amount of prompting will fix.',
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      docUrl: GUARDRAILS_DOCS,
      verificationId: 'bedrock_guardrails',
      coverageStatus: 'full',
      tags: ['grounding', 'guardrails', 'hallucination', 'relevance'],
      relatedTopicIds: ['citations-grounding', 'answer-verification'],
      appliedIn: [
        { label: 'Guardrailed secure RAG', to: '/architecture/guardrailed_secure_rag' },
        { label: 'Failure modes — ungrounded answers', to: '/failure-modes' },
      ],
    }),

    t({
      id: 'rag-prompt-templates',
      title: 'Prompting over retrieved context',
      oneLiner:
        'The prompt’s real job is telling the model what to do when the passages do not contain the answer.',
      whyItMatters:
        'Most RAG prompts specify the happy path in detail and leave the unhappy path unstated. That silence is where hallucination enters: given no instruction about insufficient context, a helpful model does the helpful thing and fills the gap from memory.',
      explanation: {
        plain:
          'A good prompt for answering from documents does four things: says to answer only from the supplied passages, says exactly how to cite them, says what to do when the passages fall short, and puts the question last so it is fresh. The third is the one most often missing and the one that matters most.',
        technical:
          'Structure the prompt so instructions precede context and the question follows it. Delimit passages explicitly and label each with the stable id the model must cite. Then state the insufficiency behaviour in concrete terms — say that the passages do not contain the answer, name what is missing, and do not supplement from prior knowledge — because "be accurate" is not an instruction a model can act on. Two further points pay off. Keep the invariant prefix byte-stable so prompt caching applies to it, since the system prompt and instruction block are identical across every request and are the largest cacheable span you have. And resist encoding retrieval fixes as prompt instructions: telling the model to prefer recent documents cannot work if recency is not in the context, and the real fix is a metadata filter at retrieval. A prompt cannot repair what retrieval did not supply.',
      },
      visual: {
        kind: 'flow_walkthrough',
        steps: [
          {
            id: 'role',
            label: 'Role and constraints',
            plain: 'Say what the assistant is and the rules it always follows.',
            technical: 'Stable across every request, which makes it the natural head of a cached prefix. Keep volatile content out of it entirely.',
            codeSampleId: 'rag-prompt',
          },
          {
            id: 'rules',
            label: 'Grounding and citation rules',
            plain: 'Answer only from the passages, and cite them a specific way.',
            technical: 'State the citation format concretely — bracketed ids matching the passage labels — so the output can be parsed and verified rather than merely read.',
            codeSampleId: 'rag-prompt',
          },
          {
            id: 'insufficient',
            label: 'What to do when the answer is not there',
            plain: 'Spell out the behaviour when the passages fall short.',
            technical: 'The load-bearing instruction. Name the required behaviour explicitly: state that the passages do not contain the answer, say what is missing, do not supplement from prior knowledge. Omit this and the model resolves the ambiguity in favour of being helpful.',
            codeSampleId: 'rag-prompt',
          },
          {
            id: 'context',
            label: 'The passages, labelled',
            plain: 'Each retrieved passage, clearly separated and tagged.',
            technical: 'Delimited and labelled [S1], [S2]. Ordered by rank with the strongest at the edges rather than left wherever the ranking put them.',
            codeSampleId: 'rag-prompt',
          },
          {
            id: 'question',
            label: 'The question, last',
            plain: 'Repeat the user’s question after the context.',
            technical: 'The end position is attended to most reliably, and after a long context block the model benefits from being re-anchored on what was asked.',
            codeSampleId: 'rag-prompt',
          },
        ],
      },
      codeSamples: [
        {
          id: 'rag-prompt',
          title: 'Assembling a grounded prompt',
          language: 'python',
          filename: 'prompt.py',
          code: `"""Assemble a RAG prompt from reranked passages.

The invariant prefix is kept byte-stable so it can be cached; only the
passages and the question change between requests.
"""

SYSTEM = """You are Meridian's internal policy assistant. You answer questions
about company policy for employees, using only the source passages provided to
you in each request."""

INSTRUCTIONS = """Answer using only the passages below.

Cite every factual claim with the bracketed id of the passage it came from,
like [S1]. Cite only ids that appear below.

If the passages do not contain the answer, say so plainly, name what is
missing, and stop. Do not answer from prior knowledge, and do not offer a
partial answer with a caveat attached."""


def build_prompt(passages, question):
    """passages: reranked, best first. Strongest go at the block's edges."""
    ordered = _edges_first(passages[:5])

    blocks = []
    for i, p in enumerate(ordered, start=1):
        # The label is what the model must cite, and what we verify against.
        blocks.append(f"[S{i}] {p['source_title']} - {p['section']}\\n{p['text']}")

    context = "\\n\\n".join(blocks)

    # Question last: the end of the prompt is attended to most reliably, and
    # re-anchors the model after a long context block.
    return f"{INSTRUCTIONS}\\n\\n<passages>\\n{context}\\n</passages>\\n\\nQuestion: {question}"


def _edges_first(passages):
    """Rank 1 first, rank 2 last, and the weaker ones buried in the middle."""
    out = []
    tail = []
    for i, p in enumerate(passages):
        (out if i % 2 == 0 else tail).append(p)
    return out + list(reversed(tail))`,
          verifyServices: ['bedrock_foundation_models'],
        },
      ],
      docUrl: KB_DOCS,
      verificationId: 'bedrock_kb_managed',
      coverageStatus: 'full',
      tags: ['prompt', 'grounding', 'caching', 'template'],
      relatedTopicIds: ['context-packing', 'grounding-checks'],
    }),

    t({
      id: 'answer-verification',
      title: 'Verifying the answer before it ships',
      oneLiner:
        'A last pass that checks claims against passages — useful, bounded, and routinely oversold.',
      whyItMatters:
        'Verification is where teams either add a real safety net or add latency and cost for a comforting illusion. The difference is entirely in what does the checking: deterministic checks catch what they claim to catch, while a model reviewing its own work shares the blind spots that produced the error.',
      explanation: {
        plain:
          'Before an answer goes out, you can check it. Some checks are exact — do the cited sources exist, do the quoted numbers appear in the passages, is anything asserted that no passage mentions. Others ask another model to review the answer, which helps but is not a proof: a model can be as confident about a bad review as about a bad answer.',
        technical:
          'Order the checks by cost and by how much they can be trusted. Deterministic checks come first because they are nearly free and genuinely reliable: every cited id was supplied, every number and date in the answer appears in some passage, the answer is not empty when passages were found. Then the managed grounding check, which is calibrated and configurable and does not depend on a prompt you wrote. Only then a model-based reviewer, and with clear eyes about it — asking the same model family to verify its own output correlates errors, adds a full generation of latency, and produces a judgement that is itself unverified. Sampling rather than checking every response is often the right economic answer, with full checking reserved for high-stakes paths. Whatever the outcome, log it: verification’s most durable value is not the answers it blocks but the failure-rate trend it exposes, which is usually the first place a stale index shows up.',
      },
      visual: {
        kind: 'lifecycle_timeline',
        stages: [
          {
            id: 'draft',
            label: 'The answer is drafted',
            plain: 'The model produces an answer from the passages, with citations.',
            technical: 'At this point every claim in it — including every citation — is unverified. Treat it as a candidate rather than a result.',
          },
          {
            id: 'deterministic',
            label: 'Deterministic checks',
            plain: 'Check mechanically: do the cited sources exist, do the numbers appear in the passages?',
            technical: 'Nearly free, fully reliable, and catches fabricated citations and invented figures outright. Run these first and fail fast — there is no reason to pay for a model-based check on an answer citing a source that was never supplied.',
          },
          {
            id: 'grounding',
            label: 'Managed grounding check',
            plain: 'Score how well the answer is supported by the passages, and how well it matches the question.',
            technical: 'Guardrails contextual grounding, with thresholds set as a deliberate policy choice. Calibrated and independent of any prompt you wrote, which is what makes it more trustworthy than a reviewer you prompt yourself.',
          },
          {
            id: 'judge',
            label: 'Model review — optional, and sampled',
            plain: 'Another model reads the answer and the passages and flags problems.',
            technical: 'Catches subtler issues the earlier checks miss, at the cost of a full generation of latency. Use a different model family than the one that wrote the answer, since a model reviewing its own output shares its blind spots. Sampling a percentage of traffic is usually the right trade outside high-stakes paths.',
          },
          {
            id: 'act',
            label: 'Act, then log either way',
            plain: 'Ship, retry or refuse — and record the outcome regardless.',
            technical: 'On failure: refuse, retry retrieval, or escalate. Never render a failed answer with a caveat. Log passing and failing checks alike — the failure-rate trend over time is worth more than any individual verdict, and it is where a degrading index announces itself first.',
          },
        ],
      },
      docUrl: GUARDRAILS_DOCS,
      verificationId: 'bedrock_guardrails',
      coverageStatus: 'full',
      tags: ['verification', 'llm-as-judge', 'self-check', 'quality'],
      relatedTopicIds: ['grounding-checks', 'measuring-retrieval'],
      appliedIn: [
        { label: 'Evaluate — evaluation and observability', to: '/evaluate' },
      ],
    }),
  ],
}
