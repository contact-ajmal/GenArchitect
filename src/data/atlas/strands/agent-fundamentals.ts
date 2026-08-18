import type { AtlasSection, AtlasTopic } from '../../../atlas/types'

const S = 'agent-fundamentals'
const DOCS = 'https://strandsagents.com/'

type T = Omit<AtlasTopic, 'atlasId' | 'sectionId'>
const t = (x: T): AtlasTopic => ({ ...x, atlasId: 'strands', sectionId: S })

export const agentFundamentals: AtlasSection = {
  id: S,
  atlasId: 'strands',
  title: 'Agent fundamentals',
  order: 2,
  blurb: 'The agent loop, how an agent is composed, and how it returns results.',
  topics: [
    t({
      id: 'agent-loop',
      title: 'The agent loop',
      oneLiner:
        'A recursive cycle: reason, choose a tool, run it, observe the result, and repeat until the agent answers.',
      whyItMatters:
        'This loop is the whole reason an agent is more than a single model call — it’s what lets the model plan, act, and correct itself. Understanding it is the key to everything else in Strands.',
      explanation: {
        plain:
          'When you call an agent, the model doesn’t just answer once. It thinks about the request, and if a tool would help, it calls that tool, reads the result, and thinks again. It keeps going around this loop — reason, act, observe — until it has what it needs, then it responds.',
        technical:
          'Each turn, the model receives the conversation plus the results of any tools it has already used, and produces either a final response or one or more tool calls. Strands executes the tool calls, appends their results to the context, and re-invokes the model. State (messages, tool results) is preserved across iterations, so the loop is effectively a recursive event cycle that terminates when the model stops requesting tools.',
      },
      visual: {
        kind: 'animated_loop',
        stages: [
          {
            id: 'reason',
            label: 'Reason',
            plain: 'The model reads the request and everything it knows so far, and plans the next move.',
            technical: 'Given the message history, tool schemas, and prior tool results, the model decides: answer now, or call a tool.',
            message: 'thinking',
          },
          {
            id: 'select',
            label: 'Select tool',
            plain: 'If a tool would help, the model picks one and fills in its arguments.',
            technical: 'The model emits a structured tool-use request naming the tool and arguments derived from its plan.',
            message: 'tool call',
          },
          {
            id: 'execute',
            label: 'Execute',
            plain: 'Strands runs the chosen tool and captures what it returns.',
            technical: 'The SDK invokes the tool function (or remote MCP tool), handling errors and, when eligible, running independent calls in parallel.',
            message: 'running…',
          },
          {
            id: 'observe',
            label: 'Observe',
            plain: 'The tool’s result is added back into the conversation for the model to see.',
            technical: 'Tool results are appended to the message history and become part of the next model invocation’s context.',
            message: 'result',
          },
          {
            id: 'respond',
            label: 'Respond',
            plain: 'When no more tools are needed, the model writes its final answer.',
            technical: 'The loop terminates on a turn with no tool-use request; the final message is returned to the caller.',
            message: 'answer',
          },
        ],
      },
      docUrl: DOCS,
      verificationId: 'strands_sdk',
      coverageStatus: 'full',
      tags: ['agent loop', 'event loop', 'reasoning', 'flagship'],
      relatedTopicIds: ['agent-composition', 'tool-execution'],
      appliedIn: [
        { label: 'Agentic RAG — the model decides when to retrieve', to: '/architecture/agentic_rag' },
      ],
    }),
    t({
      id: 'agent-composition',
      title: 'Composing an agent',
      oneLiner:
        'Model + system prompt + tools — plus optional identity and state.',
      whyItMatters:
        'Everything an agent can do is set by what you compose into it; there’s no hidden framework behavior to fight.',
      explanation: {
        plain:
          'An agent is the sum of three choices: which model reasons, what the system prompt tells it to be, and which tools it can use. You can also give it a name, a description, an id, and a starting state.',
        technical:
          'Beyond `model`, `system_prompt`, and `tools`, an agent carries configuration such as `agent_id`, `name`, and `description` (useful for multi-agent and observability), and a `state` object for arbitrary key–value data the agent should carry across a run. Swapping the model or tools changes behavior without touching the loop.',
      },
      visual: {
        kind: 'concept_diagram',
        height: 280,
        nodes: [
          { id: 'model', label: 'model', detail: 'The reasoning engine (e.g. a Bedrock model).', x: 16, y: 30 },
          { id: 'prompt', label: 'system_prompt', detail: 'Role and instructions.', x: 16, y: 70 },
          { id: 'tools', label: 'tools', detail: 'The capabilities the model may invoke.', x: 46, y: 50 },
          { id: 'config', label: 'agent_id · name · description', detail: 'Identity and metadata for orchestration and tracing.', x: 46, y: 88 },
          { id: 'state', label: 'state', detail: 'Arbitrary data carried across the run.', x: 46, y: 12 },
          { id: 'agent', label: 'Agent', detail: 'The composed, callable agent.', x: 82, y: 50, accent: 'rgb(13 148 136)' },
        ],
        edges: [
          { from: 'model', to: 'agent' },
          { from: 'prompt', to: 'agent' },
          { from: 'tools', to: 'agent' },
          { from: 'config', to: 'agent', dashed: true },
          { from: 'state', to: 'agent', dashed: true },
        ],
      },
      codeSamples: [
        {
          id: 'compose',
          title: 'Composing with configuration',
          language: 'python',
          filename: 'agent.py',
          code: `from strands import Agent
from strands.models import BedrockModel

agent = Agent(
    model=BedrockModel(model_id="anthropic.claude-3-5-sonnet-20241022-v2:0"),
    system_prompt="You are Meridian's retrieval assistant. Cite every source.",
    tools=[retrieve],
    agent_id="meridian-assistant",
    name="Meridian Assistant",
    description="Answers policy questions from retrieved documents.",
)
`,
          verifyServices: ['strands_sdk'],
        },
      ],
      docUrl: DOCS,
      verificationId: 'strands_sdk',
      coverageStatus: 'full',
      tags: ['agent', 'configuration', 'agent_id', 'state'],
      relatedTopicIds: ['agent-loop', 'agent-state'],
    }),
    t({
      id: 'structured-output',
      title: 'Structured output & prompts',
      oneLiner:
        'Get typed, validated results back — not just free text — and shape behavior with prompts.',
      whyItMatters:
        'Downstream systems need reliable shapes; structured output turns an agent into a dependable component instead of a text box.',
      explanation: {
        plain:
          'You can ask an agent to return data in a specific shape (for example, a record with named fields) instead of a paragraph. The system prompt and per-call prompts steer what the agent does and how it answers.',
        technical:
          'Structured output binds the model’s response to a schema you define, so you get validated, typed data back. Prompts operate at two levels: the system prompt sets durable role and rules; the per-invocation input is the task. Keeping facts in tools/retrieval and rules in the system prompt keeps behavior predictable.',
      },
      visual: {
        kind: 'flow_walkthrough',
        steps: [
          { id: 'schema', label: 'Define a shape', plain: 'You declare the fields you want back — say id, answer, and sources.', technical: 'A schema (e.g. a typed model) describes the expected output structure.' },
          { id: 'ask', label: 'Ask', plain: 'You invoke the agent with the task and the requested shape.', technical: 'The request pairs the user input with the output schema.' },
          { id: 'validate', label: 'Validate', plain: 'Strands returns data matching the shape, ready to use.', technical: 'The model’s output is parsed and validated against the schema before it reaches you.' },
        ],
      },
      docUrl: DOCS,
      verificationId: 'strands_sdk',
      coverageStatus: 'full',
      tags: ['structured output', 'prompts', 'schema'],
      relatedTopicIds: ['agent-composition'],
    }),
  ],
}
