import type { RagArchitecture } from '../../types'

const ORCHESTRATION_PY = `from strands import Agent, tool
from strands.models import BedrockModel

model = BedrockModel(model_id="anthropic.claude-3-5-sonnet-20241022-v2:0")

# --- Specialist agents (each with a narrow job) --------------------------
retriever = Agent(model=model, tools=[kb_retrieve],
                  system_prompt="Retrieve cited passages for the query.")
synthesizer = Agent(model=model,
                    system_prompt="Draft a grounded answer from passages; cite sources.")
compliance = Agent(model=model, tools=[compliance_retrieve],
                   system_prompt="Check the draft against compliance rules; flag issues.")

# --- Expose specialists to the supervisor as tools -----------------------
@tool
def find_evidence(query: str) -> str:
    """Retriever specialist: gather cited passages."""
    return str(retriever(query).message)

@tool
def review_compliance(draft: str) -> str:
    """Compliance specialist: validate a draft answer."""
    return str(compliance(draft).message)

# --- Supervisor coordinates the specialists ------------------------------
supervisor = Agent(
    model=model,
    system_prompt=(
        "Coordinate specialists: gather evidence, draft an answer, then run a "
        "compliance review before responding. Only return reviewed answers."
    ),
    tools=[find_evidence, review_compliance],
)

print(supervisor("Can we market Product X to retail clients in France?").message)
`

const RUNTIME_PY = `# Deploy the supervisor agent on AgentCore Runtime.
# Reference implementation — verify against current AgentCore docs.
from bedrock_agentcore.runtime import BedrockAgentCoreApp

app = BedrockAgentCoreApp()

@app.entrypoint
def invoke(payload):
    question = payload["prompt"]
    return {"answer": str(supervisor(question).message)}

if __name__ == "__main__":
    app.run()   # runs locally; deploy with the AgentCore starter toolkit
`

