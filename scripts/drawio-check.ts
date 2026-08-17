import { writeFileSync } from 'fs'
import { toDrawioXml } from '../src/export/drawio'
import { ARCHITECTURE_LIST } from '../src/data/architectures'
let bad=0
for (const a of ARCHITECTURE_LIST) {
  const xml = toDrawioXml(a)
  const paired = (xml.match(/<mxCell [^>]*[^/]>/g)||[]).length  // non-self-closing opens
  const closes = (xml.match(/<\/mxCell>/g)||[]).length
  const icons = (xml.match(/resIcon=/g)||[]).length
  const edges = (xml.match(/edge="1"/g)||[]).length
  const ok = xml.startsWith('<mxfile') && paired===closes && icons>0
  if(!ok) bad++
  console.log(`${ok?'✓':'✗'} ${a.id.padEnd(24)} awsIcons=${icons} edges=${edges} pairedCells=${paired}==closes=${closes}`)
  if (a.id==='guardrailed_secure_rag') writeFileSync('/tmp/arch.drawio', xml)
}
process.exit(bad?1:0)
