import type { AwsServiceId, LayerId } from '../types'
import { computeLayout, type DiagramSource } from '../lib/layout'
import { downloadBlob } from './scaffold'

/**
 * Generate an architect-grade draw.io / diagrams.net diagram (mxGraph XML) from
 * a diagram source. It reuses the app's deterministic layout for node positions,
 * then enriches it into a full AWS architecture diagram: an AWS Cloud boundary,
 * grouped layer containers, a User/Client actor, AWS icons with service-name
 * captions, labeled data-flow edges, and the agent's control edges (query,
 * generate, recall, screen, tool, traces). Services without an official draw.io
 * icon render as clean labeled boxes, so the diagram is always valid.
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

const LAYER_LABELS: Record<LayerId, string> = {
  sources: 'Sources',
  ingestion: 'Ingestion',
  index: 'Index',
  retrieval: 'Retrieval',
  augmentation: 'Augmentation',
  generation: 'Generation',
  guardrails: 'Guardrails',
  memory: 'Memory',
  orchestration: 'Orchestration',
  observability: 'Observability',
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

// ---- styles ---------------------------------------------------------------
const X_SHIFT = 140
const Y_SHIFT = 56

const CLOUD_STYLE =
  'points=[[0,0],[0.25,0],[0.5,0],[0.75,0],[1,0],[1,0.25],[1,0.5],[1,0.75],[1,1],[0.75,1],[0.5,1],[0.25,1],[0,1],[0,0.75],[0,0.5],[0,0.25]];' +
  'outlineConnect=0;gradientColor=none;html=1;whiteSpace=wrap;fontSize=12;fontStyle=0;container=0;pointerEvents=0;collapsible=0;' +
  'shape=mxgraph.aws4.group;grIcon=mxgraph.aws4.group_aws_cloud_alt;strokeColor=#232F3E;fillColor=none;verticalAlign=top;align=left;spacingLeft=30;fontColor=#232F3E;dashed=0;'
const GROUP_STYLE =
  'rounded=1;arcSize=6;fillColor=#F7F8FA;strokeColor=#C9D3DE;dashed=1;dashPattern=6 4;verticalAlign=top;align=left;spacingLeft=8;spacingTop=3;fontColor=#7D8998;fontSize=10;fontStyle=1;html=1;'
const SPINE_STYLE =
  'rounded=1;arcSize=4;fillColor=#F2EFFB;strokeColor=#D9CEF3;dashed=1;dashPattern=6 4;verticalAlign=top;align=left;spacingLeft=8;spacingTop=3;fontColor=#7A6FA6;fontSize=10;fontStyle=1;html=1;'
const BOX_STYLE =
  'rounded=1;whiteSpace=wrap;html=1;arcSize=14;fillColor=#FFFFFF;strokeColor=#5A6B86;fontColor=#232F3E;fontSize=11;'
const ACTOR_STYLE =
  'sketch=0;outlineConnect=0;fontColor=#232F3E;gradientColor=none;fillColor=#232F3E;strokeColor=none;dashed=0;verticalLabelPosition=bottom;verticalAlign=top;align=center;html=1;fontSize=11;shape=mxgraph.aws4.user;'
const TITLE_STYLE = 'text;html=1;strokeColor=none;fillColor=none;align=left;fontSize=18;fontStyle=1;fontColor=#232F3E;'
const DATA_EDGE =
  'edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=block;strokeColor=#5A6B86;fontSize=10;fontColor=#5A6B86;labelBackgroundColor=#FFFFFF;'
const CTRL_EDGE =
  'edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=block;dashed=1;strokeColor=#14B8A6;fontSize=10;fontColor=#0D9488;labelBackgroundColor=#FFFFFF;'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
function cid(id: string): string {
  return 'n_' + id.replace(/[^a-zA-Z0-9]/g, '_')
}
function iconStyle(icon: AwsIcon): string {
  return (
    'sketch=0;outlineConnect=0;fontColor=#232F3E;gradientColor=none;' +
    `fillColor=${icon.fill};strokeColor=#ffffff;dashed=0;verticalLabelPosition=bottom;` +
    'verticalAlign=top;align=center;html=1;fontSize=10;fontStyle=0;aspect=fixed;' +
    `shape=mxgraph.aws4.resourceIcon;resIcon=${icon.resIcon};`
  )
}

function vertex(id: string, value: string, style: string, x: number, y: number, w: number, h: number): string {
  return (
    `<mxCell id="${id}" value="${esc(value)}" style="${style}" vertex="1" parent="1">` +
    `<mxGeometry x="${Math.round(x)}" y="${Math.round(y)}" width="${Math.round(w)}" height="${Math.round(h)}" as="geometry"/>` +
    `</mxCell>`
  )
}
function edge(id: string, from: string, to: string, style: string, label = ''): string {
  return (
    `<mxCell id="${id}" value="${esc(label)}" style="${style}" edge="1" parent="1" source="${from}" target="${to}">` +
    `<mxGeometry relative="1" as="geometry"/>` +
    `</mxCell>`
  )
}

export function toDrawioXml(source: DiagramSource): string {
  const layout = computeLayout(source)
  const nodes = layout.nodes.map((n) => ({ ...n, x: n.x + X_SHIFT, y: n.y + Y_SHIFT, cx: n.cx + X_SHIFT, cy: n.cy + Y_SHIFT }))
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const first = (pred: (n: (typeof nodes)[number]) => boolean) => nodes.find(pred)
  const all = (pred: (n: (typeof nodes)[number]) => boolean) => nodes.filter(pred)

  const cells: string[] = []

  // Bounding box of the content → AWS Cloud boundary.
  const minX = Math.min(...nodes.map((n) => n.x))
  const minY = Math.min(...nodes.map((n) => n.y))
  const maxX = Math.max(...nodes.map((n) => n.x + n.w))
  const maxY = Math.max(...nodes.map((n) => n.y + n.h))
  const cloudX = minX - 28
  const cloudY = minY - 40
  const cloudW = maxX - minX + 56
  const cloudH = maxY - minY + 68

  // Title + subtitle.
  cells.push(vertex('title', source.name, TITLE_STYLE, cloudX, 8, cloudW, 26))

  // AWS Cloud boundary.
  cells.push(vertex('aws_cloud', 'AWS Cloud', CLOUD_STYLE, cloudX, cloudY, cloudW, cloudH))

  // Layer group containers (from the layout bands, shifted).
  layout.bands.forEach((band, i) => {
    const style = band.kind === 'spine' ? SPINE_STYLE : GROUP_STYLE
    cells.push(
      vertex(`grp_${i}`, LAYER_LABELS[band.layer] ?? band.layer, style, band.x + X_SHIFT - 6, band.y + Y_SHIFT - 4, band.w + 12, band.h + 8),
    )
  })

  // User / client actor (left of the cloud).
  const actorY = (minY + maxY) / 2 - 24
  cells.push(vertex('actor', 'User / Client', ACTOR_STYLE, 30, actorY, 48, 48))

  // Nodes.
  for (const n of nodes) {
    const icon = n.awsServiceId ? AWS_ICON[n.awsServiceId] : undefined
    if (icon) {
      const value = n.serviceLabel ? `${n.label}\n(${n.serviceLabel})` : n.label
      cells.push(vertex(cid(n.id), value, iconStyle(icon), n.cx - 24, n.cy - 24, 48, 48))
    } else {
      const value = n.serviceLabel ? `${n.label}\n${n.serviceLabel}` : n.label
      cells.push(vertex(cid(n.id), value, BOX_STYLE, n.x, n.y, n.w, n.h))
    }
  }

  // --- Data-flow edges (labeled by layer transition) ---
  layout.connectors.forEach((c, i) => {
    const a = byId.get(c.from)
    const b = byId.get(c.to)
    if (!a || !b) return
    if (c.type === 'loop') {
      cells.push(edge(`e_${i}`, cid(c.from), cid(c.to), CTRL_EDGE, 're-query'))
    } else {
      const label = EDGE_LABEL[`${a.layer}>${b.layer}`] ?? ''
      cells.push(edge(`e_${i}`, cid(c.from), cid(c.to), DATA_EDGE, label))
    }
  })

  // --- Agent-centric control edges (the "complete flow across services") ---
  const agent = first((n) => n.layer === 'orchestration' && n.awsServiceId === 'strands_sdk') ?? first((n) => n.layer === 'orchestration')
  const llm = first((n) => n.layer === 'generation')
  const retrievers = all((n) => n.layer === 'retrieval')
  const indexes = all((n) => n.layer === 'index')
  const memory = first((n) => n.layer === 'memory')
  const guardrail = first((n) => n.layer === 'guardrails')
  const gateway = first((n) => n.awsServiceId === 'agentcore_gateway')
  const observability = first((n) => n.awsServiceId === 'agentcore_observability' || n.layer === 'observability')

  let ci = 0
  const addEdge = (from: string, to: string, style: string, label: string) =>
    cells.push(edge(`x_${ci++}`, from, to, style, label))

  const target = agent ?? indexes[0] ?? retrievers[0] ?? llm
  if (target) {
    addEdge('actor', cid(target.id), DATA_EDGE, '1. request')
    addEdge(cid(target.id), 'actor', CTRL_EDGE, 'response')
  }
  if (agent && retrievers[0]) addEdge(cid(agent.id), cid(retrievers[0].id), CTRL_EDGE, 'query')
  if (agent && llm) addEdge(cid(agent.id), cid(llm.id), CTRL_EDGE, 'generate')
  if (memory && agent) addEdge(cid(memory.id), cid(agent.id), CTRL_EDGE, 'recall')
  if (guardrail && llm) addEdge(cid(guardrail.id), cid(llm.id), DATA_EDGE, 'screen I/O')
  if (gateway) indexes.forEach((ix) => addEdge(cid(gateway.id), cid(ix.id), DATA_EDGE, 'tool'))
  if (observability && agent && observability.id !== agent.id) addEdge(cid(agent.id), cid(observability.id), CTRL_EDGE, 'traces')

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
