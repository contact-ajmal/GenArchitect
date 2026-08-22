import { ARCHITECTURE_LIST } from '../src/data/architectures'
import { AWS_SERVICES } from '../src/data/services'
import { MERIDIAN } from '../src/data/meridian'
import { ARCHITECTURES } from '../src/data/architectures'

let errors = 0
const fail = (msg: string) => {
  errors++
  console.error('  ✗ ' + msg)
}

for (const arch of ARCHITECTURE_LIST) {
  const compIds = new Set(arch.layers.map((c) => c.id))
  const sampleIds = new Set(arch.codeSamples.map((s) => s.id))

  // Component awsServiceId references resolve.
  for (const c of arch.layers) {
    if (c.awsServiceId && !AWS_SERVICES[c.awsServiceId]) {
      fail(`${arch.id}: component ${c.id} -> unknown service ${c.awsServiceId}`)
    }
  }

  // Walkthrough integrity.
  for (const step of arch.walkthrough) {
    for (const id of step.diagramComponentIds) {
      if (!compIds.has(id)) {
        fail(`${arch.id}/${step.id}: diagram component "${id}" not in layers`)
      }
    }
    if (step.codeSampleId && !sampleIds.has(step.codeSampleId)) {
      fail(`${arch.id}/${step.id}: codeSampleId "${step.codeSampleId}" missing`)
    }
    // Highlight ranges must fall within the referenced sample's line count.
    if (step.codeSampleId && step.codeHighlightRange) {
      const sample = arch.codeSamples.find((s) => s.id === step.codeSampleId)!
      const lineCount = sample.code.replace(/\n$/, '').split('\n').length
      for (const r of step.codeHighlightRange) {
        const [lo, hi] = Array.isArray(r) ? r : [r, r]
        if (lo < 1 || hi > lineCount || lo > hi) {
          fail(
            `${arch.id}/${step.id}: highlight ${JSON.stringify(r)} out of range (sample ${sample.id} has ${lineCount} lines)`,
          )
        }
      }
    }
    for (const svc of step.awsServiceIds) {
      if (!AWS_SERVICES[svc]) fail(`${arch.id}/${step.id}: unknown service ${svc}`)
    }
  }

  // No fabricated-looking URLs (must be https and a real host).
  for (const ref of arch.references) {
    if (!/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}\//i.test(ref.url)) {
      fail(`${arch.id}: suspicious reference URL ${ref.url}`)
    }
  }
}

// Meridian stages must cover every RAG architecture exactly once, in order.
// Meridian is a RAG scenario, so patterns outside that family are expected to
// have no stage — and must not claim one, since inventing the link is the
// dishonesty that making `meridianStage` optional was meant to prevent.
const stageIds = MERIDIAN.stages.map((s) => s.architectureId)
for (const arch of ARCHITECTURE_LIST) {
  const staged = stageIds.includes(arch.id)
  if (arch.family === 'rag') {
    if (!staged) fail(`Meridian missing stage for ${arch.id}`)
    if (!arch.meridianStage) fail(`${arch.id}: RAG pattern without a meridianStage link`)
  } else {
    if (staged) fail(`Meridian has a stage for non-RAG pattern ${arch.id}`)
    if (arch.meridianStage) {
      fail(`${arch.id}: non-RAG pattern claims a meridianStage link`)
    }
  }
}

// Every Meridian stage must point at an architecture that exists.
for (const id of stageIds) {
  if (!(id in ARCHITECTURES)) fail(`Meridian stage points at unknown architecture ${id}`)
}

if (errors === 0) {
  console.log(`✓ data valid — ${ARCHITECTURE_LIST.length} architectures, ${Object.keys(AWS_SERVICES).length} services, ${MERIDIAN.stages.length} Meridian stages`)
} else {
  console.error(`\n${errors} error(s) found`)
  process.exit(1)
}
