import { STRANDS_SECTIONS } from '../src/data/atlas/strands'
import { flattenTopics } from '../src/atlas/types'
const topics = flattenTopics(STRANDS_SECTIONS)
const ids = new Set(topics.map(t => t.id))
let bad = 0
const allowHost = /^https:\/\/(strandsagents\.com|github\.com|modelcontextprotocol\.io)\//
const visualKinds: Record<string, number> = {}
for (const t of topics) {
  visualKinds[t.visual.kind] = (visualKinds[t.visual.kind] ?? 0) + 1
  if (!allowHost.test(t.docUrl)) { bad++; console.log('✗ bad docUrl', t.id, t.docUrl) }
  for (const r of t.relatedTopicIds ?? []) if (!ids.has(r)) { bad++; console.log('✗ dangling relatedTopic', t.id, '->', r) }
  if (!t.explanation.plain || !t.explanation.technical) { bad++; console.log('✗ missing explanation', t.id) }
}
console.log('sections:', STRANDS_SECTIONS.length, 'topics:', topics.length)
console.log('coverage:', topics.filter(t=>t.coverageStatus==='full').length, 'full,', topics.filter(t=>t.coverageStatus==='overview').length, 'overview')
console.log('visual kinds used:', Object.keys(visualKinds).sort().join(', '))
console.log(bad===0 ? '✓ atlas content valid' : `✗ ${bad} issues`)
process.exit(bad?1:0)
