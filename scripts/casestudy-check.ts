/**
 * Provenance integrity for case-study deep dives.
 *
 * These pages make claims about real companies' systems, so the rules the data
 * model implies are enforced rather than trusted: a 'sourced' claim must cite a
 * source that exists, an 'inferred' claim must say what it reasons from, and a
 * 'documented' diagram must not put an AWS service logo on a node unless the
 * service was actually named. That last one is the whole point — a plausible
 * logo on an undocumented node turns a guess into an assertion.
 */
import { CASE_STUDIES } from '../src/data/caseStudies'
import { USE_CASES } from '../src/lib/usecases'
import { ARCHITECTURES } from '../src/data/architectures'
import { AWS_SERVICES } from '../src/data/services'

let bad = 0
const fail = (m: string) => {
  bad++
  console.log('✗ ' + m)
}

const useCaseIds = new Set(USE_CASES.map((u) => u.id))

for (const [key, study] of Object.entries(CASE_STUDIES)) {
  if (key !== study.useCaseId) fail(`${key}: registry key does not match useCaseId ${study.useCaseId}`)
  if (!useCaseIds.has(study.useCaseId)) {
    fail(`${study.useCaseId}: no matching entry in data/usecases.json — the card would 404`)
  }

  const sourceIds = new Set(study.sources.map((s) => s.id))
  if (!study.provenance.trim()) fail(`${study.useCaseId}: empty provenance statement`)

  for (const s of study.sources) {
    if (!/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}\//i.test(s.url)) {
      fail(`${study.useCaseId}: source ${s.id} has a suspicious URL ${s.url}`)
    }
  }

  const checkClaim = (label: string, confidence: string, ids?: string[], basis?: string) => {
    if (confidence === 'sourced') {
      if (!ids?.length) fail(`${label}: marked sourced but cites nothing`)
      for (const sid of ids ?? []) {
        if (!sourceIds.has(sid)) fail(`${label}: cites unknown source "${sid}"`)
      }
    } else {
      if (!basis?.trim()) fail(`${label}: marked inferred but states no basis`)
    }
  }

  study.lessons.forEach((l, i) => checkClaim(`${study.useCaseId}/lesson[${i}]`, l.confidence, l.sourceIds, l.basis))

  for (const d of study.diagrams) {
    const nodeIds = new Set(d.diagram.layers.map((n) => n.id))
    if (!d.diagram.layers.length) fail(`${study.useCaseId}/${d.id}: diagram has no nodes`)

    for (const n of d.diagram.layers) {
      if (n.awsServiceId && !AWS_SERVICES[n.awsServiceId]) {
        fail(`${study.useCaseId}/${d.id}: node ${n.id} -> unknown service ${n.awsServiceId}`)
      }
      // The documented view's contract: a logo means the service was named.
      // Every node without one must say why it has none.
      if (d.kind === 'documented' && !n.awsServiceId && !n.note?.trim()) {
        fail(`${study.useCaseId}/${d.id}: node ${n.id} has no service and no note explaining why`)
      }
    }

    const seen = new Set<number>()
    for (const step of d.steps) {
      const label = `${study.useCaseId}/${d.id}/${step.id}`
      if (seen.has(step.order)) fail(`${label}: duplicate step order ${step.order}`)
      seen.add(step.order)
      if (!step.diagramComponentIds.length) fail(`${label}: highlights no nodes`)
      for (const nid of step.diagramComponentIds) {
        if (!nodeIds.has(nid)) fail(`${label}: highlights unknown node "${nid}"`)
      }
      checkClaim(label, step.confidence, step.sourceIds, step.basis)
    }
  }

  for (const pid of study.relatedPatternIds) {
    if (!(pid in ARCHITECTURES)) fail(`${study.useCaseId}: unknown related pattern ${pid}`)
  }
}

const studies = Object.values(CASE_STUDIES)
const nodes = studies.flatMap((s) => s.diagrams.flatMap((d) => d.diagram.layers)).length
const steps = studies.flatMap((s) => s.diagrams.flatMap((d) => d.steps)).length
console.log(`case studies: ${studies.length} deep dive(s), ${nodes} diagram nodes, ${steps} steps`)
console.log(bad === 0 ? '✓ all case-study claims carry their provenance' : `✗ ${bad} issues`)
process.exit(bad ? 1 : 0)
