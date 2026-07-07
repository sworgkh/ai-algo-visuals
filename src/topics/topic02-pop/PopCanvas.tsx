import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { CausalLink, Plan, Threat } from '@/lib/pop'
import { FINISH, START } from '@/lib/pop'
import { arrowHead, clippedSegment } from '@/lib/graph'
import type { GraphNode, Point } from '@/lib/graph'
import './PopCanvas.css'

const NODE_W = 158
const NODE_H = 56
const COL_W = 226
const ROW_H = 150
const PAD = 34

export interface PopCanvasProps {
  plan: Plan
  /** Causal link to spotlight (e.g. the one just added). */
  highlightLink?: CausalLink | null
  /** Active threat to flash (clobberer → protected link). */
  threat?: Threat | null
  selectedStep?: string | null
  onSelectStep?: (id: string) => void
}

interface Positioned {
  id: string
  label: string
  x: number
  y: number
  layer: number
}

/** One drawn edge per (from,to) pair, carrying all the literals it protects. */
interface LinkGroup {
  from: string
  to: string
  literals: string[]
  threatened: boolean
  spotlight: boolean
}

/** Longest-path layering from Start, distributing same-layer nodes vertically. */
function layoutPlan(plan: Plan): { nodes: Positioned[]; width: number; height: number } {
  const ids = Object.keys(plan.steps)
  const layer: Record<string, number> = Object.fromEntries(ids.map((id) => [id, 0]))
  for (let iter = 0; iter <= ids.length; iter++) {
    let changed = false
    for (const [a, b] of plan.orderings) {
      if (layer[b] < layer[a] + 1) {
        layer[b] = layer[a] + 1
        changed = true
      }
    }
    if (!changed) break
  }
  const maxLayer = Math.max(0, ...Object.values(layer))
  layer[FINISH] = maxLayer // keep Finish rightmost

  const byLayer = new Map<number, string[]>()
  for (const id of ids) byLayer.set(layer[id], [...(byLayer.get(layer[id]) ?? []), id])
  const maxRows = Math.max(...[...byLayer.values()].map((c) => c.length))

  const nodes: Positioned[] = ids.map((id) => {
    const col = byLayer.get(layer[id])!.sort()
    const row = col.indexOf(id)
    const colOffset = ((maxRows - col.length) * ROW_H) / 2
    return {
      id,
      label: plan.steps[id].label,
      x: PAD + layer[id] * COL_W,
      y: PAD + colOffset + row * ROW_H,
      layer: layer[id],
    }
  })

  const width = PAD * 2 + maxLayer * COL_W + NODE_W
  const height = PAD * 2 + Math.max(1, maxRows) * ROW_H - (ROW_H - NODE_H)
  return { nodes, width, height }
}

const centerOf = (n: Positioned): GraphNode => ({
  id: n.id,
  x: n.x + NODE_W / 2,
  y: n.y + NODE_H / 2,
  r: NODE_W / 2,
})

