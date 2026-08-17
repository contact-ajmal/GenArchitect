import { writeFileSync } from 'fs'
import { toDrawioXml } from '../src/export/drawio'
import { ARCHITECTURE_LIST } from '../src/data/architectures'
let bad=0
for (const a of ARCHITECTURE_LIST) {
  const xml = toDrawioXml(a)
  const paired = (xml.match(/<mxCell [^>]*[^/]>/g)||[]).length
  const closes = (xml.match(/<\/mxCell>/g)||[]).length
  const icons = (xml.match(/resIcon=/g)||[]).length
  const edges = (xml.match(/edge="1"/g)||[]).length
  const cloud = xml.includes('grIcon=mxgraph.aws4.group_aws_cloud_alt')
  const actor = xml.includes('shape=mxgraph.aws4.user')
  const groups = (xml.match(/rounded=1;arcSize=[46];/g)||[]).length
  const labeledEdges = (xml.match(/value="[^"]+" style="edgeStyle/g)||[]).length
  const ok = xml.startsWith('<mxfile') && paired===closes && icons>0 && cloud && actor && edges>=6
  if(!ok) bad++
  console.log(`${ok?'✓':'✗'} ${a.id.padEnd(22)} icons=${icons} edges=${edges} labeled=${labeledEdges} groups=${groups} cloud=${cloud} actor=${actor}`)
  if (a.id==='guardrailed_secure_rag') writeFileSync('/tmp/arch.drawio', xml)
}
process.exit(bad?1:0)
