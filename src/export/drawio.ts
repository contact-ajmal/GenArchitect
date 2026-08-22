import type { AwsServiceId, DiagramComponent, LayerId } from '../types'
import type { DiagramSource } from '../lib/layout'
import { AWS_SERVICES } from '../data/services'
import { downloadBlob } from './scaffold'

/**
 * Generate an architect-grade draw.io / diagrams.net diagram (mxGraph XML) from
 * a diagram source. It uses a dedicated, spacious layout — each service is a
 * self-contained "card" (wrapped label inside, small AWS icon in the corner) on
 * a generous grid, so labels never overlap. The diagram includes an AWS Cloud
 * boundary, grouped layer containers, a User/Client actor, and a complete,
 * labeled flow across services (data pipeline + agent control edges).
 */

interface AwsIcon {
  resIcon: string
  fill: string
}

const AWS_ICON: Partial<Record<AwsServiceId, AwsIcon>> = {
  s3: { resIcon: 'mxgraph.aws4.s3', fill: '#7AA116' },
  opensearch_serverless: { resIcon: 'mxgraph.aws4.opensearch_service', fill: '#8C4FFF' },
  aurora_pgvector: { resIcon: 'mxgraph.aws4.aurora', fill: '#C925D1' },
  neptune: { resIcon: 'mxgraph.aws4.neptune', fill: '#C925D1' },
  iam: { resIcon: 'mxgraph.aws4.identity_and_access_management_iam', fill: '#DD344C' },
  cloudwatch: { resIcon: 'mxgraph.aws4.cloudwatch', fill: '#E7157B' },
  bedrock_foundation_models: { resIcon: 'mxgraph.aws4.bedrock', fill: '#01A88D' },
  bedrock_kb_managed: { resIcon: 'mxgraph.aws4.bedrock', fill: '#01A88D' },
  bedrock_kb_customer_managed: { resIcon: 'mxgraph.aws4.bedrock', fill: '#01A88D' },
  bedrock_guardrails: { resIcon: 'mxgraph.aws4.bedrock', fill: '#01A88D' },
}

const MAIN_ORDER: LayerId[] = ['sources', 'ingestion', 'bronze', 'silver', 'gold', 'index', 'retrieval', 'augmentation', 'generation', 'consumption']
const TOP_SPINES: LayerId[] = ['orchestration', 'memory']
const BOTTOM_SPINES: LayerId[] = ['guardrails', 'observability']

const LAYER_LABELS: Record<LayerId, string> = {
  sources: 'Sources', ingestion: 'Ingestion',
  bronze: 'Bronze', silver: 'Silver', gold: 'Gold', consumption: 'Consumption', index: 'Index', retrieval: 'Retrieval',
  augmentation: 'Augmentation', generation: 'Generation', guardrails: 'Guardrails',
  memory: 'Memory', orchestration: 'Orchestration', observability: 'Observability',
}

const EDGE_LABEL: Record<string, string> = {
  'sources>ingestion': 'ingest',
  'sources>index': 'load',
  'ingestion>index': 'embed + index',
  'index>retrieval': 'search',
  'retrieval>augmentation': 'top passages',
  'retrieval>generation': 'context',
  'augmentation>generation': 'augmented prompt',
}

// ---- geometry (generous — nothing overlaps) -------------------------------
const CARD_W = 190
const CARD_H = 66
const COL_GAP = 40
const ROW_GAP = 34
const COL_PITCH = CARD_W + COL_GAP // 230
const ROW_PITCH = CARD_H + ROW_GAP // 100
const TITLE_BAND = 22
const SECTION_GAP = 40
const LEFT = 170 // room for the actor on the left
const TOP = 96 // room for the title + cloud label

// ---- styles ---------------------------------------------------------------
const CLOUD_STYLE =
  'points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];' +
  'outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=13;fontStyle=0;container=0;pointerEvents=0;collapsible=0;' +
  'shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_aws_cloud_alt;strokeColor=#232F3E;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#232F3E;dashed=0;'
