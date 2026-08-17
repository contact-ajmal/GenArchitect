import { Eyebrow } from '../components/ui'
import ConceptDiagram from '../components/atlas/ConceptDiagram'
import AnimatedLoop from '../components/atlas/AnimatedLoop'
import FlowWalkthrough from '../components/atlas/FlowWalkthrough'
import ComparisonMatrix from '../components/atlas/ComparisonMatrix'
import DecisionTree from '../components/atlas/DecisionTree'
import LayeredStack from '../components/atlas/LayeredStack'
import SequenceTrace from '../components/atlas/SequenceTrace'
import LifecycleTimeline from '../components/atlas/LifecycleTimeline'

function Demo({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-hairline py-10 first:border-t-0">
      <Eyebrow>{title}</Eyebrow>
      <div className="mt-4 rounded-xl border border-hairline bg-neutral-0 p-5">{children}</div>
    </section>
  )
}

export default function AtlasDemo() {
  return (
    <div className="mx-auto max-w-content px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-ink">
        Atlas primitives · demo
      </h1>
      <p className="mt-2 text-ink-soft">All eight visual treatments with placeholder content.</p>

      <Demo title="concept_diagram">
        <ConceptDiagram
          height={260}
          nodes={[
            { id: 'model', label: 'Model', sublabel: 'reasoning', detail: 'The LLM that drives the loop.', x: 20, y: 30 },
            { id: 'prompt', label: 'System prompt', detail: 'Instructions and role.', x: 20, y: 75 },
            { id: 'tools', label: 'Tools', sublabel: '@tool', detail: 'Functions the model can call.', x: 55, y: 52 },
            { id: 'agent', label: 'Agent', detail: 'Composes model + prompt + tools.', x: 85, y: 52, accent: 'rgb(13 148 136)' },
          ]}
          edges={[
            { from: 'model', to: 'agent' },
            { from: 'prompt', to: 'agent' },
            { from: 'tools', to: 'agent' },
          ]}
          selector={{
            label: 'Highlight',
            options: [
              { id: 'brain', label: 'The brain', highlightNodeIds: ['model'], note: 'The model reasons and decides.' },
              { id: 'hands', label: 'The hands', highlightNodeIds: ['tools'], note: 'Tools let it act on the world.' },
            ],
          }}
        />
      </Demo>

      <Demo title="animated_loop (flagship)">
        <AnimatedLoop
          stages={[
            { id: 'reason', label: 'Reason', plain: 'The model thinks about the request.', technical: 'Given the conversation and tools, the model plans a next action.', message: 'thinking' },
            { id: 'select', label: 'Select tool', plain: 'It picks a tool to call.', message: 'tool call' },
            { id: 'execute', label: 'Execute', plain: 'The tool runs and returns a result.', message: 'result' },
            { id: 'observe', label: 'Observe', plain: 'The result is fed back in.', message: 'observation' },
            { id: 'respond', label: 'Respond', plain: 'When done, it answers.', message: 'answer' },
          ]}
        />
      </Demo>

      <Demo title="flow_walkthrough">
        <FlowWalkthrough
          steps={[
            { id: 'req', label: 'Request', plain: 'A request arrives.', codeSampleId: 's1' },
            { id: 'proc', label: 'Process', plain: 'The agent processes it.' },
            { id: 'res', label: 'Respond', plain: 'A response returns.' },
          ]}
          codeSamples={[
            { id: 's1', title: 'Handler', language: 'python', filename: 'app.py', code: 'def handle(req):\n    return agent(req["prompt"]).message\n' },
          ]}
        />
      </Demo>

      <Demo title="comparison_matrix">
        <ComparisonMatrix
          columns={['Graph', 'Swarm', 'Workflow']}
          rows={[
            { label: 'Control', cells: [{ text: 'Deterministic', tone: 'good' }, { text: 'Emergent', tone: 'neutral' }, { text: 'Explicit', tone: 'good' }] },
            { label: 'Complexity', cells: ['Medium', 'High', 'Low'], note: 'Rough guidance' },
          ]}
        />
      </Demo>

      <Demo title="decision_tree">
        <DecisionTree
          root={{
            id: 'root',
            question: 'Do you need deterministic control?',
            options: [
              { label: 'Yes', next: { id: 'a', recommendation: 'Workflow or Graph', reasoning: 'Explicit control suits predictable pipelines.' } },
              { label: 'No — let agents self-organize', next: { id: 'b', recommendation: 'Swarm', reasoning: 'Emergent coordination fits open-ended tasks.' } },
            ],
          }}
        />
      </Demo>

      <Demo title="layered_stack">
        <LayeredStack
          layers={[
            { id: 'runtime', label: 'Runtime', role: 'hosting', detail: 'Serverless, isolated agent hosting.', accent: 'rgb(20 184 166)' },
            { id: 'memory', label: 'Memory', role: 'state', detail: 'Short- and long-term memory.' },
            { id: 'gateway', label: 'Gateway', role: 'tools', detail: 'Tools as MCP with central auth.' },
            { id: 'observability', label: 'Observability', role: 'ops', detail: 'Traces and metrics to CloudWatch.' },
          ]}
        />
      </Demo>

      <Demo title="sequence_trace">
        <SequenceTrace
          spans={[
            { id: 'ep', label: 'entrypoint.invoke', detail: 'Request received.', depth: 0, kind: 'entrypoint' },
            { id: 'auth', label: 'identity.authorize', detail: 'Caller authenticated.', depth: 1, kind: 'auth' },
            { id: 'gw', label: 'gateway.retrieve', detail: 'Tool discovered + called.', depth: 1, kind: 'gateway' },
            { id: 'tool', label: 'tool.search', detail: 'KB retrieval.', depth: 2, kind: 'tool' },
            { id: 'model', label: 'model.generate', detail: 'Answer composed.', depth: 1, kind: 'model' },
            { id: 'resp', label: 'response', detail: 'Returned to caller.', depth: 0, kind: 'response' },
          ]}
        />
      </Demo>

      <Demo title="lifecycle_timeline">
        <LifecycleTimeline
          stages={[
            { id: 'create', label: 'Create', plain: 'Scaffold the project.' },
            { id: 'dev', label: 'Dev', plain: 'Iterate locally.' },
            { id: 'deploy', label: 'Deploy', plain: 'Push to the runtime.' },
            { id: 'operate', label: 'Operate', plain: 'Monitor and evaluate.' },
          ]}
        />
      </Demo>
    </div>
  )
}
