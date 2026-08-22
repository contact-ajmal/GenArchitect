/**
 * Every chunk_lab claim that can be checked mechanically.
 *
 * The lead-in tint is drawn by slicing `overlapChars` off the front of the
 * chunk text, so a wrong count silently tints the wrong span — which the eye
 * reads as "this is the repeated part" and believes. Where the lead-in is
 * genuine overlap it must equal the tail of the previous chunk; that is
 * checkable, so it is checked.
 */
import { flattenTopics } from '../src/atlas/types'
import { RETRIEVAL_SECTIONS } from '../src/data/atlas/retrieval'

let bad = 0
let labs = 0
let chunks = 0

for (const topic of flattenTopics(RETRIEVAL_SECTIONS)) {
  if (topic.visual.kind !== 'chunk_lab') continue
  for (const strategy of topic.visual.strategies) {
    labs++
    const byId = new Map(strategy.chunks.map((c) => [c.id, c]))

    strategy.chunks.forEach((chunk, i) => {
      chunks++
      const overlap = chunk.overlapChars ?? 0

      if (overlap > chunk.text.length) {
        bad++
        console.log(`✗ ${topic.id}/${strategy.id}/${chunk.id}: overlapChars ${overlap} exceeds text length ${chunk.text.length}`)
        return
      }

      // A tinted lead-in with no caption claims to be overlap, so it must
      // actually be the tail of the chunk before it.
      if (overlap > 0 && !chunk.leadInNote) {
        const prev = strategy.chunks[i - 1]
        if (!prev) {
          bad++
          console.log(`✗ ${topic.id}/${strategy.id}/${chunk.id}: claims overlap but is the first chunk`)
        } else {
          const lead = chunk.text.slice(0, overlap)
          if (!prev.text.endsWith(lead)) {
            bad++
            console.log(`✗ ${topic.id}/${strategy.id}/${chunk.id}: lead-in ${JSON.stringify(lead)} is not the tail of ${prev.id}`)
          }
        }
      }

      if (chunk.parentId && !byId.has(chunk.parentId)) {
        bad++
        console.log(`✗ ${topic.id}/${strategy.id}/${chunk.id}: parentId ${chunk.parentId} not found`)
      }
      if (chunk.tokens <= 0) {
        bad++
        console.log(`✗ ${topic.id}/${strategy.id}/${chunk.id}: non-positive token count`)
      }
    })
  }
}

console.log(`chunk labs: ${labs} strategies, ${chunks} chunks checked`)
console.log(bad === 0 ? '✓ all chunk lab overlaps and parents resolve' : `✗ ${bad} issues`)
process.exit(bad ? 1 : 0)