export const multiAgentRag: RagArchitecture = {
  id: 'multi_agent_rag',
  name: 'Multi-Agent RAG',
  tagline: 'A supervisor and specialists — retrieve, synthesize, and review.',
  difficulty: 'production',
  family: 'rag',

  summary:
    'High-stakes answers benefit from division of labor and a review step. Here a supervisor agent coordinates specialists — one gathers evidence, one drafts the answer, one checks it against compliance rules — before anything reaches the user. It costs more and adds latency, so it’s reserved for questions where correctness and reviewability matter.',
  technicalSummary:
    'A supervisor/orchestrator pattern in Strands: specialist agents (retriever, synthesizer, compliance-checker) are wrapped as tools and coordinated by a supervisor agent. Specialists reach data through AgentCore Gateway tools; the whole system deploys on AgentCore Runtime for serverless, isolated, scalable hosting. The compliance specialist provides a built-in review gate. Worth it when responsibilities are separable and a review step is required — overkill for simple Q&A.',

  whenToUse: [
    'High-stakes questions that need a review/verification step before responding.',
    'Separable responsibilities (retrieval vs. drafting vs. compliance) that benefit from specialization.',
    'You are ready to run production hosting (AgentCore Runtime) and coordinate agents.',
  ],
  whenNotToUse: [
    'Simple Q&A where one agent suffices — multi-agent adds latency, cost, and failure modes.',
    'Latency-critical paths that can’t absorb several agent hops.',
  ],
  enterpriseConsiderations: [
    'Reliability: specialization + a compliance gate improves trust for regulated answers, but adds orchestration complexity to test.',
    'Ops: AgentCore Runtime provides serverless hosting, session isolation, and scaling so you don’t manage servers.',
    'Cost/latency: each specialist is another model call — reserve the full pattern for questions that justify it.',
  ],

  layers: [
    { id: 'src', label: 'Corpora', layer: 'sources', role: 'corpus', awsServiceId: 's3' },
    { id: 'kbs', label: 'Knowledge bases', layer: 'index', role: 'knowledge-base', awsServiceId: 'bedrock_kb_managed' },
    { id: 'gateway', label: 'Gateway tools', layer: 'orchestration', role: 'tool-gateway', awsServiceId: 'agentcore_gateway' },
    { id: 'retrieval', label: 'Retrieval tools', layer: 'retrieval', role: 'retriever', awsServiceId: 'bedrock_kb_managed' },
    { id: 'retriever_agent', label: 'Retriever agent', layer: 'orchestration', role: 'specialist', awsServiceId: 'strands_sdk' },
    { id: 'synthesizer_agent', label: 'Synthesizer agent', layer: 'orchestration', role: 'specialist', awsServiceId: 'strands_sdk' },
    { id: 'compliance_agent', label: 'Compliance-checker agent', layer: 'orchestration', role: 'specialist', awsServiceId: 'strands_sdk', note: 'review gate' },
    { id: 'supervisor', label: 'Supervisor agent', layer: 'orchestration', role: 'supervisor', awsServiceId: 'strands_sdk', note: 'coordinates specialists' },
    { id: 'runtime', label: 'AgentCore Runtime', layer: 'orchestration', role: 'runtime', awsServiceId: 'agentcore_runtime', note: 'serverless, isolated hosting' },
    { id: 'llm', label: 'LLM', layer: 'generation', role: 'generator', awsServiceId: 'bedrock_foundation_models' },
  ],

  walkthrough: [
    {
      id: 'specialists',
      order: 1,
      title: 'Define narrow specialists',
      plainExplanation:
        'Three agents each get one job: find evidence, draft the answer, and check it against the rules. Narrow roles are easier to make reliable.',
      technicalDetail:
        'Each specialist is a Strands agent with a focused prompt and only the tools it needs. Specialists reach data through Gateway tools, keeping access centralized and auditable.',
      diagramComponentIds: ['retriever_agent', 'synthesizer_agent', 'compliance_agent', 'retrieval'],
      codeSampleId: 'orchestration_py',
      codeHighlightRange: [[6, 12]],
      awsServiceIds: ['strands_sdk', 'bedrock_kb_managed', 'agentcore_gateway'],
    },
    {
      id: 'agents_as_tools',
      order: 2,
      title: 'Expose specialists as tools',
      plainExplanation:
        'Each specialist is wrapped so the supervisor can call it like any other tool.',
      technicalDetail:
        'The "agents-as-tools" pattern: a @tool invokes a specialist agent and returns its result. This lets the supervisor compose specialists without bespoke plumbing.',
      diagramComponentIds: ['supervisor', 'retriever_agent', 'compliance_agent'],
      codeSampleId: 'orchestration_py',
      codeHighlightRange: [[14, 23]],
      awsServiceIds: ['strands_sdk'],
    },
    {
      id: 'orchestrate',
      order: 3,
      title: 'Supervise: evidence → draft → review',
      plainExplanation:
        'The supervisor runs the workflow: gather evidence, draft an answer, then require a compliance review before responding.',
      technicalDetail:
        'The supervisor’s prompt encodes the workflow and gating. The compliance specialist acts as a mandatory review step, so unreviewed drafts never reach the user.',
      diagramComponentIds: ['supervisor', 'gateway', 'kbs'],
      codeSampleId: 'orchestration_py',
      codeHighlightRange: [[25, 33]],
      awsServiceIds: ['strands_sdk', 'agentcore_gateway'],
      securityNotes: ['The compliance gate is a control point — log its verdicts for audit.'],
    },
    {
      id: 'deploy',
      order: 4,
      title: 'Deploy on AgentCore Runtime',
      plainExplanation:
        'The whole system is hosted on a serverless runtime built for agents, so it scales and isolates sessions without servers to manage.',
      technicalDetail:
        'Wrap the supervisor in a BedrockAgentCoreApp entrypoint and deploy to AgentCore Runtime — serverless, session-isolated, and framework-agnostic, supporting long-running executions.',
      diagramComponentIds: ['runtime', 'supervisor'],
      codeSampleId: 'runtime_py',
      codeHighlightRange: [[7, 13]],
      awsServiceIds: ['agentcore_runtime', 'strands_sdk'],
      costNotes: ['Runtime scales to load; multi-agent workflows multiply per-question model calls.'],
    },
  ],

  codeSamples: [
    {
      id: 'orchestration_py',
      title: 'Supervisor coordinating specialist agents',
      language: 'python',
      filename: 'multi_agent.py',
      code: ORCHESTRATION_PY,
      explanation:
        'The agents-as-tools pattern: specialists are ordinary agents wrapped as @tools, and a supervisor composes them with a compliance review gate. Strands multi-agent APIs evolve — verify against current docs.',
    },
    {
      id: 'runtime_py',
      title: 'Deploy on AgentCore Runtime',
      language: 'python',
      filename: 'runtime.py',
      code: RUNTIME_PY,
      explanation:
        'BedrockAgentCoreApp exposes the agent as a runtime entrypoint for serverless, isolated hosting. The deployment toolkit/CLI and entrypoint contract change often — verify against current AgentCore docs.',
    },
  ],

  meridianStage: {
    stageTitle: 'Reliable, reviewed answers',
    whatItAdds:
      'Gives Meridian a review gate for high-stakes questions — evidence, draft, and a compliance check — hosted on AgentCore Runtime for production scale.',
  },

  awsServiceIds: ['agentcore_runtime', 'agentcore_gateway', 'bedrock_kb_managed', 'strands_sdk', 'bedrock_foundation_models', 's3'],

  references: [
    { label: 'Amazon Bedrock AgentCore — Runtime (developer guide)', url: 'https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/what-is-bedrock-agentcore.html', kind: 'aws-docs' },
    { label: 'Strands Agents SDK — multi-agent patterns', url: 'https://strandsagents.com/', kind: 'aws-docs' },
    { label: 'Amazon Bedrock Knowledge Bases', url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html', kind: 'aws-docs' },
  ],

  accentColor: '#10B981',
}
