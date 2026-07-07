import type { Coord, Strategy } from '@/lib/search'

export const ROWS = 9
export const COLS = 15
export const START: Coord = [4, 1]
export const GOAL: Coord = [4, 13]

/**
 * A vertical barrier in column 7 with a single gap at the bottom (rows 7–8),
 * so the straight east path is blocked and every algorithm must detour down —
 * which makes BFS's blind flooding, greedy's beeline, and A*'s directed search
 * look visibly different.
 */
export const DEFAULT_WALLS: string[] = [
  '0,7',
  '1,7',
  '2,7',
  '3,7',
  '4,7',
  '5,7',
  '6,7',
]

export interface StrategyInfo {
  id: Strategy
  label: string
  frontier: string
  blurb: string
  optimal: boolean
  informed: boolean
}

export const STRATEGIES: StrategyInfo[] = [
  { id: 'bfs', label: 'BFS', frontier: 'FIFO queue', blurb: 'Expands the shallowest node; optimal for unit costs.', optimal: true, informed: false },
  { id: 'dfs', label: 'DFS', frontier: 'LIFO stack', blurb: 'Dives deep first; low memory, not optimal.', optimal: false, informed: false },
  { id: 'ucs', label: 'UCS', frontier: 'min g', blurb: 'Expands the cheapest node by path cost g; optimal.', optimal: true, informed: false },
  { id: 'greedy', label: 'Greedy', frontier: 'min h', blurb: 'Chases the heuristic h; fast but not optimal.', optimal: false, informed: true },
  { id: 'astar', label: 'A*', frontier: 'min g+h', blurb: 'Balances cost so far and estimate; optimal with an admissible h.', optimal: true, informed: true },
]
