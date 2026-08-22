import { flattenTopics } from '../src/atlas/types'
import { STRANDS_SECTIONS } from '../src/data/atlas/strands'
import { AGENTCORE_SECTIONS } from '../src/data/atlas/agentcore'
import { RETRIEVAL_SECTIONS } from '../src/data/atlas/retrieval'
import { ATLAS_FOR_SERVICE } from '../src/atlas/links'

const byAtlas: Record<string, Set<string>> = {
  strands: new Set(flattenTopics(STRANDS_SECTIONS).map(t => t.id)),
  agentcore: new Set(flattenTopics(AGENTCORE_SECTIONS).map(t => t.id)),
  retrieval: new Set(flattenTopics(RETRIEVAL_SECTIONS).map(t => t.id)),
}
let bad = 0
for (const [sid, ref] of Object.entries(ATLAS_FOR_SERVICE)) {
  const ok = byAtlas[ref!.atlas]?.has(ref!.topicId)
  if (!ok) { bad++; console.log('✗ deep link broken', sid, '->', ref!.atlas, ref!.topicId) }
}
console.log(`AtlasLink map: ${Object.keys(ATLAS_FOR_SERVICE).length} service->topic links, ${bad} broken`)
console.log(bad===0 ? '✓ all atlas deep links resolve' : `✗ ${bad} broken`)
process.exit(bad?1:0)
