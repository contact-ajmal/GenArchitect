import type { AwsServiceId, DiagramComponent, LayerId } from '../types'
import { AWS_SERVICES } from '../data/services'

/**
 * The minimal shape the diagram engine needs. A full RagArchitecture satisfies
 * it structurally, and so does a composed architecture from the /compose studio.
 */
export interface DiagramSource {
  name: string
  accentColor: string
  layers: DiagramComponent[]
}

/**
 * Pure, deterministic layout for RAG architecture diagrams. No diagram library:
 * we compute layer bands, node rectangles, and connector paths from the data.
 *
 * The main flow runs left → right through the core layers:
 *   sources → ingestion → index → retrieval → augmentation → generation
 * Cross-cutting layers are rendered as full-width horizontal spines:
 *   orchestration + memory above the flow, guardrails + observability below
 * (the "governance spine" idea). Everything is a function of the component list,
 * so the same code lays out naive RAG and the full secure pattern.
 */

const MAIN_ORDER: LayerId[] = [
  'sources',
  'ingestion',
  'index',
  'retrieval',
  'augmentation',
  'generation',
]
const TOP_SPINES: LayerId[] = ['orchestration', 'memory']
const BOTTOM_SPINES: LayerId[] = ['guardrails', 'observability']

/** Roles whose orchestration node gets a curved "retrieval loop" connector. */
const LOOPING_ROLES = new Set(['planner', 'router', 'supervisor'])

