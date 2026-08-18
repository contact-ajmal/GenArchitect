import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import clsx from 'clsx'
import {
  computeLayout,
  type Connector,
  type DiagramSource,
  type LayerBand,
  type PositionedNode,
} from '../../lib/layout'
import AwsServiceIcon from '../aws/AwsServiceIcon'
import { SERVICE_ICON_FILE } from '../../config/brand'

export interface RagDiagramProps {
  architecture: DiagramSource
  /** Node ids to emphasize; others dim. Empty/undefined = all normal. */
  highlightedComponentIds?: string[]
  /** Override the highlight glow color (e.g. amber for a missing component). */
  glowColor?: string
  className?: string
}

function BandRect({ band, delay }: { band: LayerBand; delay: number }) {
  const isSpine = band.kind === 'spine'
  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.3 }}
    >
      <rect
        x={band.x}
        y={band.y}
        width={band.w}
        height={band.h}
        rx={12}
        className={clsx(
          isSpine ? 'fill-neutral-100/60' : 'fill-neutral-50',
          'stroke-neutral-200',
        )}
        strokeWidth={1}
      />
      <text
        x={band.x + 12}
        y={band.y + 16}
        className="fill-ink-muted font-mono"
        style={{ fontSize: 10, letterSpacing: '0.14em' }}
      >
        {band.label.toUpperCase()}
      </text>
    </motion.g>
  )
}

function ConnectorPath({
  connector,
  dimmed,
  reduce,
}: {
  connector: Connector
  dimmed: boolean
  reduce: boolean
}) {
  const isLoop = connector.type === 'loop'
  return (
    <g style={{ opacity: dimmed ? 0.12 : 1 }} className="transition-opacity duration-300">
      {/* base line */}
      <path
        d={connector.path}
        fill="none"
        className={isLoop ? 'stroke-accent/50' : 'stroke-neutral-300'}
        strokeWidth={isLoop ? 1.5 : 1.5}
        strokeDasharray={isLoop ? '2 6' : undefined}
      />
      {/* animated dataflow overlay */}
      {!reduce && (
        <path
          d={connector.path}
          fill="none"
          className={clsx(
            isLoop ? 'stroke-accent diagram-loop-path' : 'stroke-signal diagram-flow-path',
          )}
          strokeWidth={1.5}
          markerEnd={isLoop ? undefined : 'url(#diagram-arrow)'}
        />
      )}
    </g>
  )
}

function NodeCard({
  node,
  accent,
  glow,
  highlighted,
  dimmed,
  delay,
  reduce,
}: {
  node: PositionedNode
  accent: string
  glow: string
  highlighted: boolean
  dimmed: boolean
  delay: number
  reduce: boolean
}) {
  return (
    <motion.g
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
    >
      <foreignObject x={node.x} y={node.y} width={node.w} height={node.h}>
        <div
          title={node.note}
          className={clsx(
            'flex h-full items-center gap-1.5 overflow-hidden rounded-lg border bg-neutral-0 px-2 transition-all duration-300',
            highlighted ? 'border-transparent' : 'border-hairline',
            dimmed && 'opacity-40 grayscale',
          )}
          style={{
            borderLeft: `3px solid ${highlighted ? glow : accent}`,
            transform: highlighted ? 'scale(1.03)' : undefined,
            boxShadow: highlighted
              ? `0 0 0 2px ${glow}, 0 8px 24px ${glow}33`
              : undefined,
          }}
        >
          {node.awsServiceId ? (
            <AwsServiceIcon
              iconId={SERVICE_ICON_FILE[node.awsServiceId]}
              name={node.serviceLabel ?? node.label}
              size={18}
              className="shrink-0 opacity-90"
            />
          ) : null}
          <div className="min-w-0">
            <div className="line-clamp-2 text-[11px] font-medium leading-tight text-ink">
              {node.label}
            </div>
            {node.serviceLabel ? (
              <div className="truncate font-mono text-[9px] uppercase tracking-wide text-ink-muted">
                {node.serviceLabel}
              </div>
            ) : null}
          </div>
        </div>
      </foreignObject>
    </motion.g>
  )
}

/**
 * Hand-built layered SVG diagram. Bands + connectors are SVG; nodes are HTML
 * cards (foreignObject) for crisp text and easy highlight/dim styling. The
 * `highlightedComponentIds` prop drives the diagram↔code sync.
 */
export default function RagDiagram({
  architecture,
  highlightedComponentIds,
  glowColor,
  className,
}: RagDiagramProps) {
  const reduce = useReducedMotion() ?? false
  const layout = useMemo(() => computeLayout(architecture), [architecture])
  const accent = architecture.accentColor
  const glow = glowColor ?? accent

  const hlSet = useMemo(
    () => new Set(highlightedComponentIds ?? []),
    [highlightedComponentIds],
  )
  const hlActive = hlSet.size > 0

  const connectorsDelay = reduce ? 0 : 0.25

  return (
    <svg
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      className={clsx('h-auto w-full', className)}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`${architecture.name} architecture diagram`}
    >
      <defs>
        <marker
          id="diagram-arrow"
          viewBox="0 0 8 8"
          refX={7}
          refY={4}
          markerWidth={6}
          markerHeight={6}
          orient="auto-start-reverse"
        >
          <path d="M0 0 L8 4 L0 8 z" fill={accent} />
        </marker>
      </defs>

      {/* Layer bands */}
      {layout.bands.map((band) => (
        <BandRect
          key={`${band.layer}-${band.x}`}
          band={band}
          delay={reduce ? 0 : band.order * 0.1}
        />
      ))}

      {/* Connectors */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: connectorsDelay, duration: 0.3 }}
      >
        {layout.connectors.map((c) => {
          const bothHl = hlSet.has(c.from) && hlSet.has(c.to)
          return (
            <ConnectorPath
              key={c.id}
              connector={c}
              dimmed={hlActive && !bothHl}
              reduce={reduce}
            />
          )
        })}
      </motion.g>

      {/* Nodes */}
      {layout.nodes.map((node) => (
        <NodeCard
          key={node.id}
          node={node}
          accent={accent}
          glow={glow}
          highlighted={hlSet.has(node.id)}
          dimmed={hlActive && !hlSet.has(node.id)}
          delay={reduce ? 0 : 0.15 + node.order * 0.08}
          reduce={reduce}
        />
      ))}
    </svg>
  )
}
