import { DEFAULT_COMPOSITION, compositionFromPattern } from '../src/compose/composition'
import { normalizeComposition, nearestPattern } from '../src/compose/rules'
import { generateCode } from '../src/compose/generateCode'
import { compositionToDiagram } from '../src/compose/diagram'
import { ARCHITECTURE_ORDER } from '../src/data/architectures'

let bad = 0
const check = (label: string, c: any) => {
  const comp = normalizeComposition(c)
  const files = generateCode(comp)
  const agent = files.find(f => f.filename === 'agent.py')!.code
  const hasTools = files.some(f => f.filename === 'tools.py')
  const usesGateway = comp.gateway || comp.multiKb
  const problems: string[] = []
  // Coherence: local path imports from tools and tools.py exists; gateway path has MCP inline and no tools.py
  if (!usesGateway && !hasTools) problems.push('local path missing tools.py')
  if (!usesGateway && !agent.includes('from tools import retrieve')) problems.push('agent.py missing tools import')
  if (usesGateway && hasTools) problems.push('gateway path should not emit tools.py')
  if (usesGateway && !agent.includes('MCPClient')) problems.push('gateway path missing MCP')
  if (comp.memory === 'long_term' && !agent.includes('recall_user_context')) problems.push('long-term memory not wired')
  if (comp.memory !== 'none' && !files.some(f=>f.filename==='memory.py')) problems.push('memory.py missing')
  if (comp.guardrails && !agent.includes('guardrail_id')) problems.push('guardrails not in model')
  if (comp.orchestration === 'multi_agent' && !agent.includes('supervisor')) problems.push('multi-agent scaffold missing')
  if (comp.deployTarget === 'agentcore_runtime' && !files.some(f=>f.filename==='deploy.sh')) problems.push('deploy.sh missing')
  const nodes = compositionToDiagram(comp).layers.length
  const nearest = nearestPattern(comp).id
  const ok = problems.length === 0
  if (!ok) bad++
  console.log(`${ok?'✓':'✗'} ${label.padEnd(34)} files=[${files.map(f=>f.filename).join(', ')}] nodes=${nodes} ~${nearest}${problems.length?'  !! '+problems.join('; '):''}`)
}

check('default', DEFAULT_COMPOSITION)
check('gateway+multiKb+memory', { ...DEFAULT_COMPOSITION, multiKb: true, memory: 'long_term' })
check('multi_agent+guardrails+runtime', { ...DEFAULT_COMPOSITION, orchestration: 'multi_agent', guardrails: true, deployTarget: 'agentcore_runtime', observability: true })
check('customer+rerank+acl', { ...DEFAULT_COMPOSITION, knowledgeBase: 'customer_managed', reranking: true, accessControl: 'document_acls' })
check('graph', { ...DEFAULT_COMPOSITION, graphAugmented: true })
for (const id of ARCHITECTURE_ORDER) check('preset:'+id, compositionFromPattern(id))

process.exit(bad?1:0)
