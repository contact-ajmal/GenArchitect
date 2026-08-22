import { STRANDS_SECTIONS } from '../src/data/atlas/strands'
import { AGENTCORE_SECTIONS } from '../src/data/atlas/agentcore'
import { RETRIEVAL_SECTIONS } from '../src/data/atlas/retrieval'
import { flattenTopics } from '../src/atlas/types'

// arxiv.org and anthropic.com are here for the retrieval atlas only: HyDE, the
// lost-in-the-middle effect and contextual retrieval are published findings,
// not AWS features, and citing the source beats pointing at an AWS page that
// does not describe them. Still a closed allowlist of real hosts.
const allow = /^https:\/\/(strandsagents\.com|github\.com|modelcontextprotocol\.io|docs\.aws\.amazon\.com|arxiv\.org|www\.anthropic\.com)\//
let bad = 0

/**
 * Routes an `appliedIn` link may point at. These were never validated before,
 * so a renamed route would have left dead links scattered across the atlases
 * with nothing to catch them.
 */
const ROUTES = [
  '/catalog', '/architecture/', '/use-case', '/use-cases', '/build', '/review',
  '/compose', '/playground', '/accuracy', '/failure-modes', '/security',
  '/evaluate', '/notebooks', '/strands', '/agentcore', '/retrieval', '/videos',
  '/updates',
]

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
    for (const a of t.appliedIn ?? []) if (!ROUTES.some(r => a.to.startsWith(r))) { bad++; console.log('✗ appliedIn points at an unknown route', name, t.id, '->', a.to) }
  }
  const full = topics.filter(t=>t.coverageStatus==='full').length
  const ov = topics.filter(t=>t.coverageStatus==='overview').length
  console.log(`${name}: ${sections.length} sections, ${topics.length} topics (${full} full / ${ov} overview); visuals: ${Object.keys(kinds).sort().join(', ')}`)
}

check('strands', STRANDS_SECTIONS)
check('agentcore', AGENTCORE_SECTIONS)
check('retrieval', RETRIEVAL_SECTIONS)
console.log(bad===0 ? '✓ all atlases valid' : `✗ ${bad} issues`)
process.exit(bad?1:0)