const FLOW_GROUP =
  'rounded=1;arcSize=5;fillColor=#F5F7FA;strokeColor=#C9D3DE;dashed=1;dashPattern=6 4;verticalAlign=top;align=center;spacingTop=4;fontColor=#7D8998;fontSize=11;fontStyle=1;html=1;'
const SPINE_GROUP =
  'rounded=1;arcSize=5;fillColor=#F3F0FB;strokeColor=#D9CEF3;dashed=1;dashPattern=6 4;verticalAlign=top;align=center;spacingTop=4;fontColor=#7A6FA6;fontSize=11;fontStyle=1;html=1;'
const ACTOR_STYLE =
  'sketch=0;outlineConnect=0;fontColor=#232F3E;gradientColor=none;fillColor=#232F3E;strokeColor=none;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=12;shape=mxgraph.aws4.user;'
const TITLE_STYLE = 'text;html=1;strokeColor=none;fillColor=none;align=left;fontSize=20;fontStyle=1;fontColor=#232F3E;'
const DATA_EDGE =
  'edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=block;strokeColor=#5A6B86;fontSize=11;fontColor=#41526B;labelBackgroundColor=#FFFFFF;jettySize=auto;'
const CTRL_EDGE =
  'edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=block;dashed=1;strokeColor=#14B8A6;fontSize=11;fontColor=#0D9488;labelBackgroundColor=#FFFFFF;jettySize=auto;'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}
function cid(id: string): string {
  return 'n_' + id.replace(/[^a-zA-Z0-9]/g, '_')
}
function cardStyle(icon?: AwsIcon): string {
  if (icon) {
    return `rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#FFFFFF;strokeColor=${icon.fill};strokeWidth=1.5;fontColor=#232F3E;fontSize=11;align=left;spacingLeft=46;spacingRight=6;verticalAlign=middle;`
  }
  return 'rounded=1;whiteSpace=wrap;html=1;arcSize=10;fillColor=#F7F8FA;strokeColor=#8592A6;fontColor=#232F3E;fontSize=11;align=center;spacingLeft=8;spacingRight=8;verticalAlign=middle;'
}
function iconStyle(icon: AwsIcon): string {
  return (
    `sketch=0;outlineConnect=0;fontColor=#232F3E;gradientColor=none;fillColor=${icon.fill};strokeColor=#ffffff;` +
    'dashed=0;html=1;verticalLabelPosition=bottom;verticalAlign=top;aspect=fixed;' +
    `shape=mxgraph.aws4.resourceIcon;resIcon=${icon.resIcon};`
  )
}

function vertex(id: string, value: string, style: string, x: number, y: number, w: number, h: number): string {
  return `<mxCell id="${id}" value="${esc(value)}" style="${style}" vertex="1" parent="1"><mxGeometry x="${Math.round(x)}" y="${Math.round(y)}" width="${Math.round(w)}" height="${Math.round(h)}" as="geometry"/></mxCell>`
}
function edgeCell(id: string, from: string, to: string, style: string, label = ''): string {
  return `<mxCell id="${id}" value="${esc(label)}" style="${style}" edge="1" parent="1" source="${from}" target="${to}"><mxGeometry relative="1" as="geometry"/></mxCell>`
}

interface Placed {
  comp: DiagramComponent
  x: number
  y: number
}

