import type { AtlasSection, AtlasTopic } from '../../../atlas/types'

const DOCS =
  'https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html'

function make(sectionId: string, x: Omit<AtlasTopic, 'atlasId' | 'sectionId'>): AtlasTopic {
  return { ...x, atlasId: 'agentcore', sectionId }
}

/* --- Identity ------------------------------------------------------------ */
const ID = 'identity'
export const identity: AtlasSection = {
  id: ID,
  atlasId: 'agentcore',
  title: 'Identity',
  order: 5,
  blurb: 'Agent identity, authentication, and scoped credential handling.',
  topics: [
    make(ID, {
      id: 'identity',
      title: 'Agent identity & credentials',
      oneLiner:
        'Give an agent a scoped identity so it acts with least privilege, not a shared secret.',
      whyItMatters:
        'An agent that can take actions needs to prove who it is and hold only the access it needs; identity is what makes tool calls auditable and safe.',
      explanation: {
        plain:
          'AgentCore Identity manages how an agent authenticates and what credentials it uses. Instead of embedding a broad, shared key, the agent gets a scoped identity — often via Cognito or JWT — and least-privilege access to the tools and data it needs.',
        technical:
          'Identity covers inbound authorization (who may invoke the agent) and outbound credentials (how the agent accesses AWS and third-party services), integrating with Cognito/JWT. Credentials are scoped and short-lived rather than long-lived shared secrets, so every tool call can be tied to an identity and least privilege is enforceable end to end.',
      },
      visual: {
        kind: 'sequence_trace',
        spans: [
          { id: 'call', label: 'caller → agent', detail: 'A request arrives with an identity token.', depth: 0, kind: 'entrypoint' },
          { id: 'authz', label: 'identity.authorize', detail: 'Inbound authorization: is this caller allowed?', depth: 1, kind: 'auth' },
          { id: 'creds', label: 'identity.get_credentials', detail: 'Scoped, short-lived credentials for the tool.', depth: 1, kind: 'auth' },
          { id: 'tool', label: 'tool call', detail: 'The tool runs under least privilege.', depth: 2, kind: 'tool' },
          { id: 'resp', label: 'response', detail: 'Result returned; the call is attributable.', depth: 0, kind: 'response' },
        ],
      },
      docUrl: DOCS,
      verificationId: 'agentcore_identity',
      coverageStatus: 'full',
      tags: ['identity', 'cognito', 'jwt', 'least privilege'],
      appliedIn: [{ label: 'IAM via Gateway in the security track', to: '/security' }],
    }),
  ],
}

