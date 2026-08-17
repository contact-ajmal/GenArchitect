import { buildScaffold } from '../src/export/scaffold'
import { compositionFromPattern } from '../src/compose/composition'
import { ARCHITECTURE_ORDER } from '../src/data/architectures'
let bad=0
for (const id of ARCHITECTURE_ORDER) {
  const c = compositionFromPattern(id)
  const files = buildScaffold(c)
  const paths = files.map(f=>f.path)
  const must = ['README.md','agent.py','requirements.txt','.env.example','NOTES.md']
  const missing = must.filter(m=>!paths.includes(m))
  const envHasSecret = files.find(f=>f.path==='.env.example')!.content.match(/=(?!REPLACE_ME|DRAFT|us-west-2|anthropic)[A-Za-z0-9]{12,}/)
  const readmeNotice = files.find(f=>f.path==='README.md')!.content.includes('not affiliated')
  const ok = !missing.length && !envHasSecret && readmeNotice
  if(!ok) bad++
  console.log(`${ok?'✓':'✗'} ${id.padEnd(24)} [${paths.join(', ')}]${missing.length?' MISSING '+missing:''}${envHasSecret?' SECRET?!':''}`)
}
process.exit(bad?1:0)
