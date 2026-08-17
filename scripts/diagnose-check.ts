import { recommend } from '../src/diagnose/recommend'
const profiles: [string, any, string][] = [
  ['simple single-source Q&A', {corpusScale:'small',sources:'single',access:'none',complexity:'simple',memory:'stateless',actions:'answer_only',priority:'speed_cost'}, 'managed_kb_rag'],
  ['multi-source + ACLs + reasoning', {corpusScale:'large',sources:'many_diff_permissions',access:'per_user',complexity:'multi_hop',memory:'stateless',actions:'answer_only',priority:'capability'}, 'guardrailed_secure_rag|multi_kb_agentic_rag'],
  ['relationship questions', {corpusScale:'large',sources:'multiple',access:'none',complexity:'relationship',graphConfirm:'traversal',memory:'stateless',actions:'answer_only',priority:'capability'}, 'graph_rag'],
  ['action-taking with review', {corpusScale:'large',sources:'multiple',access:'none',complexity:'multi_hop',memory:'stateless',actions:'take_actions',review:'review',priority:'capability'}, 'multi_agent_rag'],
  ['needs memory', {corpusScale:'small',sources:'single',access:'none',complexity:'simple',memory:'user_memory',actions:'answer_only',priority:'speed_cost'}, 'memory_augmented_rag'],
]
let bad=0
for (const [label, ans, expect] of profiles) {
  const r = recommend(ans)!
  const ok = expect.split('|').includes(r.recommended.id)
  if(!ok) bad++
  console.log(`${ok?'✓':'✗'} ${label.padEnd(34)} -> ${r.recommended.id} (runner: ${r.runnerUp?.id})  expect ${expect}`)
}
process.exit(bad?1:0)
