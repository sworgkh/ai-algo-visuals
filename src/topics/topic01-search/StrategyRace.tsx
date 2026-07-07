import { useMemo } from 'react'
import { type Grid, search } from '@/lib/search'
import { VizGuide } from '@/components/VizGuide'
import { COLS, DEFAULT_WALLS, GOAL, ROWS, START, STRATEGIES } from './domain'
import './StrategyRace.css'

export function StrategyRace() {
  const grid: Grid = useMemo(
    () => ({ rows: ROWS, cols: COLS, walls: new Set(DEFAULT_WALLS), start: START, goal: GOAL }),
    [],
  )
  const rows = useMemo(
    () => STRATEGIES.map((s) => ({ ...s, result: search(grid, s.id) })),
    [grid],
  )
  const maxExpanded = Math.max(...rows.map((r) => r.result.expanded))
  const optimalCost = Math.min(...rows.filter((r) => r.optimal).map((r) => r.result.cost))

  return (
    <div className="sr">
      <VizGuide
        what={
          <>
            The same start, goal and walls, solved five ways. <strong>Nodes expanded</strong> is the
            work done; <strong>path cost</strong> is the quality of the answer. Notice the trade-off:
            the uninformed optimal methods (BFS, UCS) explore a lot; <strong>greedy</strong> explores
            little but can return a longer path; <strong>A*</strong> gets the optimal path while
            expanding far fewer nodes than UCS.
          </>
        }
        how="Compare the bars: shorter = less work. A green cost badge means the path is optimal for this map."
        legend={[
          { color: 'var(--viz-4)', label: 'optimal path cost' },
          { color: 'var(--warning, #fbbf24)', label: 'longer than optimal' },
        ]}
      />

      <div className="sr-table">
        <div className="sr-head">
          <span>strategy</span>
          <span>frontier</span>
          <span>nodes expanded</span>
          <span>path cost</span>
          <span>properties</span>
        </div>
        {rows.map((r) => {
          const isOptimalPath = r.result.cost === optimalCost
          return (
            <div className="sr-row" key={r.id}>
              <span className="sr-name">{r.label}</span>
              <span className="sr-frontier mono">{r.frontier}</span>
              <div className="sr-bar-cell">
                <div className="sr-bar-track">
                  <div
                    className="sr-bar"
                    style={{ width: `${(r.result.expanded / maxExpanded) * 100}%` }}
                  />
                </div>
                <span className="sr-bar-val mono">{r.result.expanded}</span>
              </div>
              <span className={`sr-cost mono ${isOptimalPath ? 'is-opt' : 'is-subopt'}`}>
                {r.result.cost}
              </span>
              <span className="sr-props">
                {r.informed ? <em className="sr-tag sr-tag--informed">informed</em> : <em className="sr-tag">uninformed</em>}
                {r.optimal ? <em className="sr-tag sr-tag--opt">optimal</em> : <em className="sr-tag sr-tag--no">not optimal</em>}
              </span>
            </div>
          )
        })}
      </div>

      <p className="sr-note">
        <strong>The A* payoff.</strong> On this map A* returns the same optimal cost as UCS while
        expanding markedly fewer nodes — the admissible heuristic steers it toward the goal instead
        of flooding outward. Greedy expands even less, but by ignoring the cost-so-far it can commit
        to a longer route.
      </p>
    </div>
  )
}
