import { compileNotebook, validateNotebook, notebookToJson } from '../src/notebooks/compile'
import type { NotebookDefinition, UseCaseFlavor } from '../src/notebooks/model'
import { compositionFromPattern } from '../src/compose/composition'
import { ARCHITECTURES, ARCHITECTURE_ORDER } from '../src/data/architectures'

const flavor: UseCaseFlavor = {
  id:'meridian', name:'Internal knowledge assistant', industry:'Financial services',
  description:'demo', corpusDescription:'synthetic policy docs in S3',
  sampleQuestions:['What is the expense limit?','How long do we retain EU records?'],
  domainConsiderations:['access control'], systemPromptHint:'cite sources',
  bucketExample:'s3://meridian-corpus', adaptNote:'Point at your corpus.',
}
let bad=0
for (const id of ARCHITECTURE_ORDER) {
  const arch = ARCHITECTURES[id]
  const def: NotebookDefinition = {
    id: `${id}__meridian`, title:`${arch.name} — Meridian`, description:'end-to-end',
    patternId:id, useCaseFlavorId:'meridian', difficulty:arch.difficulty,
    estimatedTime:'~30 min', awsServiceIds:arch.awsServiceIds,
    prerequisites:['AWS account','Python 3.10+'], tags:[id],
    composition: compositionFromPattern(id), flavor,
  }
  const nb = compileNotebook(def)
  const errs = validateNotebook(nb)
  const json = notebookToJson(def)
  let parseOk = true
  try { JSON.parse(json) } catch { parseOk = false }
  const hasTeardown = json.includes('delete-knowledge-base')
  const hasHonesty = json.includes('not affiliated')
  const hasCreds = json.includes('never hard-code')
  const ok = errs.length===0 && parseOk && hasTeardown && hasHonesty && hasCreds
  if(!ok) bad++
  console.log(`${ok?'✓':'✗'} ${id.padEnd(24)} cells=${nb.cells.length} json=${parseOk?'ok':'BAD'} teardown=${hasTeardown} honesty=${hasHonesty}${errs.length?' ERR '+errs.join(';'):''}`)
}
process.exit(bad?1:0)