export const LAYER_LABELS: Record<LayerId, string> = {
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

// --- geometry constants (SVG user units) -----------------------------------
const NODE_W = 152
const NODE_H = 62
const NODE_GAP_Y = 14
const COL_W = 180
const COL_GAP = 44
const BAND_HEADER_H = 26
const BAND_PAD_Y = 14
const BAND_GAP = 22
const OUTER_PAD = 24
const SPINE_NODE_GAP = 18

export interface PositionedNode {
  id: string
  label: string
  serviceLabel?: string
  awsServiceId?: AwsServiceId
  note?: string
  layer: LayerId
  x: number
  y: number
  w: number
  h: number
  cx: number
  cy: number
  /** Assembly order (by band) for the mount animation. */
  order: number
  kind: 'flow' | 'spine'
}

export interface LayerBand {
  layer: LayerId
  label: string
  x: number
  y: number
  w: number
  h: number
  order: number
  kind: 'flow' | 'spine'
}

export interface Connector {
  id: string
  from: string
  to: string
  path: string
  type: 'flow' | 'loop'
}

export interface DiagramLayout {
  width: number
  height: number
  bands: LayerBand[]
  nodes: PositionedNode[]
  connectors: Connector[]
}

function stackHeight(count: number): number {
  return count * NODE_H + Math.max(0, count - 1) * NODE_GAP_Y
}

function groupByLayer(
  components: DiagramComponent[],
): Map<LayerId, DiagramComponent[]> {
  const map = new Map<LayerId, DiagramComponent[]>()
  for (const c of components) {
    const list = map.get(c.layer)
    if (list) list.push(c)
    else map.set(c.layer, [c])
  }
  return map
}

function serviceLabelFor(component: DiagramComponent): string | undefined {
  return component.awsServiceId
    ? AWS_SERVICES[component.awsServiceId]?.name
    : undefined
}

/** Cubic bezier from a node's right edge to the next node's left edge. */
function flowPath(a: PositionedNode, b: PositionedNode): string {
  const x1 = a.x + a.w
  const y1 = a.cy
  const x2 = b.x
  const y2 = b.cy
  const mx = (x1 + x2) / 2
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`
}

/** Curved feedback loop from a retrieval node up to the orchestrating node. */
function loopPath(retrieval: PositionedNode, orch: PositionedNode): string {
  const x1 = retrieval.cx
  const y1 = retrieval.y // top of retrieval node
  const x2 = orch.cx
  const y2 = orch.y + orch.h // bottom of orchestration node
  const lift = Math.max(70, (y1 - y2) * 0.6)
  return `M ${x1} ${y1} C ${x1} ${y1 - lift}, ${x2} ${y2 + lift}, ${x2} ${y2}`
}

export function computeLayout(arch: DiagramSource): DiagramLayout {
  const byLayer = groupByLayer(arch.layers)

  const mainLayers = MAIN_ORDER.filter((l) => (byLayer.get(l)?.length ?? 0) > 0)
  const topSpines = TOP_SPINES.filter((l) => (byLayer.get(l)?.length ?? 0) > 0)
  const bottomSpines = BOTTOM_SPINES.filter(
    (l) => (byLayer.get(l)?.length ?? 0) > 0,
  )

  // Width: the wider of the main-column block and the widest spine row.
  const mainBlockW =
    mainLayers.length * COL_W + Math.max(0, mainLayers.length - 1) * COL_GAP
  const spineLayers = [...topSpines, ...bottomSpines]
  const maxSpineNodes = spineLayers.reduce(
    (m, l) => Math.max(m, byLayer.get(l)?.length ?? 0),
    0,
  )
  const spineRowW =
    maxSpineNodes * NODE_W + Math.max(0, maxSpineNodes - 1) * SPINE_NODE_GAP
  const innerW = Math.max(mainBlockW, spineRowW)
  const width = innerW + OUTER_PAD * 2
  const mainStartX = OUTER_PAD + (innerW - mainBlockW) / 2

  const flowH = mainLayers.reduce(
    (m, l) => Math.max(m, stackHeight(byLayer.get(l)!.length)),
    NODE_H,
  )

  const bands: LayerBand[] = []
  const nodes: PositionedNode[] = []
  let order = 0
  let y = OUTER_PAD

  const placeSpine = (layer: LayerId) => {
    const comps = byLayer.get(layer)!
    const bandH = BAND_HEADER_H + NODE_H + BAND_PAD_Y
    bands.push({
      layer,
      label: LAYER_LABELS[layer],
      x: OUTER_PAD,
      y,
      w: innerW,
      h: bandH,
      order,
      kind: 'spine',
    })
    const m = comps.length
    const totalNodesW = m * NODE_W
    const gap = (innerW - totalNodesW) / (m + 1)
    const nodeY = y + BAND_HEADER_H
    comps.forEach((c, i) => {
      const x = OUTER_PAD + gap * (i + 1) + i * NODE_W
      nodes.push({
        id: c.id,
        label: c.label,
        serviceLabel: serviceLabelFor(c),
        awsServiceId: c.awsServiceId,
        note: c.note,
        layer,
        x,
        y: nodeY,
        w: NODE_W,
        h: NODE_H,
        cx: x + NODE_W / 2,
        cy: nodeY + NODE_H / 2,
        order,
        kind: 'spine',
      })
    })
    order += 1
    y += bandH + BAND_GAP
  }

  // Top spines.
  topSpines.forEach(placeSpine)

  // Main flow columns.
  const flowTop = y
  const flowRegionH = BAND_HEADER_H + flowH
  const flowCenterY = flowTop + BAND_HEADER_H + flowH / 2
  mainLayers.forEach((layer, c) => {
    const comps = byLayer.get(layer)!
    const colX = mainStartX + c * (COL_W + COL_GAP)
    bands.push({
      layer,
      label: LAYER_LABELS[layer],
      x: colX,
      y: flowTop,
      w: COL_W,
      h: flowRegionH,
      order,
      kind: 'flow',
    })
    const stackH = stackHeight(comps.length)
    const startY = flowCenterY - stackH / 2
    const nodeX = colX + (COL_W - NODE_W) / 2
    comps.forEach((comp, i) => {
      const ny = startY + i * (NODE_H + NODE_GAP_Y)
      nodes.push({
        id: comp.id,
        label: comp.label,
        serviceLabel: serviceLabelFor(comp),
        awsServiceId: comp.awsServiceId,
        note: comp.note,
        layer,
        x: nodeX,
        y: ny,
        w: NODE_W,
        h: NODE_H,
        cx: nodeX + NODE_W / 2,
        cy: ny + NODE_H / 2,
        order: order + c, // stagger columns left → right
        kind: 'flow',
      })
    })
  })
  order += mainLayers.length
  y = flowTop + flowRegionH + BAND_GAP

  // Bottom spines.
  bottomSpines.forEach(placeSpine)

  const height = y - BAND_GAP + OUTER_PAD

  // --- connectors ----------------------------------------------------------
  const nodeById = new Map(nodes.map((n) => [n.id, n]))
  const connectors: Connector[] = []

  for (let i = 0; i < mainLayers.length - 1; i++) {
    const a = byLayer.get(mainLayers[i])!
    const b = byLayer.get(mainLayers[i + 1])!
    for (let ai = 0; ai < a.length; ai++) {
      // Map A→B: 1:1 when equal, fan when one side is singular, else nearest.
      const targets: number[] =
        a.length === b.length
          ? [ai]
          : b.length === 1
            ? [0]
            : a.length === 1
              ? b.map((_, bi) => bi)
              : [Math.min(ai, b.length - 1)]
      for (const bi of targets) {
        const from = nodeById.get(a[ai].id)!
        const to = nodeById.get(b[bi].id)!
        connectors.push({
          id: `${from.id}__${to.id}`,
          from: from.id,
          to: to.id,
          path: flowPath(from, to),
          type: 'flow',
        })
      }
    }
  }

  // Retrieval feedback loop for agentic-style orchestrators.
  const orchComps = byLayer.get('orchestration') ?? []
  const loopOrch = orchComps.find((c) => LOOPING_ROLES.has(c.role))
  const retrievalComps = byLayer.get('retrieval') ?? []
  if (loopOrch && retrievalComps.length) {
    const orchNode = nodeById.get(loopOrch.id)!
    const retNode = nodeById.get(retrievalComps[0].id)!
    connectors.push({
      id: `loop__${retNode.id}__${orchNode.id}`,
      from: retNode.id,
      to: orchNode.id,
      path: loopPath(retNode, orchNode),
      type: 'loop',
    })
  }

  return { width, height, bands, nodes, connectors }
}