/* --- Built-in tools ------------------------------------------------------ */
const BT = 'built-in-tools'
export const builtInTools: AtlasSection = {
  id: BT,
  atlasId: 'agentcore',
  title: 'Built-in tools',
  order: 6,
  blurb: 'Managed Browser and Code Interpreter for agents that need to browse or compute.',
  topics: [
    make(BT, {
      id: 'browser',
      title: 'Browser',
      oneLiner: 'A secure, managed, cloud browser an agent can drive.',
      whyItMatters:
        'Plenty of enterprise data and workflows only exist behind a web UI; the Browser tool lets an agent reach them without you running browser infrastructure.',
      explanation: {
        plain:
          'The Browser tool gives an agent a sandboxed cloud browser it can navigate — clicking, reading, and extracting from websites that don’t offer an API.',
        technical:
          'AgentCore Browser is a managed, isolated headless browser exposed as a tool. It suits tasks that require interacting with web applications or extracting data from sites lacking APIs. Because it’s managed and sandboxed, you avoid operating browser fleets and get isolation per session; watch duration-based cost for long browsing tasks.',
      },
      visual: {
        kind: 'concept_diagram',
        height: 220,
        nodes: [
          { id: 'agent', label: 'Agent', detail: 'Issues browse actions.', x: 18, y: 50, accent: 'rgb(13 148 136)' },
          { id: 'browser', label: 'Browser tool', sublabel: 'sandboxed', detail: 'Managed cloud browser.', x: 52, y: 50 },
          { id: 'web', label: 'Web app / site', detail: 'A UI without an API.', x: 84, y: 50 },
        ],
        edges: [
          { from: 'agent', to: 'browser', label: 'drive' },
          { from: 'browser', to: 'web', label: 'navigate' },
        ],
      },
      docUrl: DOCS,
      verificationId: 'agentcore_browser',
      coverageStatus: 'full',
      tags: ['browser', 'built-in tool', 'web'],
      relatedTopicIds: ['code-interpreter'],
    }),
    make(BT, {
      id: 'code-interpreter',
      title: 'Code Interpreter',
      oneLiner: 'A sandboxed environment for the agent to execute code.',
      whyItMatters:
        'Some answers need real computation — data wrangling, math, file processing — that a language model shouldn’t fake in prose.',
      explanation: {
        plain:
          'The Code Interpreter tool lets an agent run code (for example, Python) in a safe sandbox to calculate, analyze data, or transform files, then use the result.',
        technical:
          'AgentCore Code Interpreter provides a secure, isolated execution environment the agent can call to run code and return outputs. Use it when a task requires deterministic computation or data manipulation rather than generation. Like the Browser, it’s duration-billed, so keep executions bounded.',
      },
      visual: {
        kind: 'concept_diagram',
        height: 220,
        nodes: [
          { id: 'agent', label: 'Agent', detail: 'Sends code to run.', x: 18, y: 50, accent: 'rgb(13 148 136)' },
          { id: 'ci', label: 'Code Interpreter', sublabel: 'sandbox', detail: 'Isolated code execution.', x: 52, y: 50 },
          { id: 'out', label: 'Result', detail: 'Computed output back to the loop.', x: 84, y: 50 },
        ],
        edges: [
          { from: 'agent', to: 'ci', label: 'execute' },
          { from: 'ci', to: 'out', label: 'return' },
        ],
      },
      docUrl: DOCS,
      verificationId: 'agentcore_code_interpreter',
      coverageStatus: 'full',
      tags: ['code interpreter', 'built-in tool', 'sandbox'],
      relatedTopicIds: ['browser'],
    }),
  ],
}

/* --- Policy -------------------------------------------------------------- */
const POL = 'policy'
export const policy: AtlasSection = {
  id: POL,
  atlasId: 'agentcore',
  title: 'Policy',
  order: 7,
  blurb: 'Authorization guardrails on tool and write paths, expressed as Cedar policies.',
  topics: [
    make(POL, {
      id: 'policy',
      title: 'Action & tool authorization',
      oneLiner:
        'Bound what an agent may do with policy — allow or deny specific tools and actions.',
      whyItMatters:
        'Guardrails on output aren’t enough for agents that act; you need to constrain which actions are permitted, per role and context, before they happen.',
      explanation: {
        plain:
          'Policy lets you say which tools and actions an agent is allowed to use. A request to take an action is checked against the policy and either allowed or denied, so an agent can’t exceed its mandate.',
        technical:
          'AgentCore Policy applies authorization guardrails on tool use and write paths, expressed with Cedar (a policy language for fine-grained, role- and context-aware authorization). Each action is evaluated against the policy set; denied actions never execute. This bounds agent autonomy independently of the model’s judgment.',
      },
      visual: {
        kind: 'decision_tree',
        root: {
          id: 'root',
          question: 'The agent wants to take an action. Is it permitted by policy?',
          options: [
            {
              label: 'Allowed for this role/context',
              next: { id: 'allow', recommendation: 'Allow', reasoning: 'A matching Cedar policy permits the action; it proceeds and is logged.' },
            },
            {
              label: 'Not permitted',
              next: { id: 'deny', recommendation: 'Deny', reasoning: 'No policy allows it (or one denies it); the action never executes, regardless of what the model decided.' },
            },
          ],
        },
      },
      docUrl: DOCS,
      verificationId: 'agentcore_policy',
      coverageStatus: 'full',
      tags: ['policy', 'cedar', 'authorization', 'guardrails'],
      appliedIn: [{ label: 'Security controls', to: '/security' }],
    }),
  ],
}

