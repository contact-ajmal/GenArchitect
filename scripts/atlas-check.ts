import { STRANDS_SECTIONS } from '../src/data/atlas/strands'
import { AGENTCORE_SECTIONS } from '../src/data/atlas/agentcore'
import { flattenTopics } from '../src/atlas/types'

const allow = /^https:\/\/(strandsagents\.com|github\.com|modelcontextprotocol\.io|docs\.aws\.amazon\.com)\//
let bad = 0

function check(name: string, sections: any[]) {
  const topics = flattenTopics(sections)
  const ids = new Set(topics.map(t => t.id))
  const kinds: Record<string, number> = {}
  for (const t of topics) {
    kinds[t.visual.kind] = (kinds[t.visual.kind] ?? 0) + 1
    if (!allow.test(t.docUrl)) { bad++; console.log('✗ bad docUrl', name, t.id, t.docUrl) }
    for (const r of t.relatedTopicIds ?? []) if (!ids.has(r)) { bad++; console.log('✗ dangling related', name, t.id, '->', r) }
    if (!t.explanation.plain || !t.explanation.technical) { bad++; console.log('✗ missing explanation', name, t.id) }
    // layered_stack topicId targets must resolve within the atlas
    if (t.visual.kind === 'layered_stack') for (const l of t.visual.layers) if (l.topicId && !ids.has(l.topicId)) { bad++; console.log('✗ stack layer topicId not found', name, l.topicId) }
  }
  const full = topics.filter(t=>t.coverageStatus==='full').length
  const ov = topics.filter(t=>t.coverageStatus==='overview').length
  console.log(`${name}: ${sections.length} sections, ${topics.length} topics (${full} full / ${ov} overview); visuals: ${Object.keys(kinds).sort().join(', ')}`)
}

check('strands', STRANDS_SECTIONS)
check('agentcore', AGENTCORE_SECTIONS)
console.log(bad===0 ? '✓ all atlases valid' : `✗ ${bad} issues`)
process.exit(bad?1:0)
