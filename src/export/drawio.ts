import type { AwsServiceId } from '../types'
import { computeLayout, type DiagramSource } from '../lib/layout'
import { downloadBlob } from './scaffold'

/**
 * Generate a draw.io / diagrams.net template (mxGraph XML) from a diagram
 * source, reusing the app's deterministic layout engine so the exported diagram
 * matches what's shown on screen. AWS services render as official AWS shapes
 * (aws4 shape library); framework/AgentCore pieces render as clean labeled
 * boxes. The user pastes the XML via Extras → Edit Diagram, or opens the
 * downloaded .drawio file directly.
 */

interface AwsIcon {
  resIcon: string
  fill: string
}

// Category colors follow the AWS icon palette. resIcon names target the aws4
// (AWS 2019+) shape set bundled with draw.io. Services without a shape fall
// back to a labeled box, so the diagram is always valid and editable.
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
    'verticalAlign=top;align=center;html=1;fontSize=11;fontStyle=0;aspect=fixed;' +
    `shape=mxgraph.aws4.resourceIcon;resIcon=${icon.resIcon};`
  )
}

const BOX_STYLE =
  'rounded=1;whiteSpace=wrap;html=1;arcSize=14;fillColor=#F2F3F3;strokeColor=#5A6B86;fontColor=#232F3E;fontSize=12;'
const LABEL_STYLE =
  'text;html=1;align=left;verticalAlign=middle;fontColor=#879196;fontSize=10;fontStyle=1;'
const FLOW_EDGE =
  'edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=block;strokeColor=#5A6B86;'
const LOOP_EDGE =
  'edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;endArrow=block;dashed=1;strokeColor=#14B8A6;'

const LAYER_LABELS: Record<string, string> = {
  sources: 'SOURCES',
  ingestion: 'INGESTION',
  index: 'INDEX',
  retrieval: 'RETRIEVAL',
  augmentation: 'AUGMENTATION',
  generation: 'GENERATION',
  guardrails: 'GUARDRAILS',
  memory: 'MEMORY',
  orchestration: 'ORCHESTRATION',
  observability: 'OBSERVABILITY',
}

export function toDrawioXml(source: DiagramSource): string {
  const layout = computeLayout(source)
  const cells: string[] = []

  // Band labels (helps the exported diagram read like the on-screen one).
  layout.bands.forEach((band, i) => {
    const label = LAYER_LABELS[band.layer] ?? band.layer.toUpperCase()
    cells.push(
      `<mxCell id="band_${i}" value="${esc(label)}" style="${LABEL_STYLE}" vertex="1" parent="1">` +
        `<mxGeometry x="${Math.round(band.x + 6)}" y="${Math.round(band.y + 4)}" width="${Math.round(band.w - 12)}" height="16" as="geometry"/>` +
        `</mxCell>`,
    )
  })

  // Nodes.
  for (const n of layout.nodes) {
    const icon = n.awsServiceId ? AWS_ICON[n.awsServiceId] : undefined
    if (icon) {
      const x = Math.round(n.cx - 24)
      const y = Math.round(n.cy - 24)
      cells.push(
        `<mxCell id="${cid(n.id)}" value="${esc(n.label)}" style="${iconStyle(icon)}" vertex="1" parent="1">` +
          `<mxGeometry x="${x}" y="${y}" width="48" height="48" as="geometry"/>` +
          `</mxCell>`,
      )
    } else {
      const value = n.serviceLabel ? `${n.label}\n(${n.serviceLabel})` : n.label
      cells.push(
        `<mxCell id="${cid(n.id)}" value="${esc(value)}" style="${BOX_STYLE}" vertex="1" parent="1">` +
          `<mxGeometry x="${Math.round(n.x)}" y="${Math.round(n.y)}" width="${Math.round(n.w)}" height="${Math.round(n.h)}" as="geometry"/>` +
          `</mxCell>`,
      )
    }
  }

  // Edges.
  layout.connectors.forEach((c, i) => {
    const style = c.type === 'loop' ? LOOP_EDGE : FLOW_EDGE
    cells.push(
      `<mxCell id="e_${i}" style="${style}" edge="1" parent="1" source="${cid(c.from)}" target="${cid(c.to)}">` +
        `<mxGeometry relative="1" as="geometry"/>` +
        `</mxCell>`,
    )
  })

  const w = Math.round(layout.width)
  const h = Math.round(layout.height)

  return `<mxfile host="app.diagrams.net" type="device">
  <diagram name="${esc(source.name)}" id="genarchitect">
    <mxGraphModel dx="${w}" dy="${h}" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${w + 80}" pageHeight="${h + 80}" math="0" shadow="0">
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