/* --- Observability ------------------------------------------------------- */
const OB = 'observability'
export const observability: AtlasSection = {
  id: OB,
  atlasId: 'agentcore',
  title: 'Observability',
  order: 8,
  blurb: 'CloudWatch metrics, ADOT instrumentation, Transaction Search, and the GenAI Observability panel.',
  topics: [
    make(OB, {
      id: 'observability-trace',
      title: 'The invocation-chain trace',
      oneLiner:
        'See one request travel entrypoint → auth → gateway → tool → model, with expandable spans.',
      whyItMatters:
        'When an answer is wrong, the trace is how you find the exact step that failed instead of guessing — the core of debugging an agent.',
      explanation: {
        plain:
          'Observability records what happened during an invocation as a trace: the entrypoint, the authorization, each tool call through Gateway, the model calls, and the response. You expand any step to see its detail and timing.',
        technical:
          'AgentCore Observability produces a distributed trace spanning the invocation chain — entrypoint, Identity authorization, Gateway tool calls, model reasoning, memory access, and response — as nested spans. Instrumentation is based on ADOT (the AWS Distro for OpenTelemetry), and traces flow to Amazon CloudWatch. Reading a trace turns “the answer was wrong” into “retrieval returned nothing on span 3.”',
      },
      visual: {
        kind: 'sequence_trace',
        spans: [
          { id: 'ep', label: 'entrypoint.invoke', detail: 'Request received by the runtime entrypoint.', depth: 0, kind: 'entrypoint' },
          { id: 'auth', label: 'identity.authorize', detail: 'Caller authenticated and authorized.', depth: 1, kind: 'auth' },
          { id: 'plan', label: 'model.reason', detail: 'The model plans and decides to use a tool.', depth: 1, kind: 'model' },
          { id: 'gw', label: 'gateway.invoke_tool', detail: 'Gateway routes to a registered tool.', depth: 1, kind: 'gateway' },
          { id: 'tool', label: 'tool.retrieve', detail: 'A Knowledge Base retrieval runs.', depth: 2, kind: 'tool', note: 'Latency and result count recorded here.' },
          { id: 'mem', label: 'memory.recall', detail: 'Long-term memory recalled for personalization.', depth: 1, kind: 'memory' },
          { id: 'gen', label: 'model.generate', detail: 'The final grounded answer is composed.', depth: 1, kind: 'model' },
          { id: 'resp', label: 'response', detail: 'Returned to the caller; the full chain is attributable.', depth: 0, kind: 'response' },
        ],
      },
      docUrl: DOCS,
      verificationId: 'agentcore_observability',
      coverageStatus: 'full',
      tags: ['observability', 'trace', 'adot', 'cloudwatch', 'invocation chain'],
      relatedTopicIds: ['observability-panel'],
      appliedIn: [{ label: 'Evaluation & observability primer', to: '/evaluate' }],
    }),
    make(OB, {
      id: 'observability-panel',
      title: 'Metrics, Transaction Search & the GenAI panel',
      oneLiner:
        'Built-in CloudWatch metrics, a one-time Transaction Search setup, and Agents / Sessions / Traces views.',
      whyItMatters:
        'Metrics tell you something regressed; the panel and search are how you get from a metric to the specific session and trace behind it.',
      explanation: {
        plain:
          'AgentCore emits built-in metrics to CloudWatch for the runtime, memory, gateway, built-in tools, and identity. A GenAI Observability panel gives you Agents, Sessions, and Traces views to drill in. Enabling CloudWatch Transaction Search is a one-time setup that lets you find specific invocations.',
        technical:
          'Built-in CloudWatch metrics cover runtime, memory, gateway, built-in tools, and identity. The GenAI Observability panel organizes signals into Agents / Sessions / Traces views; CloudWatch Transaction Search (a one-time enablement) makes individual transactions searchable. Tracing can be enabled per resource (including at memory creation), enhanced with custom headers, and — importantly — you can observe agents hosted *outside* AgentCore too, using ADOT. Follow the documented best practices for sampling and cardinality.',
      },
      visual: { kind: 'none', reason: 'Console views and setup steps are best followed in the docs; the trace visual above is the anchor.' },
      docUrl: DOCS,
      verificationId: 'agentcore_observability',
      coverageStatus: 'full',
      tags: ['observability', 'metrics', 'transaction search', 'genai panel', 'custom headers'],
      relatedTopicIds: ['observability-trace'],
    }),
  ],
}

