import { FAILURE_MODES } from '../src/data/failureModes'
import { ARCHITECTURES } from '../src/data/architectures'
let bad=0
for (const f of FAILURE_MODES) {
  const arch = ARCHITECTURES[f.fixArchitectureId]
  const ids = new Set(arch.layers.map(l=>l.id))
  const ok = ids.has(f.fixComponentId)
  if(!ok) bad++
  console.log(`${ok?'✓':'✗'} ${f.id.padEnd(22)} fix ${f.fixArchitectureId}#${f.fixComponentId}`)
}
process.exit(bad?1:0)
