import type { AwsServiceId } from '../types'
import type { RagComposition } from '../compose/composition'
import { generateCode } from '../compose/generateCode'
import { compositionToDiagram } from '../compose/diagram'
import { md, py, sh, type NotebookCell, type UseCaseFlavor } from './model'

/**
 * The section library. `assembleNotebook` composes an end-to-end notebook body
 * from ordered sections, parameterized by a RagComposition + a use-case flavor.
 * Code cells reuse the Phase 10 composer fragments (generateCode) adapted to
 * notebook form (shared kernel: cross-file imports stripped). compile.ts adds
 * the title/honesty/credentials framing and cost/verify admonitions.
 */

const GEN_BANNER =
  '# Reference implementation — verify exact syntax against current AWS docs.'

/** Services this composition touches — drives per-cell verify links. */
function serviceIdsFor(c: RagComposition): AwsServiceId[] {
  return [
    ...new Set(
      compositionToDiagram(c)
        .layers.map((l) => l.awsServiceId)
        .filter((x): x is AwsServiceId => Boolean(x)),
    ),
  ]
}

/** Adapt a composer fragment to notebook form (shared kernel). */
function forNotebook(src: string): string {
  return src
    .split('\n')
    .filter(
      (line) =>
        line.trim() !== GEN_BANNER &&
        !/^from (tools|memory) import /.test(line),
    )
    .join('\n')
    .replace(/^\n+/, '')
    .replace(/\n+$/, '\n')
}

/** Remove a trailing example run line so a dedicated questions cell owns it. */
function stripTrailingRun(src: string): string {
  return src
    .replace(/\n?print\([a-z_]+\(".*"\)\.message\)\s*$/m, '')
    .replace(/\n+$/, '\n')
}