/* --- Evaluations --------------------------------------------------------- */
const EV = 'evaluations'
export const evaluations: AtlasSection = {
  id: EV,
  atlasId: 'agentcore',
  title: 'Evaluations',
  order: 9,
  blurb: 'LLM-as-judge scoring of agent quality — with honest caveats.',
  topics: [
    make(EV, {
      id: 'evaluations',
      title: 'Evaluating agent quality',
      oneLiner:
        'Score groundedness, relevance, and tool-use with an LLM judge, gating changes before they ship.',
      whyItMatters:
        'Agents drift as prompts, models, and data change; evaluation is how you catch quality regressions before users do — but the judge itself has limits.',
      explanation: {
        plain:
          'AgentCore Evaluations scores an agent’s answers — for example, are they grounded in the sources and relevant to the question — using a model as the judge, run over a dataset you provide.',
        technical:
          'Evaluations use LLM-as-judge to score dimensions like groundedness, answer relevance, and tool-use correctness against a labeled dataset, so you can gate promotion on results. Be honest about the method: LLM judges can be biased, inconsistent run-to-run, and lenient on fluent-but-wrong answers. Calibrate against human labels, track judge agreement, and keep a human in the loop for high-stakes decisions.',
      },
      visual: { kind: 'none', reason: 'The evaluation primer covers metrics and LLM-as-judge caveats in depth — cross-linked below.' },
      docUrl: DOCS,
      verificationId: 'agentcore_evaluations',
      coverageStatus: 'full',
      tags: ['evaluations', 'llm-as-judge'],
      appliedIn: [{ label: 'RAG metrics & eval loop', to: '/evaluate' }],
    }),
  ],
}

