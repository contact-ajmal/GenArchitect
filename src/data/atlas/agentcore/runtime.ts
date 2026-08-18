import type { AtlasSection, AtlasTopic } from '../../../atlas/types'

const S = 'runtime'
const DOCS =
  'https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html'

type T = Omit<AtlasTopic, 'atlasId' | 'sectionId'>
const t = (x: T): AtlasTopic => ({ ...x, atlasId: 'agentcore', sectionId: S })

export const runtime: AtlasSection = {
  id: S,
  atlasId: 'agentcore',
  title: 'Runtime',
  order: 2,
  blurb: 'Serverless agent hosting with session isolation, long execution windows, and A2A support.',
  topics: [
    t({
      id: 'runtime-hosting',
      title: 'Serverless hosting & session isolation',
      oneLiner:
        'Host an agent serverlessly, with each session isolated and runs allowed to last up to eight hours.',
      whyItMatters:
        'Agents are stateful and long-running in ways that trip up ordinary request/response hosting; Runtime is built for exactly that, and isolation is what makes multi-tenant agents safe.',
      explanation: {
        plain:
          'Runtime runs your agent without servers to manage, scaling with load. Every session is isolated from the others, and a single run can go for a long time — up to eight hours — which suits agents that do multi-step work.',
        technical:
          'AgentCore Runtime provides serverless execution with complete per-session isolation, so one user’s agent state and compute never bleed into another’s — essential for multi-tenant workloads. Execution windows extend up to eight hours, accommodating long agentic loops, tool chains, and human-in-the-loop pauses that would exceed typical function timeouts.',
      },
      visual: {
        kind: 'concept_diagram',
        height: 260,
        nodes: [
          { id: 'client', label: 'Callers', detail: 'Independent tenants/sessions.', x: 12, y: 50 },
          { id: 'runtime', label: 'AgentCore Runtime', detail: 'Serverless host; scales with load.', x: 44, y: 50, accent: 'rgb(20 184 166)' },
          { id: 's1', label: 'Session A', sublabel: 'isolated', detail: 'Its own state and compute.', x: 80, y: 22 },
          { id: 's2', label: 'Session B', sublabel: 'isolated', detail: 'No shared state with A.', x: 80, y: 50 },
          { id: 's3', label: 'Session C', sublabel: 'isolated', detail: 'Up to 8-hour runs.', x: 80, y: 78 },
        ],
        edges: [
          { from: 'client', to: 'runtime' },
          { from: 'runtime', to: 's1' },
          { from: 'runtime', to: 's2' },
          { from: 'runtime', to: 's3' },
        ],
      },
      docUrl: DOCS,
      verificationId: 'agentcore_runtime',
      coverageStatus: 'full',
      tags: ['runtime', 'serverless', 'session isolation', '8-hour'],
      relatedTopicIds: ['runtime-entrypoint'],
      appliedIn: [{ label: 'Multi-agent RAG on Runtime', to: '/architecture/multi_agent_rag' }],
    }),
    t({
      id: 'runtime-entrypoint',
      title: 'The entrypoint pattern & A2A',
      oneLiner:
        'Wrap an agent in an entrypoint and invoke it; agents can also talk to each other via A2A.',
      whyItMatters:
        'The entrypoint is the small contract that turns any agent into a hosted, invocable service — and A2A lets hosted agents collaborate across systems.',
      explanation: {
        plain:
          'To deploy an agent, you wrap it in a small entrypoint that Runtime calls when a request comes in. You then invoke the deployed agent through an API. Runtime also supports agents calling other agents using the A2A protocol.',
        technical:
          'A BedrockAgentCoreApp with an @app.entrypoint function adapts your agent to the runtime contract; the platform invokes it (e.g. via InvokeAgentRuntime) per request, within an isolated session. Agent-to-Agent (A2A) protocol support lets a hosted agent delegate to another agent — possibly on a different stack — enabling interoperable multi-agent systems beyond a single process.',
      },
      visual: {
        kind: 'flow_walkthrough',
        steps: [
          { id: 'wrap', label: 'Wrap', plain: 'Expose the agent through an entrypoint function.', technical: 'BedrockAgentCoreApp + @app.entrypoint adapts the agent to the runtime contract.', codeSampleId: 'entry' },
          { id: 'deploy', label: 'Deploy', plain: 'Runtime hosts the entrypoint serverlessly.', technical: 'The app is deployed to AgentCore Runtime; each call gets an isolated session.' },
          { id: 'invoke', label: 'Invoke', plain: 'Call the agent through the runtime API.', technical: 'InvokeAgentRuntime routes the request to your entrypoint and returns the result.' },
          { id: 'a2a', label: 'Delegate (A2A)', plain: 'The agent can call another agent over A2A.', technical: 'A2A standardizes cross-agent, cross-system delegation.' },
        ],
      },
      codeSamples: [
        {
          id: 'entry',
          title: 'A runtime entrypoint (shape)',
          language: 'python',
          filename: 'app.py',
          code: `# Reference shape — verify against current AgentCore docs.
from bedrock_agentcore.runtime import BedrockAgentCoreApp

app = BedrockAgentCoreApp()


@app.entrypoint
def invoke(payload):
    return {"answer": str(agent(payload["prompt"]).message)}


if __name__ == "__main__":
    app.run()
`,
          verifyServices: ['agentcore_runtime', 'strands_sdk'],
        },
      ],
      docUrl: DOCS,
      verificationId: 'agentcore_runtime',
      coverageStatus: 'full',
      tags: ['entrypoint', 'invokeagentruntime', 'a2a'],
      relatedTopicIds: ['runtime-hosting'],
      appliedIn: [{ label: 'Deploy stage of the build track', to: '/build' }],
    }),
  ],
}