export function PopCanvas({
  plan,
  highlightLink,
  threat,
  selectedStep,
  onSelectStep,
}: PopCanvasProps) {
  const { nodes, width, height } = useMemo(() => layoutPlan(plan), [plan])
  const pos = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])

  // Collapse parallel causal links (same from→to) into one labelled edge.
  const groups = useMemo<LinkGroup[]>(() => {
    const map = new Map<string, LinkGroup>()
    for (const l of plan.links) {
      const key = `${l.from}>${l.to}`
      const g =
        map.get(key) ??
        ({ from: l.from, to: l.to, literals: [], threatened: false, spotlight: false } as LinkGroup)
      g.literals.push(l.literal)
      if (threat && sameLink(l, threat.link)) g.threatened = true
      if (sameLink(l, highlightLink)) g.spotlight = true
      map.set(key, g)
    }
    return [...map.values()]
  }, [plan.links, threat, highlightLink])

  const groupKeys = new Set(groups.map((g) => `${g.from}>${g.to}`))
  const orderingEdges = plan.orderings.filter(([a, b]) => !groupKeys.has(`${a}>${b}`))
  const cy = height / 2

  return (
    <div className="pop-canvas-wrap">
      <svg
        className="pop-canvas"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Partial-order plan"
      >
        {/* faint ordering edges */}
        <g className="pc-orderings">
          {orderingEdges.map(([a, b]) => {
            const na = pos.get(a)
            const nb = pos.get(b)
            if (!na || !nb) return null
            const { start, end } = clippedSegment(centerOf(na), centerOf(nb), 3)
            return (
              <line key={`o-${a}-${b}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} className="pc-ordering" />
            )
          })}
        </g>

        {/* causal-link lines (labels drawn later, on top of nodes) */}
        <g className="pc-links">
          {groups.map((g) => {
            const na = pos.get(g.from)
            const nb = pos.get(g.to)
            if (!na || !nb) return null
            const seg = clippedSegment(centerOf(na), centerOf(nb), 7)
            const spanTwo = Math.abs(na.layer - nb.layer) >= 2
            const geom = edgeGeom(seg.start, seg.end, spanTwo, cy)
            return (
              <motion.g
                key={`l-${g.from}-${g.to}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`pc-link${g.threatened ? ' is-threatened' : ''}${g.spotlight ? ' is-spotlight' : ''}`}
              >
                <path d={geom.d} fill="none" />
                <polygon points={arrowHead(seg.end, geom.endAngle, 9)} />
              </motion.g>
            )
          })}
        </g>

        {/* threat arrow */}
        {threat &&
          (() => {
            const nc = pos.get(threat.clobberer)
            const nl = pos.get(threat.link.to)
            if (!nc || !nl) return null
            const seg = clippedSegment(centerOf(nc), centerOf(nl), 7)
            return (
              <motion.g
                className="pc-threat"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              >
                <line x1={seg.start.x} y1={seg.start.y} x2={seg.end.x} y2={seg.end.y} strokeDasharray="5 6" />
                <polygon points={arrowHead(seg.end, Math.atan2(seg.end.y - seg.start.y, seg.end.x - seg.start.x), 10)} />
              </motion.g>
            )
          })()}

        {/* nodes */}
        <g className="pc-nodes">
          {nodes.map((n) => {
            const step = plan.steps[n.id]
            const openCount = plan.open.filter((o) => o.step === n.id).length
            const isEndpoint = n.id === START || n.id === FINISH
            const isThreatClobberer = threat?.clobberer === n.id
            return (
              <g
                key={n.id}
                className={`pc-node${isEndpoint ? ' is-endpoint' : ''}${selectedStep === n.id ? ' is-selected' : ''}${isThreatClobberer ? ' is-clobberer' : ''}`}
                style={{ transform: `translate(${n.x}px, ${n.y}px)` }}
                onClick={() => onSelectStep?.(n.id)}
              >
                <rect width={NODE_W} height={NODE_H} rx={11} className="pc-node-box" />
                <text className="pc-node-label mono" x={NODE_W / 2} y={NODE_H / 2} dy="4.5" textAnchor="middle">
                  {step.label}
                </text>
                {openCount > 0 && (
                  <g className="pc-open-badge" transform={`translate(${NODE_W - 13}, 13)`}>
                    <circle r={11} />
                    <text textAnchor="middle" dy="3.5">
                      {openCount}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </g>

        {/* causal-link labels — on top so nodes never occlude them */}
        <g className="pc-link-labels">
          {groups.map((g) => {
            const na = pos.get(g.from)
            const nb = pos.get(g.to)
            if (!na || !nb) return null
            const seg = clippedSegment(centerOf(na), centerOf(nb), 7)
            const spanTwo = Math.abs(na.layer - nb.layer) >= 2
            const geom = edgeGeom(seg.start, seg.end, spanTwo, cy)
            return (
              <EdgeLabel
                key={`ll-${g.from}-${g.to}`}
                at={geom.labelAt}
                literals={g.literals}
                threatened={g.threatened}
              />
            )
          })}
        </g>
      </svg>
    </div>
  )
}

/** Straight for adjacent layers; a gentle bow (away from the vertical centre) for
 *  long spans so the edge routes around any node it would otherwise cross. */
function edgeGeom(
  start: Point,
  end: Point,
  bow: boolean,
  cy: number,
): { d: string; endAngle: number; labelAt: Point } {
  const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
  if (!bow) {
    return {
      d: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
      endAngle: Math.atan2(end.y - start.y, end.x - start.x),
      labelAt: mid,
    }
  }
  const dir = mid.y <= cy ? -1 : 1 // bow away from centre
  const ctrl = { x: mid.x, y: mid.y + dir * 52 }
  const labelAt = {
    x: (start.x + 2 * ctrl.x + end.x) / 4,
    y: (start.y + 2 * ctrl.y + end.y) / 4,
  }
  return {
    d: `M ${start.x} ${start.y} Q ${ctrl.x} ${ctrl.y} ${end.x} ${end.y}`,
    endAngle: Math.atan2(end.y - ctrl.y, end.x - ctrl.x),
    labelAt,
  }
}

function EdgeLabel({
  at,
  literals,
  threatened,
}: {
  at: Point
  literals: string[]
  threatened: boolean
}) {
  const lineH = 14
  const maxLen = Math.max(...literals.map((l) => l.length))
  const w = maxLen * 6.6 + 14
  const h = literals.length * lineH + 8
  return (
    <g transform={`translate(${at.x}, ${at.y})`} className={`pc-lbl${threatened ? ' is-threatened' : ''}`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={5} className="pc-lbl-bg" />
      <text textAnchor="middle" className="pc-lbl-text mono">
        {literals.map((lit, i) => (
          <tspan key={lit} x={0} y={-h / 2 + 6 + lineH * (i + 0.5)}>
            {lit}
          </tspan>
        ))}
      </text>
    </g>
  )
}

function sameLink(a: CausalLink, b: CausalLink | null | undefined): boolean {
  return !!b && a.from === b.from && a.to === b.to && a.literal === b.literal
}
