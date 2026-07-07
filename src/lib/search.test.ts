import { describe, expect, it } from 'vitest'
import { type Grid, type Strategy, manhattan, search } from './search'

// 6×6 open grid, start top-left, goal bottom-right. Manhattan-optimal cost = 10.
const OPEN: Grid = { rows: 6, cols: 6, walls: new Set(), start: [0, 0], goal: [5, 5] }

// A grid with a wall down the middle forcing a detour.
const WALLED: Grid = {
  rows: 5,
  cols: 5,
  walls: new Set(['1,2', '2,2', '3,2']),
  start: [2, 0],
  goal: [2, 4],
}

const runAll = (g: Grid) =>
  Object.fromEntries(
    (['bfs', 'dfs', 'ucs', 'greedy', 'astar'] as Strategy[]).map((s) => [s, search(g, s)]),
  )

describe('heuristic', () => {
  it('Manhattan never overestimates the true (unit-cost) distance', () => {
    // On the open grid the true cost equals Manhattan, so it is admissible (tight).
    expect(manhattan(0, 0, [5, 5])).toBe(10)
    expect(manhattan(5, 5, [5, 5])).toBe(0)
  })
})

describe('optimal strategies agree on cost', () => {
  it('BFS, UCS and A* all find the optimal path on the open grid', () => {
    const r = runAll(OPEN)
    expect(r.bfs.cost).toBe(10)
    expect(r.ucs.cost).toBe(10)
    expect(r.astar.cost).toBe(10)
    // path endpoints are correct
    expect(r.astar.path[0]).toEqual([0, 0])
    expect(r.astar.path[r.astar.path.length - 1]).toEqual([5, 5])
  })

  it('detours around walls with the same optimal cost', () => {
    const r = runAll(WALLED)
    // The wall blocks column 2 at rows 1–3, so the path must reach row 0 or 4
    // to cross: straight line is 4, the forced detour makes optimal cost 8.
    expect(r.bfs.cost).toBe(8)
    expect(r.ucs.cost).toBe(8)
    expect(r.astar.cost).toBe(8)
    // path never steps on a wall
    for (const [rr, cc] of r.astar.path) expect(WALLED.walls.has(`${rr},${cc}`)).toBe(false)
  })
})

describe('A* efficiency', () => {
  it('expands no more nodes than UCS given an admissible heuristic', () => {
    const r = runAll(OPEN)
    expect(r.astar.expanded).toBeLessThanOrEqual(r.ucs.expanded)
    // and strictly fewer on an open grid where h actually guides
    expect(r.astar.expanded).toBeLessThan(r.ucs.expanded)
  })
})

describe('all strategies reach the goal', () => {
  it('every strategy returns a valid path that starts and ends correctly', () => {
    const r = runAll(WALLED)
    for (const s of ['bfs', 'dfs', 'ucs', 'greedy', 'astar'] as Strategy[]) {
      expect(r[s].path[0]).toEqual([2, 0])
      expect(r[s].path[r[s].path.length - 1]).toEqual([2, 4])
      expect(r[s].cost).toBeGreaterThanOrEqual(8) // 8 is optimal; DFS/greedy may be longer
    }
  })

  it('records a trace whose last step flags the goal', () => {
    const r = search(OPEN, 'astar')
    expect(r.steps.length).toBeGreaterThan(0)
    expect(r.steps[r.steps.length - 1].goalFound).toBe(true)
  })
})
