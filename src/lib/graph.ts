import { curveBasis, line as d3line } from 'd3'

/**
 * Small SVG-graph geometry helpers shared by the graph-flavoured topics
 * (POP canvas, Bayesian network, HTN tree, Viterbi trellis…). Topics place
 * their own nodes (the graphs are small and hand-authored); this module owns
 * the fiddly edge geometry: clipping edges to node borders, arrowheads, and
 * smooth multi-point paths.
 */

export interface Point {
  x: number
  y: number
}

export interface GraphNode extends Point {
  id: string
  label?: string
  /** Collision radius used to clip incoming/outgoing edges. */
  r?: number
}

export interface GraphEdge {
  source: string
  target: string
  label?: string
}

const DEFAULT_R = 22

/** Euclidean distance. */
export function dist(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

/** Point `d` px along the segment a→b from `a`. */
export function along(a: Point, b: Point, d: number): Point {
  const len = dist(a, b) || 1
  const t = d / len
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

/**
 * Straight edge clipped to each node's radius so the line touches the border,
 * not the center — leaving room for an arrowhead at the target end.
 */
export function clippedSegment(
  source: GraphNode,
  target: GraphNode,
  gap = 6,
): { start: Point; end: Point; angle: number } {
  const sr = (source.r ?? DEFAULT_R) + gap
  const tr = (target.r ?? DEFAULT_R) + gap
  const start = along(source, target, sr)
  const end = along(target, source, tr)
  const angle = Math.atan2(end.y - start.y, end.x - start.x)
  return { start, end, angle }
}

/** SVG `points` string for a triangular arrowhead at `p`, pointing along `angle`. */
export function arrowHead(p: Point, angle: number, size = 8): string {
  const a1 = angle + Math.PI * 0.82
  const a2 = angle - Math.PI * 0.82
  const p1 = { x: p.x + Math.cos(a1) * size, y: p.y + Math.sin(a1) * size }
  const p2 = { x: p.x + Math.cos(a2) * size, y: p.y + Math.sin(a2) * size }
  return `${p.x},${p.y} ${p1.x},${p1.y} ${p2.x},${p2.y}`
}

/** Midpoint of an edge (handy for placing edge labels). */
export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

const smooth = d3line<Point>()
  .x((p) => p.x)
  .y((p) => p.y)
  .curve(curveBasis)

/** Smooth SVG path `d` through a list of points (curved causal links, arcs). */
export function curvedPath(points: Point[]): string {
  return smooth(points) ?? ''
}

/**
 * Evenly distribute `n` items across `cols` columns at the given cell size —
 * a quick starting grid for laying out small node sets.
 */
export function gridLayout(
  n: number,
  cols: number,
  cell: { w: number; h: number },
  origin: Point = { x: 0, y: 0 },
): Point[] {
  return Array.from({ length: n }, (_, i) => ({
    x: origin.x + (i % cols) * cell.w,
    y: origin.y + Math.floor(i / cols) * cell.h,
  }))
}
