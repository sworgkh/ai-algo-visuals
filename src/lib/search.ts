/**
 * Grid pathfinding as a single best-first search parameterized by strategy:
 * BFS (FIFO), DFS (LIFO), UCS (min g), Greedy (min h), A* (min g+h). 4-connected,
 * unit step cost, Manhattan heuristic (admissible & consistent on this grid).
 * Records a step-by-step trace (frontier / explored / expanded node) for the UI.
 * Pure and synchronous for testing.
 */

export type Coord = [number, number]
export type Strategy = 'bfs' | 'dfs' | 'ucs' | 'greedy' | 'astar'

export const key = (r: number, c: number) => `${r},${c}`

export interface Grid {
  rows: number
  cols: number
  walls: Set<string>
  start: Coord
  goal: Coord
}

interface Node {
  r: number
  c: number
  g: number
  h: number
  parent: string | null
}

export interface SearchStep {
  /** The node expanded (popped) this step. */
  popped: Coord
  /** Frontier cells after expanding `popped`. */
  frontier: Coord[]
  /** All explored cells so far (including `popped`). */
  explored: Coord[]
  goalFound: boolean
}

export interface SearchResult {
  steps: SearchStep[]
  path: Coord[]
  cost: number
  /** Number of nodes expanded (popped and processed). */
  expanded: number
}

export function manhattan(r: number, c: number, goal: Coord): number {
  return Math.abs(r - goal[0]) + Math.abs(c - goal[1])
}

const inBounds = (g: Grid, r: number, c: number) => r >= 0 && r < g.rows && c >= 0 && c < g.cols

/** 4-connected neighbors that are in-bounds and not walls. */
function neighbors(g: Grid, r: number, c: number): Coord[] {
  const cand: Coord[] = [
    [r - 1, c],
    [r + 1, c],
    [r, c - 1],
    [r, c + 1],
  ]
  return cand.filter(([nr, nc]) => inBounds(g, nr, nc) && !g.walls.has(key(nr, nc)))
}

/**
 * Pick the index in `frontier` to pop next, per strategy. Priority strategies
 * break ties toward the goal (smaller h) — the standard A* tie-break that lets
 * an exact heuristic actually save work instead of expanding a whole f-plateau.
 */
function pickIndex(strategy: Strategy, frontier: string[], reached: Map<string, Node>): number {
  if (strategy === 'bfs') return 0 // FIFO
  if (strategy === 'dfs') return frontier.length - 1 // LIFO
  const primary = (n: Node) => (strategy === 'ucs' ? n.g : strategy === 'greedy' ? n.h : n.g + n.h)
  let best = 0
  let bestN = reached.get(frontier[0])!
  for (let i = 1; i < frontier.length; i++) {
    const n = reached.get(frontier[i])!
    const dp = primary(n) - primary(bestN)
    if (dp < 0 || (dp === 0 && n.h < bestN.h)) {
      best = i
      bestN = n
    }
  }
  return best
}

export function search(grid: Grid, strategy: Strategy): SearchResult {
  const startKey = key(grid.start[0], grid.start[1])
  const goalKey = key(grid.goal[0], grid.goal[1])
  const reached = new Map<string, Node>()
  reached.set(startKey, {
    r: grid.start[0],
    c: grid.start[1],
    g: 0,
    h: manhattan(grid.start[0], grid.start[1], grid.goal),
    parent: null,
  })
  const frontier: string[] = [startKey]
  const explored = new Set<string>()
  const steps: SearchStep[] = []

  const toCoord = (k: string): Coord => k.split(',').map(Number) as Coord

  while (frontier.length > 0) {
    const idx = pickIndex(strategy, frontier, reached)
    const k = frontier.splice(idx, 1)[0]
    if (explored.has(k)) continue
    const node = reached.get(k)!

    if (k === goalKey) {
      explored.add(k)
      steps.push({
        popped: [node.r, node.c],
        frontier: frontier.map(toCoord),
        explored: [...explored].map(toCoord),
        goalFound: true,
      })
      break
    }

    explored.add(k)
    for (const [nr, nc] of neighbors(grid, node.r, node.c)) {
      const nk = key(nr, nc)
      if (explored.has(nk)) continue
      const ng = node.g + 1
      const existing = reached.get(nk)
      if (!existing || ng < existing.g) {
        reached.set(nk, { r: nr, c: nc, g: ng, h: manhattan(nr, nc, grid.goal), parent: k })
        if (!frontier.includes(nk)) frontier.push(nk)
      }
    }

    steps.push({
      popped: [node.r, node.c],
      frontier: frontier.map(toCoord),
      explored: [...explored].map(toCoord),
      goalFound: false,
    })
  }

  // Reconstruct path if goal was reached.
  const path: Coord[] = []
  let cost = 0
  if (reached.has(goalKey) && explored.has(goalKey)) {
    let cur: string | null = goalKey
    cost = reached.get(goalKey)!.g
    while (cur) {
      const n: Node = reached.get(cur)!
      path.unshift([n.r, n.c])
      cur = n.parent
    }
  }

  return { steps, path, cost, expanded: explored.size }
}
