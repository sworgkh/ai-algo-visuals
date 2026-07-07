import { NODE_LABELS, NODE_POS } from './domain'
import './BayesNetCanvas.css'

const W = 520
const H = 384
const NODE_W = 104
const NODE_H = 38

export interface CanvasNode {
  name: string
  parents: string[]
}

export interface BayesNetCanvasProps {
  nodes: CanvasNode[]
  /** Extra class per node id (for highlighting). */
  nodeClass?: (name: string) => string
  /** Class for an arc, given its endpoints. */
  arcClass?: (from: string, to: string) => string
  onNodeEnter?: (name: string) => void
  onNodeLeave?: () => void
  onNodeClick?: (name: string) => void
}

const cx = (name: string) => NODE_POS[name].x * W
const cy = (name: string) => NODE_POS[name].y * H

/** Point on the border of the target node rect toward the source. */
function edgePoints(from: string, to: string) {
  const x1 = cx(from)
  const y1 = cy(from)
  const x2 = cx(to)
  const y2 = cy(to)
  const ang = Math.atan2(y2 - y1, x2 - x1)
  const clip = (x: number, y: number, dir: number) => ({
    x: x + Math.cos(ang) * dir * (NODE_W / 2 + 3) * Math.abs(Math.cos(ang) > 0.3 ? 1 : 0.55),
    y: y + Math.sin(ang) * dir * (NODE_H / 2 + 3),
  })
  return { start: clip(x1, y1, 1), end: clip(x2, y2, -1), ang }
}

export function BayesNetCanvas({
  nodes,
  nodeClass,
  arcClass,
  onNodeEnter,
  onNodeLeave,
  onNodeClick,
}: BayesNetCanvasProps) {
  return (
    <div className="bnc-wrap">
      <svg className="bnc" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Bayesian network">
        <defs>
          <marker id="bnc-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
            <path d="M0,0 L9,4.5 L0,9 z" fill="var(--border-strong)" />
          </marker>
        </defs>
        <g className="bnc-arcs">
          {nodes.flatMap((n) =>
            n.parents.map((p) => {
              const { start, end } = edgePoints(p, n.name)
              return (
                <line
                  key={`${p}-${n.name}`}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  className={`bnc-arc${arcClass ? ` ${arcClass(p, n.name)}` : ''}`}
                  markerEnd="url(#bnc-arrow)"
                />
              )
            }),
          )}
        </g>
        <g className="bnc-nodes">
          {nodes.map((n) => (
            <g
              key={n.name}
              className={`bnc-node${nodeClass ? ` ${nodeClass(n.name)}` : ''}`}
              transform={`translate(${cx(n.name) - NODE_W / 2}, ${cy(n.name) - NODE_H / 2})`}
              onMouseEnter={() => onNodeEnter?.(n.name)}
              onMouseLeave={() => onNodeLeave?.()}
              onClick={() => onNodeClick?.(n.name)}
            >
              <rect width={NODE_W} height={NODE_H} rx={10} className="bnc-node-box" />
              <text x={NODE_W / 2} y={NODE_H / 2} dy="4.5" textAnchor="middle" className="bnc-node-label">
                {NODE_LABELS[n.name] ?? n.name}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}
