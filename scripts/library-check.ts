import { FEATURED_NOTEBOOKS, FLAVOR_LIST, definitionFromId, buildNotebookFromComposition, FLAVORS } from '../src/data/notebookTemplates'
import { compileNotebook, validateNotebook } from '../src/notebooks/compile'
import { ARCHITECTURE_ORDER } from '../src/data/architectures'
import { compositionFromPattern } from '../src/compose/composition'

const patterns = new Set(FEATURED_NOTEBOOKS.map(n=>n.patternId))
const flavors = new Set(FEATURED_NOTEBOOKS.map(n=>n.useCaseFlavorId))
console.log('featured count:', FEATURED_NOTEBOOKS.length)
console.log('patterns covered:', ARCHITECTURE_ORDER.every(p=>patterns.has(p)) ? 'ALL 9' : 'MISSING')
console.log('flavors covered:', FLAVOR_LIST.every(f=>flavors.has(f.id)) ? 'ALL 6' : 'MISSING')

let bad=0
// every featured id reconstructs from id and compiles valid
for (const n of FEATURED_NOTEBOOKS) {
  const rebuilt = definitionFromId(n.id)
  const nb = rebuilt ? compileNotebook(rebuilt) : null
  const ok = !!rebuilt && nb!.cells.length>0 && validateNotebook(nb!).length===0
  if(!ok){bad++; console.log('✗ id reconstruct/compile', n.id)}
}
// composition-based (custom) notebook compiles
const custom = buildNotebookFromComposition(compositionFromPattern('guardrailed_secure_rag'), FLAVORS.healthcare)
const cnb = compileNotebook(custom)
console.log('custom notebook cells:', cnb.cells.length, 'errors:', validateNotebook(cnb).length)
console.log(bad===0 ? '✓ all featured reconstruct + compile valid' : `✗ ${bad} failures`)
process.exit(bad?1:0)