export function toDrawioXml(source: DiagramSource): string {
  // Group components by layer.
  const byLayer = new Map<LayerId, DiagramComponent[]>()
  for (const c of source.layers) {
    const list = byLayer.get(c.layer)
    if (list) list.push(c)
    else byLayer.set(c.layer, [c])
  }
  const present = (l: LayerId) => (byLayer.get(l)?.length ?? 0) > 0
  const mainLayers = MAIN_ORDER.filter(present)
  const topSpines = TOP_SPINES.filter(present)
  const bottomSpines = BOTTOM_SPINES.filter(present)
  const spineLayers = [...topSpines, ...bottomSpines]

  const flowBlockW = mainLayers.length * CARD_W + Math.max(0, mainLayers.length - 1) * COL_GAP
  const maxSpineNodes = spineLayers.reduce((m, l) => Math.max(m, byLayer.get(l)!.length), 0)
  const spineBlockW = maxSpineNodes * CARD_W + Math.max(0, maxSpineNodes - 1) * COL_GAP
  const contentW = Math.max(flowBlockW, spineBlockW, CARD_W)
  const flowRows = mainLayers.reduce((m, l) => Math.max(m, byLayer.get(l)!.length), 1)
  const flowAreaH = flowRows * CARD_H + (flowRows - 1) * ROW_GAP

  const placed = new Map<string, Placed>()
  const boxes: string[] = []
  let boxN = 0

  const rowStartX = (k: number) => LEFT + (contentW - (k * CARD_W + (k - 1) * COL_GAP)) / 2

  // Full-width spine row.
  function spineRow(layer: LayerId, yTop: number) {
    const comps = byLayer.get(layer)!
    const nodesY = yTop + TITLE_BAND
    const sx = rowStartX(comps.length)
    comps.forEach((c, i) => placed.set(c.id, { comp: c, x: sx + i * COL_PITCH, y: nodesY }))
    boxes.push(
      vertex(`box_${boxN++}`, LAYER_LABELS[layer], SPINE_GROUP, LEFT - 14, yTop, contentW + 28, TITLE_BAND + CARD_H + 12),
    )
  }

  let y = TOP
  for (const s of topSpines) {
    spineRow(s, y)
    y += TITLE_BAND + CARD_H + 12 + SECTION_GAP
  }

  // Flow columns.
  const flowTop = y
  const flowNodesTop = flowTop + TITLE_BAND
  const flowStartX = LEFT + (contentW - flowBlockW) / 2
  mainLayers.forEach((layer, c) => {
    const comps = byLayer.get(layer)!
    const colX = flowStartX + c * COL_PITCH
    boxes.push(
      vertex(`box_${boxN++}`, LAYER_LABELS[layer], FLOW_GROUP, colX - 14, flowTop, CARD_W + 28, TITLE_BAND + flowAreaH + 12),
    )
    const stackH = comps.length * CARD_H + (comps.length - 1) * ROW_GAP
    const sy = flowNodesTop + (flowAreaH - stackH) / 2
    comps.forEach((comp, j) => placed.set(comp.id, { comp, x: colX, y: sy + j * ROW_PITCH }))
  })
  y = flowTop + TITLE_BAND + flowAreaH + 12 + SECTION_GAP

  for (const s of bottomSpines) {
    spineRow(s, y)
    y += TITLE_BAND + CARD_H + 12 + SECTION_GAP
  }

  const bottomY = y - SECTION_GAP
  const cloudX = LEFT - 40
  const cloudY = TOP - 34
  const cloudW = contentW + 80
  const cloudH = bottomY - cloudY + 20

  // ---- build cells ----
  const cells: string[] = []
  cells.push(vertex('title', source.name, TITLE_STYLE, cloudX, 20, cloudW, 28))
  cells.push(vertex('aws_cloud', 'AWS Cloud', CLOUD_STYLE, cloudX, cloudY, cloudW, cloudH))
  boxes.forEach((b) => cells.push(b))

  // Actor.
  const midY = (cloudY + cloudY + cloudH) / 2 - 24
  cells.push(vertex('actor', 'User / Client', ACTOR_STYLE, 44, midY, 48, 48))

  // Cards + corner icons.
  for (const { comp, x, y: ny } of placed.values()) {
    const icon = comp.awsServiceId ? AWS_ICON[comp.awsServiceId] : undefined
    const serviceLabel = comp.awsServiceId ? AWS_SERVICES[comp.awsServiceId]?.name : undefined
    const value = serviceLabel && serviceLabel !== comp.label ? `${comp.label}\n${serviceLabel}` : comp.label
    cells.push(vertex(cid(comp.id), value, cardStyle(icon), x, ny, CARD_W, CARD_H))
    if (icon) {
      cells.push(vertex(`ic_${cid(comp.id)}`, '', iconStyle(icon), x + 10, ny + (CARD_H - 30) / 2, 30, 30))
    }
  }

  // ---- edges ----
  let e = 0
  const connect = (from: string, to: string, style: string, label: string) => {
    if (placed.has(from) && placed.has(to)) cells.push(edgeCell(`e_${e++}`, cid(from), cid(to), style, label))
  }

  // Data-flow edges between consecutive main layers.
  for (let i = 0; i < mainLayers.length - 1; i++) {
    const a = byLayer.get(mainLayers[i])!
    const b = byLayer.get(mainLayers[i + 1])!
    const label = EDGE_LABEL[`${mainLayers[i]}>${mainLayers[i + 1]}`] ?? ''
    a.forEach((an, ai) => {
      const targets =
        a.length === b.length ? [ai] : b.length === 1 ? [0] : a.length === 1 ? b.map((_, bi) => bi) : [Math.min(ai, b.length - 1)]
      targets.forEach((bi) => connect(an.id, b[bi].id, DATA_EDGE, label))
    })
  }

  // Agent-centric control edges (the complete flow across services).
  const find = (pred: (c: DiagramComponent) => boolean) => source.layers.find(pred)
  const filter = (pred: (c: DiagramComponent) => boolean) => source.layers.filter(pred)
  const agent = find((c) => c.layer === 'orchestration' && c.awsServiceId === 'strands_sdk') ?? find((c) => c.layer === 'orchestration')
  const llm = find((c) => c.layer === 'generation')
  const retriever = find((c) => c.layer === 'retrieval')
  const memory = find((c) => c.layer === 'memory')
  const guardrail = find((c) => c.layer === 'guardrails')
  const gateway = find((c) => c.awsServiceId === 'agentcore_gateway')
  const observability = find((c) => c.awsServiceId === 'agentcore_observability') ?? find((c) => c.layer === 'observability')
  const indexes = filter((c) => c.layer === 'index')

  const entry = agent ?? indexes[0] ?? retriever ?? llm
  if (entry) {
    connect('actor', entry.id, DATA_EDGE, '1. request')
    connect(entry.id, 'actor', CTRL_EDGE, 'response')
  }
  if (agent && retriever) connect(agent.id, retriever.id, CTRL_EDGE, 'query')
  if (agent && llm) connect(agent.id, llm.id, CTRL_EDGE, 'generate')
  if (memory && agent) connect(memory.id, agent.id, CTRL_EDGE, 'recall')
  if (guardrail && llm) connect(guardrail.id, llm.id, DATA_EDGE, 'screen I/O')
  if (gateway) indexes.forEach((ix) => connect(gateway.id, ix.id, DATA_EDGE, 'tool'))
  if (observability && agent && observability.id !== agent.id) connect(agent.id, observability.id, CTRL_EDGE, 'traces')

  const w = Math.round(cloudX + cloudW + 40)
  const h = Math.round(cloudY + cloudH + 40)

  return `<mxfile host="app.diagrams.net" type="device">
  <diagram name="${esc(source.name)}" id="genarchitect">
    <mxGraphModel dx="${w}" dy="${h}" grid="0" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${w}" pageHeight="${h}" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
${cells.map((c) => '        ' + c).join('\n')}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
`
}

export function downloadDrawio(source: DiagramSource, filename: string): void {
  const xml = toDrawioXml(source)
  downloadBlob(new Blob([xml], { type: 'application/xml' }), filename)
}