export function assembleNotebook(
  c: RagComposition,
  f: UseCaseFlavor,
): NotebookCell[] {
  const files = new Map(generateCode(c).map((file) => [file.filename, file]))
  const verify = serviceIdsFor(c)
  const isGateway = c.gateway || c.multiKb
  const agentVar = c.orchestration === 'multi_agent' ? 'supervisor' : 'agent'
  const cells: NotebookCell[] = []

  /* --- 1. Setup & credentials ------------------------------------------- */
  const pkgs = (files.get('requirements.txt')?.code ?? 'strands-agents')
    .trim()
    .split('\n')
    .filter(Boolean)
    .join(' ')

  cells.push(
    md(
      `## 1. Setup & credentials

Install the SDKs and make sure AWS credentials are available. **Credentials are never stored in this notebook** — they come from your environment (\`aws configure\`, SSO, or environment variables). Placeholders only.`,
    ),
    py(`%pip install ${pkgs}`),
    py(`import os

# Credentials resolve from your environment — never hard-code keys here.
os.environ.setdefault("AWS_REGION", "us-west-2")`),
  )

  /* --- 2. Knowledge base ------------------------------------------------- */
  const kbKind =
    c.knowledgeBase === 'managed_kb'
      ? 'a Bedrock **Managed Knowledge Base**'
      : 'a **customer-managed** vector store'
  cells.push(
    md(
      `## 2. Knowledge base — ${f.industry}

This notebook retrieves over ${kbKind}. **Corpus:** ${f.corpusDescription}

**${f.industry} considerations:**
${f.domainConsiderations.map((d) => `- ${d}`).join('\n')}

> **ADAPT HERE** — ${f.adaptNote} Change \`KB_ID\` in the retrieval cell below to your Knowledge Base id, and point the data source at your bucket (\`${f.bucketExample}\`). You can run everything on a small S3 sample first; SharePoint/Confluence connectors slot in here without changing the agent code.`,
    ),
    sh(
      `# Create a data source over your S3 corpus, then ingest (parse + embed + index).
# ADAPT: point --data-source-configuration at your own bucket/config.
aws bedrock-agent create-data-source \\
  --knowledge-base-id "YOURKB01" \\
  --name "${f.id}-corpus" \\
  --data-source-configuration file://datasource.json

aws bedrock-agent start-ingestion-job \\
  --knowledge-base-id "YOURKB01" \\
  --data-source-id "YOURDS01"`,
      { costWarning: true, verifyServices: ['bedrock_kb_managed'] },
    ),
  )

  /* --- 3. The Strands agent --------------------------------------------- */
  cells.push(
    md(
      `## 3. Build the Strands agent

Define the retrieval tool${c.memory === 'long_term' ? ', the memory tool,' : ''} and the agent (model + system prompt + tools). The system prompt is tailored for the ${f.name} scenario.`,
    ),
  )
  const toolsFile = files.get('tools.py')
  if (toolsFile) {
    cells.push(py(forNotebook(toolsFile.code), { verifyServices: verify }))
  }
  const memoryFile = files.get('memory.py')
  if (memoryFile) {
    cells.push(py(forNotebook(memoryFile.code), { verifyServices: ['agentcore_memory'] }))
  }
  const agentSrc = files.get('agent.py')!.code
  cells.push(
    py(isGateway ? forNotebook(agentSrc) : forNotebook(stripTrailingRun(agentSrc)), {
      verifyServices: verify,
    }),
    md(
      `> **ADAPT HERE — system prompt.** Tailor \`SYSTEM_PROMPT\` for your domain. For the ${f.name} scenario, a good starting point:
>
> _"${f.systemPromptHint}"_`,
    ),
  )

  /* --- 4. Ask grounded questions ---------------------------------------- */
  const qList = f.sampleQuestions.map((q) => `    ${JSON.stringify(q)},`).join('\n')
  if (isGateway) {
    cells.push(
      md(
        `## 4. Ask grounded questions

This agent runs inside the Gateway MCP context (the \`with mcp:\` block above). Add these ${f.name} questions inside that block to try them — each should return a grounded, cited answer:

${f.sampleQuestions.map((q) => `- ${q}`).join('\n')}`,
      ),
    )
  } else {
    cells.push(
      md(
        `## 4. Ask grounded questions

Each answer should be grounded in retrieved passages and cite its sources.`,
      ),
      py(`questions = [
${qList}
]

for q in questions:
    print("Q:", q)
    print(${agentVar}(q).message)
    print("-" * 60)`),
    )
  }

  /* --- 5. Evaluate (illustrative) --------------------------------------- */
  cells.push(
    md(
      `## 5. Evaluate (illustrative)

A real evaluation would score groundedness, citation accuracy, and relevance (see the app's evaluation primer). Here is a **clearly illustrative** spot-check — not a production eval harness.`,
    ),
  )
  if (isGateway) {
    cells.push(
      md(
        `Run the same spot-check inside the \`with mcp:\` block: for each answer, confirm every claim is supported by a retrieved source and that sources are cited.`,
      ),
    )
  } else {
    cells.push(
      py(`def looks_grounded(answer: str) -> bool:
    # Illustrative only — a real check verifies each claim against sources.
    return any(marker in answer for marker in ("§", "(", "source"))

for q in questions:
    ans = str(${agentVar}(q).message)
    print(q, "-> grounded?", looks_grounded(ans))`),
    )
  }

  /* --- 6. Deploy to AgentCore Runtime (optional) ------------------------ */
  if (c.deployTarget === 'agentcore_runtime') {
    cells.push(
      md(
        `## 6. Deploy to AgentCore Runtime (optional)

**Optional and billable.** Save the agent to \`agent.py\`, then use the AgentCore CLI to deploy and invoke it. Skip this section to keep everything local.`,
      ),
      sh(files.get('deploy.sh')?.code ? forNotebook(files.get('deploy.sh')!.code) : 'agentcore launch', {
        costWarning: true,
        verifyServices: ['agentcore_runtime'],
      }),
    )
    const observe = files.get('observe.sh')
    if (observe) {
      cells.push(
        sh(forNotebook(observe.code), {
          verifyServices: ['agentcore_observability', 'agentcore_evaluations', 'cloudwatch'],
        }),
      )
    }
  }

  /* --- 7. Cleanup / teardown -------------------------------------------- */
  const teardown: string[] = [
    '# Tear down billable resources to stop charges. ADAPT the ids to yours.',
    'aws bedrock-agent delete-data-source --knowledge-base-id "YOURKB01" --data-source-id "YOURDS01"',
    'aws bedrock-agent delete-knowledge-base --knowledge-base-id "YOURKB01"',
  ]
  if (c.guardrails)
    teardown.push('aws bedrock delete-guardrail --guardrail-identifier "gr-your-guardrail-01"')
  if (c.deployTarget === 'agentcore_runtime')
    teardown.push('# Also delete the AgentCore Runtime you deployed (see the AgentCore console/CLI).')

  cells.push(
    md(
      `## 7. Cleanup / teardown

Delete everything this notebook created so it stops billing. Run this when you're done experimenting.`,
    ),
    sh(teardown.join('\n'), { verifyServices: ['bedrock_kb_managed'] }),
  )

  return cells
}
