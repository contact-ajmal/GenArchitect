import { writeFileSync } from 'fs'
import { toDrawioXml } from '../src/export/drawio'
import { ARCHITECTURE_LIST } from '../src/data/architectures'

// Parse card vertices (n_*) and check no two card rectangles overlap.
function cards(xml: string) {
  const re = /<mxCell id="(n_[^"]+)"[^>]*vertex="1"[^>]*>\s*<mxGeometry x="([-\d]+)" y="([-\d]+)" width="(\d+)" height="(\d+)"/g
  const out: {id:string,x:number,y:number,w:number,h:number}[] = []
  let m
  while ((m = re.exec(xml))) out.push({ id:m[1], x:+m[2], y:+m[3], w:+m[4], h:+m[5] })
  return out
}
const overlap = (a:any,b:any) => a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y
let bad = 0
for (const arch of ARCHITECTURE_LIST) {
  const xml = toDrawioXml(arch)
  const cs = cards(xml)
  let overlaps = 0
  for (let i=0;i<cs.length;i++) for (let j=i+1;j<cs.length;j++) if (overlap(cs[i],cs[j])) overlaps++
  const icons = (xml.match(/resIcon=/g)||[]).length
  const edges = (xml.match(/edge="1"/g)||[]).length
  const ok = overlaps===0 && xml.startsWith('<mxfile')
  if(!ok) bad++
  console.log(`${ok?'✓':'✗'} ${arch.id.padEnd(22)} cards=${cs.length} icons=${icons} edges=${edges} cardOverlaps=${overlaps}`)
  if (arch.id==='guardrailed_secure_rag') writeFileSync('/tmp/arch.drawio', xml)
}
process.exit(bad?1:0)