/* --- Tooling & operations ------------------------------------------------ */
const OPS = 'tooling-ops'
export const toolingOps: AtlasSection = {
  id: OPS,
  atlasId: 'agentcore',
  title: 'Tooling & operations',
  order: 10,
  blurb: 'The AgentCore CLI, IaC, cost drivers, and the security baseline.',
  topics: [
    make(OPS, {
      id: 'agentcore-cli',
      title: 'The AgentCore CLI',
      oneLiner:
        'A project workflow — create, dev, deploy, invoke — plus add commands for memory, identity, and evaluators.',
      whyItMatters:
        'The CLI is how most people actually build and ship on AgentCore day to day; its exact commands move fast, so treat them as a shape to confirm.',
      explanation: {
        plain:
          'The AgentCore CLI scaffolds a project, runs it locally, deploys it, and invokes it. There are also commands to add capabilities like memory, identity, and evaluators to a project.',
        technical:
          'The CLI (distributed as @aws/agentcore) supports a project lifecycle — create, dev, deploy, invoke — and add-style commands (e.g. add memory, add identity, add evaluator) to wire in services. These specifics are volatile: subcommands and flags change release to release, so verify against the current docs before scripting them.',
      },
      visual: {
        kind: 'lifecycle_timeline',
        stages: [
          { id: 'create', label: 'create', plain: 'Scaffold a new agent project.', technical: 'agentcore create — generates the project skeleton.' },
          { id: 'dev', label: 'dev', plain: 'Run and iterate locally.', technical: 'agentcore dev — local run/iterate loop.' },
          { id: 'deploy', label: 'deploy', plain: 'Ship to AgentCore Runtime.', technical: 'agentcore deploy — provisions and deploys the runtime.' },
          { id: 'invoke', label: 'invoke', plain: 'Call the deployed agent.', technical: 'agentcore invoke — sends a request to the running agent.' },
        ],
      },
      codeSamples: [
        {
          id: 'cli',
          title: 'Project workflow (shape)',
          language: 'bash',
          filename: 'workflow.sh',
          code: `# Reference shape — CLI subcommands/flags change often; verify against current docs.
agentcore create
agentcore dev
agentcore deploy
agentcore invoke '{"prompt": "What is our EU data-retention policy?"}'
`,
          verifyServices: ['agentcore_runtime'],
        },
      ],
      docUrl: DOCS,
      verificationId: 'agentcore_runtime',
      coverageStatus: 'full',
      tags: ['cli', 'workflow', 'volatile'],
      relatedTopicIds: ['iac-cost'],
      appliedIn: [{ label: 'The build track', to: '/build' }],
    }),
    make(OPS, {
      id: 'iac-cost',
      title: 'IaC, cost & security baseline',
      oneLiner:
        'What drives spend, how to provision with infrastructure-as-code, and a baseline for security.',
      whyItMatters:
        'These are the questions a design review asks: what will it cost, how is it reproducible, and is it secure by default.',
      explanation: {
        plain:
          'You can provision AgentCore with infrastructure-as-code (for example, CDK) rather than clicking through a console. Cost is driven mostly by how long things run — runtime duration, always-on built-in tools, memory, and gateway usage. A security baseline means least privilege, guardrails, and observability turned on.',
        technical:
          'Prefer IaC (e.g. CDK) for reproducible, reviewable provisioning. Cost drivers are largely duration- and usage-based: runtime execution time, built-in tool sessions (Browser/Code Interpreter), memory storage/operations, and gateway invocations — bound long-running tools and tear down what you don’t use. The security baseline combines Identity + IAM (least privilege), Guardrails and Policy (safety and action limits), and Observability + Evaluations (audit and quality).',
      },
      visual: { kind: 'none', reason: 'Cost and baseline are checklists; see the security and evaluation tracks for depth.' },
      docUrl: DOCS,
      verificationId: 'agentcore_runtime',
      coverageStatus: 'full',
      tags: ['iac', 'cdk', 'cost', 'security baseline'],
      appliedIn: [
        { label: 'Cost drivers across patterns', to: '/catalog' },
        { label: 'Security baseline', to: '/security' },
      ],
    }),
  ],
}

/* --- Additional services (overview-level) -------------------------------- */
const ADD = 'additional'
export const additional: AtlasSection = {
  id: ADD,
  atlasId: 'agentcore',
  title: 'Additional services',
  order: 11,
  blurb: 'Overview-level coverage of Payments, Registry, and Optimization.',
  topics: [
    make(ADD, {
      id: 'additional-services',
      title: 'Payments, Registry & Optimization',
      oneLiner:
        'Three further AgentCore services, covered here at an overview level.',
      whyItMatters:
        'Knowing they exist — and where they fit — rounds out the platform picture even when your workload doesn’t use them yet.',
      explanation: {
        plain:
          'Beyond the core services, AgentCore documents a few more: Payments (letting agents transact), Registry (a catalog of agents/tools), and Optimization (improving agent performance). We cover them at an overview level and link to the docs for detail.',
        technical:
          'These are documented services we mark as overview-level coverage rather than full: Payments (agent-initiated transactions), Registry (discovery/cataloging of agents and tools), and Optimization (performance/quality improvement). Consult the canonical docs for their current capabilities and status before relying on them.',
      },
      visual: { kind: 'none', reason: 'Overview-level: see the coverage map and the canonical docs.' },
      docUrl: DOCS,
      verificationId: 'agentcore_runtime',
      coverageStatus: 'overview',
      tags: ['payments', 'registry', 'optimization', 'overview'],
    }),
  ],
}
