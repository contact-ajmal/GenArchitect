import { notebookToJson } from '../src/notebooks/compile'
import { definitionFromId } from '../src/data/notebookTemplates'
const cases: [string, string][] = [
  ['multi_agent_rag__healthcare', 'guardrail_id'],   // healthcare forces Guardrails on a base w/o them
  ['memory_augmented_rag__hr_policy', 'acl_group'],  // HR forces per-user ACL filter
  ['hybrid_rerank_rag__legal', 'rerankingConfiguration'], // legal precision
  ['guardrailed_secure_rag__healthcare', 'do not output patient'], // domain considerations shape prompt guidance? (systemPromptHint)
]
let bad=0
for (const [id, marker] of cases) {
  const def = definitionFromId(id)!
  const json = notebookToJson(def)
  // also confirm a flavor sample question + honesty framing appear
  const q = def.flavor.sampleQuestions[0]
  const ok = json.includes(marker.split(' ')[0]) && json.includes('not affiliated') && json.includes('delete-knowledge-base')
  const hasQ = json.includes(q.slice(0, 20))
  if(!ok) bad++
  console.log(`${ok?'✓':'✗'} ${id.padEnd(34)} has "${marker.split(' ')[0]}"=${json.includes(marker.split(' ')[0])} sampleQ=${hasQ}`)
}
process.exit(bad?1:0)
