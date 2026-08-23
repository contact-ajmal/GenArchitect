import type { CaseStudyDeepDive } from '../../types'

/**
 * Bridgewater Associates — the Artificial Investment Associate.
 *
 * PROVENANCE RULE FOR THIS FILE: Bridgewater and AWS have published talks,
 * quotes and a customer story. They have NOT published a reference
 * architecture. So the "documented" diagram carries a service logo only where
 * a service was named out loud — Amazon Bedrock and Amazon Textract — and
 * every other node says plainly that the product is not public. The second
 * diagram is our own build of the same design on current AWS and is labelled
 * as ours, which is what makes it safe to put logos on.
 *
 * Do not "tidy" an inferred node by giving it an awsServiceId. That converts a
 * guess into an assertion about a real company's systems.
 */

const ACCENT = '#0F766E'

export const bridgewaterAia: CaseStudyDeepDive = {
  useCaseId: 'bridgewater-artificial-investment-associate',
  company: 'Bridgewater Associates',
  headline:
    'An “Artificial Investment Associate” that chains LLM steps into an investment research process — with the analyst kept in the loop.',

  provenance:
    'Bridgewater and AWS have described this system in a fireside chat, an AWS blog quote and an Anthropic customer story. Neither has published a reference architecture. The first diagram below shows only what was said publicly, and marks every node whose product was never named; the second is our own reconstruction on current AWS, offered as a build you could actually follow. Read them as two different kinds of claim.',

  sources: [
    {
      id: 'aws-blog',
      label: 'Significant new capabilities make it easier to use Amazon Bedrock — AWS ML Blog',
      url: 'https://aws.amazon.com/blogs/machine-learning/new-capabilities-make-it-easier-to-use-amazon-bedrock-to-build-and-scale-generative-ai-applications-and-deliver-impact/',
      publisher: 'AWS',
      tier: 'official',
    },
    {
      id: 'aws-video',
      label: 'Bridgewater’s AI Investment Associate with Bedrock — AWS fireside chat',
      url: 'https://aws.amazon.com/video/watch/5b319684c66/',
      publisher: 'AWS',
      tier: 'official',
    },
    {
      id: 'anthropic',
      label: 'Claude for Financial Services — Anthropic',
      url: 'https://www.anthropic.com/news/claude-for-financial-services',
      publisher: 'Anthropic',
      tier: 'official',
    },
    {
      id: 'insider',
      label: 'Bringing AI into the investment process — coverage of the AWS fireside chat',
      url: 'https://theaiinsider.tech/2024/04/26/bringing-ai-into-the-investment-process-bridgewaters-artificial-investment-associate/',
      publisher: 'The AI Insider',
      date: '2024-04-26',
      tier: 'press',
    },
    {
      id: 'press-fund',
      label: 'Bridgewater launches $2bn machine-learning-driven fund',
      url: 'https://www.hedgeweek.com/bridgewater-launches-2bn-machine-learning-driven-fund/',
      publisher: 'Hedgeweek',
      date: '2024',
      tier: 'press',
    },
  ],

  sections: [
    {
      id: 'what',
      title: 'What they built',
      body: [
        'Bridgewater Associates runs a systematic macro investment process: hypotheses about how economies work, tested against data, expressed as rules. AIA Labs — Bridgewater’s innovation unit, whose CTO is Aaron Linsky — set out to put a large language model inside that process rather than beside it. The result is called the Artificial Investment Associate.',
        'The framing AWS and Bridgewater have used is deliberately not “a chatbot for analysts”. It is a system that analyses data, generates hypotheses and improves over time, with human investment professionals retaining oversight. The nearest thing to a product surface that has been described publicly is the Investment Analyst Assistant: the analyst-facing tool that takes an instruction, writes Python, runs it, works through its own errors, and returns charts and tables.',
        'Anthropic’s account of the same tool is the most concrete description available of what it does day to day. An analyst investigating something like the effect of monetary tightening on commodity prices would normally spend hours writing code to pull series, compute indicators and plot them. Linsky’s own description is that Claude powered the first versions of the assistant, generating Python, creating visualisations and iterating through the analysis with the precision of a junior analyst. Just as important, the generated code stays editable in place, so the analyst can take over at any line rather than re-prompting for a change they could make themselves in five seconds.',
      ],
    },
    {
      id: 'blueprints',
      title: 'Blueprints — the idea worth stealing',
      body: [
        'The architectural centre of the system is a concept Bridgewater calls a blueprint. In Linsky’s description it is a set of steps able to answer questions more complex than a single prompt could. A blueprint chains LLM queries together with ordinary data-processing steps into a repeatable procedure.',
        'What makes this more than a workflow engine is who writes them. Bridgewater’s position is that the best prompt engineers are the subject-matter experts — the end users themselves. An investment associate who knows how the firm reasons about a question encodes that reasoning as a blueprint, and the blueprint then runs consistently, at scale, for everyone.',
        'That inverts the usual failure mode of enterprise LLM projects, where a platform team owns the prompts and becomes a bottleneck between the model and the people who understand the domain. Here the platform team owns the runner, the model access and the guardrails; the domain experts own the reasoning. It is the same separation of concerns that makes a good internal tool work, applied to prompting.',
      ],
    },
    {
      id: 'bedrock',
      title: 'Why Amazon Bedrock, specifically',
      body: [
        'Linsky has been unusually direct about what Bedrock is doing for them: it is an abstraction layer, and what matters is getting the best models available. AWS quotes him describing the use of the best available foundation models — Claude 3 is named — for different tasks, with seamless model experimentation.',
        'That is a substantive architectural choice rather than a vendor preference. If a blueprint is a chain of steps, each step is a different job: one might need long-context synthesis, another cheap classification, another careful code generation. Binding the whole chain to one model would mean over-paying for the easy steps and under-serving the hard ones. Binding it to one provider would mean re-platforming every time the frontier moves — which, over the life of this system, it has repeatedly.',
        'The model-per-step design only pays off if swapping a model is genuinely cheap, and that is exactly the property a single API across providers buys you. It is worth being clear that this is a claim about the shape of the integration, not about which specific models are in production today; that has certainly changed since the public statements were made.',
      ],
    },
    {
      id: 'textract',
      title: 'The unglamorous part that decided the quality',
      body: [
        'The detail most worth carrying away is about PDF parsing. Bridgewater uses Amazon Textract to pull text and tables out of PDF financial reports, and Linsky described the output landing in clean Markdown — with Textract becoming their preferred PDF parser for their retrieval pipelines.',
        'This sounds like plumbing and is not. A financial filing carries most of its meaning in tables, and a naive text extractor flattens a table into a stream of numbers with the column headers somewhere far above them. Every downstream stage then inherits that damage: the chunker splits nonsense, the embedding represents nonsense, and retrieval confidently returns a chunk in which "1,240" has no idea it was ever revenue. No reranker recovers from it.',
        'That a firm with Bridgewater’s resources singles out the parser as the thing that impressed them is the useful signal. The parsing step is where retrieval quality is won or lost for document-heavy corpora, and it is routinely the step that gets the least attention.',
      ],
    },
    {
      id: 'oversight',
      title: 'Human oversight, and what the fund actually is',
      body: [
        'AIA Labs began trading a machine-learning-driven fund with close to $2bn of client capital on 1 July 2024, after testing the approach from late 2023 with roughly $100m carved out of an existing fund. Machine learning is reported as the primary basis for its investment decisions, with humans still managing risk, data acquisition and trade execution.',
        'The distinction matters for anyone reading this as a template. The analyst-facing assistant and the fund are two different things at two different risk levels. The assistant accelerates research a human then judges — a wrong chart is caught by the person who asked for it. The fund is a systematic strategy where the model’s output has consequences without a human reading each one, which is why the oversight described sits around it in the form of risk management rather than inside it as answer-checking.',
        'Public reporting has also referred to layered guardrails intended to hold down error rates. We have not found a primary source describing how those layers work, so we do not reproduce the specific figures that circulate; treat the existence of layered checking as the durable lesson and the numbers as unverified.',
      ],
    },
  ],

  diagrams: [
    {
      id: 'documented',
      title: 'The AIA as publicly described',
      kind: 'documented',
      blurb:
        'Only what has actually been said out loud. Two nodes carry an AWS logo because two services were named — Amazon Bedrock and Amazon Textract. Every other node is shaped by public description but its product was never disclosed, and is marked accordingly rather than given a plausible logo.',
      diagram: {
        name: 'Bridgewater AIA — as publicly described',
        accentColor: ACCENT,
        layers: [
          {
            id: 'pdfs',
            label: 'PDF filings & research',
            layer: 'sources',
            role: 'corpus',
            note: 'The document corpus Textract was pointed at. Storage layer not publicly named.',
          },
          {
            id: 'series',
            label: 'Market & economic data',
            layer: 'sources',
            role: 'timeseries',
            note: 'Bridgewater’s own data. Steps compute indicators over it; the platform is internal.',
          },
          {
            id: 'textract',
            label: 'Amazon Textract',
            layer: 'ingestion',
            role: 'parser',
            awsServiceId: 'textract',
            note: 'Named publicly: extracts text and tables from PDFs, output as Markdown.',
          },
          {
            id: 'markdown',
            label: 'Markdown corpus',
            layer: 'ingestion',
            role: 'normalised text',
            note: 'The parse output Linsky described. Tables survive as tables.',
          },
          {
            id: 'kb',
            label: 'Knowledge base',
            layer: 'index',
            role: 'index',
            note: 'Described publicly as feeding a knowledge base / retrieval pipeline. Vector store not named.',
          },
          {
            id: 'retrieve',
            label: 'Retrieval into a step',
            layer: 'retrieval',
            role: 'retriever',
            note: 'A blueprint step can pull from the corpus. Retrieval strategy not disclosed.',
          },
          {
            id: 'blueprint',
            label: 'Blueprint',
            layer: 'orchestration',
            role: 'procedure',
            note: 'An ordered set of steps, authored by investment subject-matter experts.',
          },
          {
            id: 'runner',
            label: 'Step runner',
            layer: 'orchestration',
            role: 'orchestrator',
            note: 'Chains LLM queries with data-processing steps. Implementation not disclosed.',
          },
          {
            id: 'bedrock',
            label: 'Amazon Bedrock',
            layer: 'generation',
            role: 'model access',
            awsServiceId: 'bedrock_foundation_models',
            note: 'Named publicly: the abstraction layer, best available FM chosen per step.',
          },
          {
            id: 'python',
            label: 'Generated Python',
            layer: 'generation',
            role: 'analysis code',
            note: 'The assistant writes code, runs it, works through errors, returns charts and tables.',
          },
          {
            id: 'checks',
            label: 'Layered checks',
            layer: 'guardrails',
            role: 'validation',
            note: 'Layered guardrails referred to publicly; no primary source describes the layers.',
          },
          {
            id: 'analyst',
            label: 'Investment analyst',
            layer: 'consumption',
            role: 'human in the loop',
            note: 'Reviews output and edits the generated code in place rather than re-prompting.',
          },
        ],
      },
      steps: [
        {
          id: 'parse',
          order: 1,
          title: 'Filings are parsed before anything else happens',
          diagramComponentIds: ['pdfs', 'textract', 'markdown'],
          plain:
            'Financial PDFs go through Amazon Textract, which pulls out the text and — critically — the tables, writing the result as clean Markdown.',
          technical:
            'Textract is the named parser and, per Linsky, became their preferred one for retrieval pipelines. The output format matters as much as the extraction: Markdown keeps a table addressable as a table, so a figure stays attached to the column header that gives it meaning. Everything downstream inherits the quality of this step and nothing downstream can repair it.',
          confidence: 'sourced',
          sourceIds: ['insider'],
        },
        {
          id: 'index',
          order: 2,
          title: 'The parsed corpus becomes retrievable',
          diagramComponentIds: ['markdown', 'kb', 'series'],
          plain:
            'The Markdown corpus is indexed so that a later step can search it, alongside Bridgewater’s own market and economic data.',
          technical:
            'Public statements refer to feeding a knowledge base and to retrieval pipelines, but name no vector store, embedding model, or chunking strategy. The node is drawn because the capability was described; it carries no logo because the product was not.',
          confidence: 'inferred',
          basis:
            'Textract is described as the preferred parser “for their RAG pipelines”, which entails an index and a retrieval step. The specific components are our inference and are not claimed.',
        },
        {
          id: 'authoring',
          order: 3,
          title: 'A domain expert authors the blueprint',
          diagramComponentIds: ['blueprint'],
          plain:
            'An investment specialist writes down the sequence of steps needed to answer a class of question — not a single prompt, but a procedure.',
          technical:
            'Linsky defines a blueprint as a set of steps able to answer questions more complex than a single prompt, and argues the best prompt engineers are the subject-matter experts themselves. Architecturally this is the load-bearing decision: the platform owns the runner and the model access, the domain owns the reasoning, and neither blocks the other.',
          confidence: 'sourced',
          sourceIds: ['insider', 'aws-video'],
        },
        {
          id: 'execute',
          order: 4,
          title: 'The runner executes the chain, model by model',
          diagramComponentIds: ['runner', 'retrieve', 'bedrock'],
          plain:
            'Each step runs in order. Some steps fetch and process data, some ask a language model, and different steps can use different models.',
          technical:
            'Bedrock is described as an abstraction layer giving access to the best available foundation models — Claude 3 named — for different tasks, with seamless experimentation. Per-step model choice is the pay-off: a chain has cheap classification steps and expensive reasoning steps, and binding all of them to one model over-pays for the former while under-serving the latter.',
          confidence: 'sourced',
          sourceIds: ['aws-blog', 'insider'],
        },
        {
          id: 'code',
          order: 5,
          title: 'Analysis is written as code, not prose',
          diagramComponentIds: ['bedrock', 'python', 'series'],
          plain:
            'Rather than describing an answer, the model writes Python that computes it, runs the code, fixes its own errors, and produces charts and tables.',
          technical:
            'Anthropic quotes Linsky describing Claude generating Python, creating data visualisations and iterating through complex financial analysis with the precision of a junior analyst. Generating code rather than an answer is what makes the output checkable: a number in prose has to be trusted, while a number produced by code that a human can read has a derivation attached to it.',
          confidence: 'sourced',
          sourceIds: ['anthropic'],
        },
        {
          id: 'review',
          order: 6,
          title: 'The analyst edits in place',
          diagramComponentIds: ['checks', 'analyst', 'python'],
          plain:
            'The analyst reviews what came back and can change the code directly instead of asking the model to try again.',
          technical:
            'Edit-in-place is a small feature with a large consequence: it makes the model a starting point rather than an oracle, and removes the re-prompting loop for changes a human could make in seconds. Layered guardrails around the system have been referred to publicly, but no primary source describes their composition, so the node names the capability without claiming a design.',
          confidence: 'sourced',
          sourceIds: ['anthropic', 'aws-video'],
        },
      ],
    },

    {
      id: 'reference',
      title: 'Building the same design on AWS today',
      kind: 'reference',
      blurb:
        'Our reconstruction, not Bridgewater’s architecture. The public statements pre-date Bedrock AgentCore, so this is how the same design — SME-authored step chains, per-step model choice, table-aware parsing, code-generating analysis, human review — maps onto the current AWS surface. Every service here is named because we are the ones naming it.',
      diagram: {
        name: 'Blueprint-style research assistant — reference build',
        accentColor: ACCENT,
        layers: [
          { id: 'r_s3', label: 'Amazon S3', layer: 'sources', role: 'raw corpus', awsServiceId: 's3', note: 'Filings, research notes, transcripts.' },
          { id: 'r_textract', label: 'Amazon Textract', layer: 'ingestion', role: 'parser', awsServiceId: 'textract', note: 'Text + tables → Markdown, preserving structure.' },
          { id: 'r_chunk', label: 'Custom chunking transform', layer: 'ingestion', role: 'chunker', awsServiceId: 'bedrock_kb_managed', note: 'One chunk per section, table headers repeated into row chunks.' },
          { id: 'r_embed', label: 'Bedrock embeddings', layer: 'index', role: 'embedder', awsServiceId: 'bedrock_foundation_models', note: 'Titan or Cohere; dimension chosen against measured recall.' },
          { id: 'r_aoss', label: 'OpenSearch Serverless', layer: 'index', role: 'vector + lexical index', awsServiceId: 'opensearch_serverless', note: 'Both retrieval modes in one engine — filings are full of exact identifiers.' },
          { id: 'r_hybrid', label: 'Hybrid retrieve', layer: 'retrieval', role: 'retriever', awsServiceId: 'bedrock_kb_managed', note: 'BM25 + vector, fused. Metadata filter derived from the caller’s identity.' },
          { id: 'r_rerank', label: 'Rerank', layer: 'retrieval', role: 'reranker', awsServiceId: 'bedrock_kb_managed', note: 'Retrieve deep, rerank, keep the top few.' },
          { id: 'r_runtime', label: 'AgentCore Runtime', layer: 'orchestration', role: 'blueprint host', awsServiceId: 'agentcore_runtime', note: 'Runs the step chain in an isolated session per invocation.' },
          { id: 'r_gateway', label: 'AgentCore Gateway', layer: 'orchestration', role: 'tool access', awsServiceId: 'agentcore_gateway', note: 'Market-data APIs and the knowledge base exposed as governed tools.' },
          { id: 'r_memory', label: 'AgentCore Memory', layer: 'memory', role: 'session + long-term', awsServiceId: 'agentcore_memory', note: 'Carries a research thread across turns. Not a substitute for retrieval.' },
          { id: 'r_fm', label: 'Bedrock foundation models', layer: 'generation', role: 'per-step model', awsServiceId: 'bedrock_foundation_models', note: 'The point of the abstraction: a different model per step, swappable.' },
          { id: 'r_code', label: 'AgentCore Code Interpreter', layer: 'generation', role: 'sandboxed execution', awsServiceId: 'agentcore_code_interpreter', note: 'Runs the generated Python and returns charts and tables.' },
          { id: 'r_guard', label: 'Bedrock Guardrails', layer: 'guardrails', role: 'grounding check', awsServiceId: 'bedrock_guardrails', note: 'Contextual grounding and relevance thresholds before an answer ships.' },
          { id: 'r_identity', label: 'AgentCore Identity', layer: 'guardrails', role: 'scoped credentials', awsServiceId: 'agentcore_identity', note: 'The agent acts as the analyst, so entitlements are enforced, not assumed.' },
          { id: 'r_obs', label: 'AgentCore Observability', layer: 'observability', role: 'traces', awsServiceId: 'agentcore_observability', note: 'Per-step traces — a blueprint failure has to be attributable to a step.' },
          { id: 'r_cw', label: 'Amazon CloudWatch', layer: 'observability', role: 'metrics + audit', awsServiceId: 'cloudwatch', note: 'Grounding-failure rate over time is the earliest signal the index went stale.' },
          { id: 'r_analyst', label: 'Analyst review', layer: 'consumption', role: 'human in the loop', note: 'Code returned editable in place, with citations that resolve to the filing.' },
        ],
      },
      steps: [
        {
          id: 'r_ingest',
          order: 1,
          title: 'Parse for tables, chunk for records',
          diagramComponentIds: ['r_s3', 'r_textract', 'r_chunk'],
          plain:
            'Filings land in S3, Textract extracts their tables as tables, and a custom chunking step keeps each row attached to its header.',
          technical:
            'This is the step Bridgewater’s experience argues you should over-invest in. A managed knowledge base’s built-in splitters have no idea a table row is meaningless without its header, so this is a legitimate use of a custom transform: one chunk per section for prose, one chunk per row with the header repeated for tables.',
          confidence: 'inferred',
          basis:
            'Extends the sourced Textract-to-Markdown detail into a concrete chunking design. Bridgewater has not described their chunking.',
        },
        {
          id: 'r_index',
          order: 2,
          title: 'Index for both kinds of question',
          diagramComponentIds: ['r_embed', 'r_aoss', 'r_hybrid', 'r_rerank'],
          plain:
            'Chunks are embedded and indexed in a store that does keyword search as well as vector search, then results are reordered by a reranker.',
          technical:
            'Financial questions carry exact tokens — CUSIPs, ticker symbols, filing references, clause numbers — which embed poorly and match lexically. Running both retrievers and fusing them is the difference between finding a specific filing and finding five documents about the same subject. Reranking then fixes the ordering that the fast first stage only approximated.',
          confidence: 'inferred',
          basis:
            'Standard practice for document-heavy financial corpora, and the natural build on the current AWS surface. Not described by Bridgewater.',
        },
        {
          id: 'r_run',
          order: 3,
          title: 'The blueprint runs as a hosted agent',
          diagramComponentIds: ['r_runtime', 'r_gateway', 'r_memory', 'r_fm'],
          plain:
            'The step chain runs in a managed, isolated runtime, reaching data and tools through a governed gateway, choosing a model per step.',
          technical:
            'AgentCore Runtime gives each invocation session isolation, which matters when a step executes generated code against firm data. Gateway turns market-data APIs and the knowledge base into governed tools rather than credentials embedded in a step. Per-step model selection is the design being preserved from the original: the abstraction only pays off if swapping is genuinely cheap.',
          confidence: 'inferred',
          basis:
            'Maps the sourced blueprint and per-step-model design onto AgentCore, which post-dates the public statements. Bridgewater has not said they use AgentCore.',
        },
        {
          id: 'r_code_exec',
          order: 4,
          title: 'Generated code runs in a sandbox',
          diagramComponentIds: ['r_fm', 'r_code'],
          plain:
            'The model writes Python, and it executes somewhere isolated that can return charts and tables but cannot reach anything it should not.',
          technical:
            'Model-generated code executing against firm data is the highest-risk component here. A managed sandbox with no ambient credentials is the control that makes the pattern defensible: the blast radius of a bad generation is a failed chart, not an API call. Errors come back to the model to fix, which is the loop Anthropic described.',
          confidence: 'inferred',
          basis:
            'The behaviour — generate, run, fix errors, return charts — is sourced; the execution environment is our choice.',
        },
        {
          id: 'r_verify',
          order: 5,
          title: 'Check before it reaches a human',
          diagramComponentIds: ['r_guard', 'r_identity', 'r_obs', 'r_cw'],
          plain:
            'Answers are checked for whether the passages actually support them, the agent only ever sees what the analyst is entitled to, and every step is traced.',
          technical:
            'Grounding and relevance thresholds are a policy decision rather than a default. Identity matters more here than in most RAG systems: research entitlements are real in a regulated firm, so the filter must derive from the authenticated analyst server-side and never from anything the client sends. Per-step traces are what make a blueprint debuggable — without them a chain failure is one opaque bad answer.',
          confidence: 'inferred',
          basis:
            'Layered checking is referred to publicly without detail; this is our composition of it on current AWS.',
        },
        {
          id: 'r_review',
          order: 6,
          title: 'Return it editable, and cited',
          diagramComponentIds: ['r_analyst', 'r_code'],
          plain:
            'The analyst gets code they can edit directly and citations that open the filing the number came from.',
          technical:
            'The two properties that make the tool trusted rather than merely impressive. Edit-in-place keeps the human above the model instead of negotiating with it. Citations that resolve to a specific filing and section turn a plausible figure into a checkable one — and in a regulated firm the citation is frequently the deliverable.',
          confidence: 'sourced',
          sourceIds: ['anthropic'],
        },
      ],
    },
  ],

  lessons: [
    {
      text: 'Put the prompt authoring with the domain experts and keep the platform team on the runner, the model access and the guardrails. A blueprint written by an investment specialist encodes reasoning a platform engineer would have had to interview them for.',
      confidence: 'sourced',
      sourceIds: ['insider'],
    },
    {
      text: 'Choose the model per step, not per application. A chain contains cheap classification and expensive reasoning, and one model for all of it over-pays for the easy steps while under-serving the hard ones.',
      confidence: 'sourced',
      sourceIds: ['aws-blog', 'insider'],
    },
    {
      text: 'Over-invest in the PDF parser. A firm with Bridgewater’s resources singled out table-aware extraction as what impressed them, because a flattened table poisons chunking, embedding and retrieval in sequence and nothing downstream repairs it.',
      confidence: 'sourced',
      sourceIds: ['insider'],
    },
    {
      text: 'Generate code rather than conclusions where the question is quantitative. A number in prose must be trusted; a number produced by readable code has a derivation attached, which is what makes review possible at all.',
      confidence: 'sourced',
      sourceIds: ['anthropic'],
    },
    {
      text: 'Let the human edit the output in place. Re-prompting for a change someone could make in five seconds is the friction that quietly kills adoption of otherwise good tools.',
      confidence: 'sourced',
      sourceIds: ['anthropic'],
    },
    {
      text: 'Pilot the autonomous version at a size you can afford to be wrong about. The fund traded roughly $100m carved out of an existing strategy from late 2023 before launching at close to $2bn — the scale-up followed evidence rather than preceding it.',
      confidence: 'sourced',
      sourceIds: ['press-fund'],
    },
    {
      text: 'Separate the assistant risk level from the automation risk level. A research assistant is checked by the person who asked for it; a systematic strategy acting without a reader needs its oversight built around it as risk management instead.',
      confidence: 'inferred',
      basis:
        'Reasoning from the reported split between the analyst-facing assistant and the machine-learning-driven fund, where humans are described as managing risk, data acquisition and trade execution.',
    },
  ],

  relatedPatternIds: ['agentic_rag', 'multi_agent_rag', 'hybrid_rerank_rag', 'guardrailed_secure_rag'],

  relatedAtlasTopics: [
    { atlas: 'retrieval', topicId: 'custom-chunking', label: 'Custom chunking in a managed pipeline' },
    { atlas: 'retrieval', topicId: 'hybrid-search', label: 'Hybrid search — lexical and vector together' },
    { atlas: 'retrieval', topicId: 'reranking', label: 'Reranking' },
    { atlas: 'retrieval', topicId: 'citations-grounding', label: 'Citations and source attribution' },
    { atlas: 'agentcore', topicId: 'gateway-targets', label: 'AgentCore Gateway targets' },
  ],
}
