import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import clsx from 'clsx'
import type { LoopStage } from '../../atlas/types'
import { Button } from '../ui'

export interface AnimatedLoopProps {
  stages: LoopStage[]
}

const SIZE = 460
const C = SIZE / 2
const R = 158
const STEP_MS = 2100

/**
 * A looping cycle visualization — the stages sit on a ring, the active stage
 * animates around it, and a detail panel explains each. Step-through controls;
 * under reduced motion it never auto-advances (manual stepping only).
 */
export default function AnimatedLoop({ stages }: AnimatedLoopProps) {
  const reduce = useReducedMotion() ?? false
  const n = stages.length
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(!reduce)

  useEffect(() => {
    if (!playing || reduce || n < 2) return
    const t = setInterval(() => setActive((i) => (i + 1) % n), STEP_MS)
    return () => clearInterval(t)
  }, [playing, reduce, n])

  const pos = (i: number) => {
    const angle = (-90 + (i * 360) / n) * (Math.PI / 180)
    return { x: C + R * Math.cos(angle), y: C + R * Math.sin(angle) }
  }

  const go = (i: number) => {
    setPlaying(false)
    setActive((i + n) % n)
  }

  const stage = stages[active]

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:items-center">
      <div>
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="mx-auto h-auto w-full max-w-md"
          role="img"
          aria-label="Agent loop cycle"
        >
          {/* the ring */}
          <circle
            cx={C}
            cy={C}
            r={R}
            fill="none"
            className="stroke-neutral-200"
            strokeWidth={1.5}
            strokeDasharray="3 5"
          />
          {/* directional chords between consecutive stages */}
          {stages.map((_, i) => {
            const a = pos(i)
            const b = pos((i + 1) % n)
            const isActiveEdge = i === active
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className={isActiveEdge ? 'stroke-accent' : 'stroke-neutral-200'}
                strokeWidth={isActiveEdge ? 2 : 1}
                markerEnd="url(#loop-arrow)"
                opacity={isActiveEdge ? 1 : 0.5}
              />
            )
          })}
          <defs>
            <marker id="loop-arrow" viewBox="0 0 8 8" refX={6} refY={4} markerWidth={5} markerHeight={5} orient="auto-start-reverse">
              <path d="M0 0 L8 4 L0 8 z" className="fill-neutral-300" />
            </marker>
          </defs>

          {/* center label */}
          <text x={C} y={C - 6} textAnchor="middle" className="fill-ink font-display" style={{ fontSize: 15, fontWeight: 600 }}>
            {String(active + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
          </text>
          <text x={C} y={C + 14} textAnchor="middle" className="fill-ink-muted font-mono" style={{ fontSize: 10 }}>
            {stage.message ?? 'reasoning cycle'}
          </text>

          {/* stage nodes */}
          {stages.map((s, i) => {
            const p = pos(i)
            const isActive = i === active
            return (
              <foreignObject key={s.id} x={p.x - 62} y={p.y - 27} width={124} height={54}>
                <motion.button
                  type="button"
                  onClick={() => go(i)}
                  aria-pressed={isActive}
                  aria-label={`${s.label} — step ${i + 1}`}
                  animate={reduce ? {} : { scale: isActive ? 1.06 : 1 }}
                  transition={{ duration: 0.3 }}
                  className={clsx(
                    'flex h-full w-full items-center justify-center rounded-lg border px-2 text-center text-[12px] font-medium leading-tight transition-colors',
                    isActive
                      ? 'border-transparent bg-neutral-0 text-ink shadow-[0_0_0_2px_rgb(20_184_166),0_8px_20px_rgb(20_184_166_/_0.2)]'
                      : 'border-hairline bg-neutral-0 text-ink-soft hover:border-neutral-300',
                  )}
                >
                  {s.label}
                </motion.button>
              </foreignObject>
            )
          })}
        </svg>

        <div className="mt-3 flex items-center justify-center gap-2">
          {!reduce ? (
            <Button size="sm" variant={playing ? 'primary' : 'subtle'} onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Play'}>
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {playing ? 'Pause' : 'Play'}
            </Button>
          ) : null}
          <Button size="sm" variant="subtle" onClick={() => go(active - 1)} aria-label="Previous stage">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="subtle" onClick={() => go(active + 1)} aria-label="Next stage">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* detail */}
      <div className="rounded-xl border border-hairline bg-neutral-0 p-5" aria-live="polite">
        <p className="font-mono text-[11px] uppercase tracking-wide text-accent-strong">
          Stage {active + 1} · {stage.label}
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-ink">{stage.plain}</p>
        {stage.technical ? (
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{stage.technical}</p>
        ) : null}
      </div>
    </div>
  )
}
