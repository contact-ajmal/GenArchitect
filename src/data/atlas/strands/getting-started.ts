import type { AtlasSection, AtlasTopic } from '../../../atlas/types'

const S = 'getting-started'
const DOCS = 'https://strandsagents.com/'
const GH = 'https://github.com/strands-agents/sdk-python'

type T = Omit<AtlasTopic, 'atlasId' | 'sectionId'>
const t = (x: T): AtlasTopic => ({ ...x, atlasId: 'strands', sectionId: S })

export const gettingStarted: AtlasSection = {
  id: S,
  atlasId: 'strands',
  title: 'Getting started',
  order: 1,
  blurb: 'What Strands is, how to install it, and your first agent.',
  topics: [
    t({
      id: 'what-is-strands',
      title: 'What Strands is',
      oneLiner:
        'An open-source, model-driven SDK for building agents in a few lines of Python or TypeScript.',
      whyItMatters:
        'It lets the model — not hand-written control flow — drive the loop, so you describe capabilities and intent rather than orchestrate every step.',
      explanation: {
        plain:
          'Strands Agents is an open-source toolkit (Apache-2.0) for building AI agents. You give it a model, a system prompt, and a set of tools, and it handles the back-and-forth of the agent reasoning, calling tools, and forming an answer.',
        technical:
          'The core idea is "model-driven": instead of scripting a fixed sequence of steps, you compose an agent from a model, instructions, and tools, and the model decides which tools to call and when. It runs anywhere Python (or TypeScript) runs, and deploys cleanly onto managed runtimes such as Amazon Bedrock AgentCore Runtime.',
      },
      visual: {
        kind: 'concept_diagram',
        height: 300,
        nodes: [
          { id: 'model', label: 'Model', sublabel: 'reasoning', detail: 'The LLM that plans and decides each step of the loop.', x: 18, y: 26 },
          { id: 'prompt', label: 'System prompt', sublabel: 'intent', detail: 'The role and instructions that shape the agent’s behavior.', x: 18, y: 74 },
          { id: 'tools', label: 'Tools', sublabel: '@tool', detail: 'Functions the model may call to act on the world.', x: 52, y: 50 },
          { id: 'agent', label: 'Agent', sublabel: 'the loop', detail: 'Composes model + prompt + tools and runs the model-driven loop.', x: 86, y: 50, accent: 'rgb(13 148 136)' },
        ],
        edges: [
          { from: 'model', to: 'agent' },
          { from: 'prompt', to: 'agent' },
          { from: 'tools', to: 'agent' },
        ],
        selector: {
          label: 'Two halves',
          options: [
            { id: 'brain', label: 'The brain', highlightNodeIds: ['model', 'prompt'], note: 'The model plus its instructions decide what to do.' },
            { id: 'hands', label: 'The hands', highlightNodeIds: ['tools'], note: 'Tools are how the agent affects the world — retrieval, APIs, code.' },
          ],
        },
      },
      docUrl: DOCS,
      verificationId: 'strands_sdk',
      coverageStatus: 'full',
      tags: ['overview', 'open source', 'apache-2.0', 'python', 'typescript'],
      appliedIn: [
        { label: 'Every RAG pattern in the catalog', to: '/catalog' },
        { label: 'Build the Meridian agent', to: '/build' },
      ],
      relatedTopicIds: ['first-agent', 'agent-loop'],
    }),
    t({
      id: 'installation',
      title: 'Installation',
      oneLiner: 'Install the SDK and the community tools package with pip.',
      whyItMatters:
        'A one-line install gets you a working agent; the tools package saves you from writing common integrations by hand.',
      explanation: {
        plain:
          'Strands installs from PyPI. The core package gives you the agent and the @tool decorator; a separate package ships a library of ready-made tools you can drop in.',
        technical:
          'Install `strands-agents` for the SDK and `strands-agents-tools` for maintained tools (retrieval, HTTP, AWS access, code execution, and more). A TypeScript distribution exists as well. Nothing here is executed by GenArchitect — treat versions as a shape to confirm against the current docs.',
      },
      visual: { kind: 'none', reason: 'A single install command needs no diagram; see the code.' },
      codeSamples: [
        {
          id: 'install',
          title: 'Install',
          language: 'bash',
          filename: 'install.sh',
          code: 'python -m venv .venv && source .venv/bin/activate\npip install strands-agents strands-agents-tools\n',
          verifyServices: ['strands_sdk', 'strands_agents_tools'],
        },
      ],
      docUrl: GH,
      verificationId: 'strands_sdk',
      coverageStatus: 'full',
      tags: ['install', 'pip'],
      relatedTopicIds: ['first-agent'],
    }),
    t({
      id: 'first-agent',
      title: 'Your first agent',
      oneLiner: 'A model, a system prompt, and one tool — then call it.',
      whyItMatters:
        'The whole mental model fits in a few lines: compose the agent, then invoke it like a function.',
      explanation: {
        plain:
          'You create an agent by passing a model, a system prompt, and a list of tools, then call the agent with a question. The model reads the tool descriptions and decides whether to use them.',
        technical:
          'The @tool decorator turns a plain function into something the model can call — its name, signature, and docstring become the tool’s contract. Invoking `agent("...")` returns a result whose `message` holds the final response after any tool calls.',
      },
      visual: { kind: 'none', reason: 'The code sample is clearer than a diagram for a first agent.' },
      codeSamples: [
        {
          id: 'first',
          title: 'A first agent',
          language: 'python',
          filename: 'first_agent.py',
          code: `from strands import Agent, tool
from strands.models import BedrockModel


@tool
def word_count(text: str) -> int:
    """Count the words in a piece of text."""
    return len(text.split())


agent = Agent(
    model=BedrockModel(model_id="anthropic.claude-3-5-sonnet-20241022-v2:0"),
    system_prompt="You are concise. Use tools when they help.",
    tools=[word_count],
)

print(agent("How many words are in: the quick brown fox?").message)
`,
          verifyServices: ['strands_sdk', 'bedrock_foundation_models'],
        },
      ],
      docUrl: DOCS,
      verificationId: 'strands_sdk',
      coverageStatus: 'full',
      tags: ['quickstart', 'tool', 'agent'],
      relatedTopicIds: ['agent-loop', 'tool-decorator'],
      appliedIn: [{ label: 'Stage A of the build track', to: '/build' }],
    }),
    t({
      id: 'mcp-server',
      title: 'The Strands MCP server for IDE assistants',
      oneLiner:
        'An MCP server that puts Strands’ own knowledge into your IDE assistant.',
      whyItMatters:
        'Your coding assistant can answer Strands questions and scaffold agents accurately instead of guessing.',
      explanation: {
        plain:
          'Strands ships an MCP server so an IDE assistant (or any MCP client) can pull in Strands documentation and helpers while you build.',
        technical:
          'It exposes Strands knowledge over the Model Context Protocol, which any MCP-capable assistant can connect to. This is separate from using MCP servers *as tools inside an agent* — here MCP is helping you author, not powering the agent at runtime.',
      },
      visual: { kind: 'none', reason: 'A tooling integration; the concept is covered by the MCP tools topic.' },
      docUrl: DOCS,
      verificationId: 'mcp',
      coverageStatus: 'overview',
      tags: ['mcp', 'ide', 'tooling'],
      relatedTopicIds: ['mcp-tools'],
    }),
  ],
}
