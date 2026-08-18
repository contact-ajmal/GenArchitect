import type { AtlasSection, AtlasTopic } from '../../../atlas/types'

const S = 'tools'
const DOCS = 'https://strandsagents.com/'
const MCP = 'https://modelcontextprotocol.io/'

type T = Omit<AtlasTopic, 'atlasId' | 'sectionId'>
const t = (x: T): AtlasTopic => ({ ...x, atlasId: 'strands', sectionId: S })

export const tools: AtlasSection = {
  id: S,
  atlasId: 'strands',
  title: 'Tools',
  order: 4,
  blurb: 'Defining tools, reusing the community package, MCP integration, and how tools execute.',
  topics: [
    t({
      id: 'tool-decorator',
      title: 'The @tool decorator',
      oneLiner: 'Turn any function into something the model can call.',
      whyItMatters:
        'Tools are how an agent does anything beyond talking; the decorator makes defining one trivial and self-documenting.',
      explanation: {
        plain:
          'Put @tool on a function and it becomes available to the agent. The function’s name, arguments, and docstring tell the model what the tool does and when to use it.',
        technical:
          'The decorator derives a tool contract (name, typed parameters, description) from the function signature and docstring. Write docstrings for the model, not just humans — they are the model’s only guide to a tool’s purpose. Return values flow back into the loop as observations.',
      },
      visual: { kind: 'none', reason: 'The code sample is the clearest explanation.' },
      codeSamples: [
        {
          id: 'tool',
          title: 'Defining a tool',
          language: 'python',
          filename: 'tools.py',
          code: `from strands import tool


@tool
def retrieve(query: str, top_k: int = 5) -> list[dict]:
    """Retrieve the top_k most relevant passages for a query. Cite the source."""
    hits = knowledge_base.search(query, k=top_k)
    return [{"text": h.text, "source": h.source} for h in hits]
`,
          verifyServices: ['strands_sdk'],
        },
      ],
      docUrl: DOCS,
      verificationId: 'strands_sdk',
      coverageStatus: 'full',
      tags: ['tool', 'decorator'],
      relatedTopicIds: ['community-tools', 'mcp-tools', 'tool-execution'],
      appliedIn: [{ label: 'Naive RAG — a retrieval tool', to: '/architecture/naive_rag' }],
    }),
    t({
      id: 'community-tools',
      title: 'The strands-agents-tools package',
      oneLiner: 'A library of ready-made tools you can drop into an agent.',
      whyItMatters:
        'Most agents need the same building blocks — retrieval, HTTP, AWS access, code execution — and reusing maintained ones beats re-writing them.',
      explanation: {
        plain:
          'Alongside the core SDK, a community package provides prebuilt tools you can import and hand to an agent instead of writing your own.',
        technical:
          'The `strands-agents-tools` package includes maintained tools such as retrieval, HTTP requests, AWS access, memory, and code execution. Import what you need and add it to the agent’s `tools` list; you can always mix community tools with your own @tool functions.',
      },
      visual: { kind: 'none', reason: 'A package listing; see the SDK docs for the current catalog.' },
      docUrl: DOCS,
      verificationId: 'strands_agents_tools',
      coverageStatus: 'full',
      tags: ['tools', 'library', 'community'],
      relatedTopicIds: ['tool-decorator'],
    }),
    t({
      id: 'mcp-tools',
      title: 'MCP integration',
      oneLiner: 'Use any Model Context Protocol server as a source of tools.',
      whyItMatters:
        'MCP lets an agent reach tools and data it didn’t define itself — including enterprise tools exposed through AgentCore Gateway — without bespoke integration code.',
      explanation: {
        plain:
          'The Model Context Protocol is an open standard for connecting agents to tools. Strands can connect to an MCP server and use whatever tools it offers, discovered at runtime.',
        technical:
          'An MCP client connects to a server (over stdio or streamable HTTP), lists the tools it exposes, and makes them callable by the agent exactly like local @tool functions. This is how Strands consumes AgentCore Gateway targets, where APIs, Lambda functions, and Bedrock Knowledge Bases are presented as MCP tools behind central auth.',
      },
      visual: {
        kind: 'concept_diagram',
        height: 280,
        nodes: [
          { id: 'agent', label: 'Strands agent', detail: 'Discovers and calls MCP tools like any other tool.', x: 18, y: 50, accent: 'rgb(13 148 136)' },
          { id: 'client', label: 'MCP client', sublabel: 'discovery', detail: 'Connects to a server and lists its tools.', x: 50, y: 50 },
          { id: 'server', label: 'MCP server', detail: 'Exposes tools/data over the protocol.', x: 82, y: 26 },
          { id: 'gateway', label: 'AgentCore Gateway', detail: 'One MCP endpoint for APIs, Lambda, and Knowledge Bases with central auth.', x: 82, y: 74 },
        ],
        edges: [
          { from: 'agent', to: 'client' },
          { from: 'client', to: 'server' },
          { from: 'client', to: 'gateway' },
        ],
      },
      docUrl: MCP,
      verificationId: 'mcp',
      coverageStatus: 'full',
      tags: ['mcp', 'tools', 'gateway'],
      relatedTopicIds: ['tool-decorator'],
      appliedIn: [
        { label: 'Multi-KB agentic RAG via Gateway', to: '/architecture/multi_kb_agentic_rag' },
        { label: 'AgentCore Gateway', to: '/agentcore' },
      ],
    }),
    t({
      id: 'tool-execution',
      title: 'Tool execution & parallelism',
      oneLiner:
        'How tools are selected, run — sometimes in parallel — and fed back into the loop.',
      whyItMatters:
        'Parallel tool execution can cut latency dramatically when a turn needs several independent lookups.',
      explanation: {
        plain:
          'The model chooses which tools to call; Strands runs them and returns the results. When a turn asks for several independent tools, they can run at the same time instead of one after another.',
        technical:
          'Tool selection is driven by the model from the tools’ descriptions. Execution is handled by the SDK, which can run independent tool calls concurrently up to a configurable limit (e.g. `max_parallel_tools`). Results are collected and appended to the context before the next model turn — closing the observe step of the loop.',
      },
      visual: {
        kind: 'flow_walkthrough',
        steps: [
          { id: 'select', label: 'Select', plain: 'The model requests one or more tools for this turn.', technical: 'A turn can emit multiple tool-use requests at once.' },
          { id: 'run', label: 'Run (parallel)', plain: 'Independent tools run concurrently.', technical: 'The SDK executes eligible calls in parallel, bounded by max_parallel_tools.' },
          { id: 'collect', label: 'Collect', plain: 'All results come back together.', technical: 'Results are gathered, with errors surfaced per call.' },
          { id: 'observe', label: 'Observe', plain: 'Results re-enter the conversation for the next turn.', technical: 'Tool results are appended to history; the loop continues.' },
        ],
      },
      docUrl: DOCS,
      verificationId: 'strands_sdk',
      coverageStatus: 'full',
      tags: ['tool execution', 'parallelism', 'max_parallel_tools'],
      relatedTopicIds: ['agent-loop', 'tool-decorator'],
    }),
  ],
}
