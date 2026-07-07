import { useMemo, useState } from 'react'
import { type Coord, type Grid, type Strategy, key, search } from '@/lib/search'
import { useStepPlayer } from '@/hooks/useStepPlayer'
import { StepPlayer } from '@/components/StepPlayer'
import { VizGuide } from '@/components/VizGuide'
import { COLS, DEFAULT_WALLS, GOAL, ROWS, START, STRATEGIES } from './domain'
import './SearchLab.css'

const eq = (a: Coord, b: Coord) => a[0] === b[0] && a[1] === b[1]

export function SearchLab() {
  const [strategy, setStrategy] = useState<Strategy>('astar')
  const [walls, setWalls] = useState<Set<string>>(() => new Set(DEFAULT_WALLS))

  const grid: Grid = useMemo(
    () => ({ rows: ROWS, cols: COLS, walls, start: START, goal: GOAL }),
    [walls],
  )
  const result = useMemo(() => search(grid, strategy), [grid, strategy])

  const player = useStepPlayer(result.steps.length)
  const stepIdx = Math.min(player.index, result.steps.length - 1)
  const step = result.steps[stepIdx]

  const frontier = useMemo(() => new Set(step?.frontier.map(([r, c]) => key(r, c))), [step])
  const explored = useMemo(() => new Set(step?.explored.map(([r, c]) => key(r, c))), [step])
  const onFinalPath = step?.goalFound
  const pathSet = useMemo(
    () => (onFinalPath ? new Set(result.path.map(([r, c]) => key(r, c))) : new Set<string>()),
    [onFinalPath, result.path],
  )

  const toggleWall = (r: number, c: number) => {
    const k = key(r, c)
    if (eq([r, c], START) || eq([r, c], GOAL)) return
    setWalls((w) => {
      const next = new Set(w)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
    player.reset()
  }

  const cellClass = (r: number, c: number) => {
    const k = key(r, c)
    if (eq([r, c], START)) return 'sl-cell is-start'
    if (eq([r, c], GOAL)) return 'sl-cell is-goal'
    if (walls.has(k)) return 'sl-cell is-wall'
    if (pathSet.has(k)) return 'sl-cell is-path'
    if (step && eq([r, c], step.popped)) return 'sl-cell is-current'
    if (explored.has(k)) return 'sl-cell is-explored'
    if (frontier.has(k)) return 'sl-cell is-frontier'
    return 'sl-cell'
  }

  return (
    <div className="sl">
      <VizGuide
        what={
          <>
            Every search strategy is the <strong>same loop</strong> — pop a node from the{' '}
            <strong>frontier</strong>, mark it <strong>explored</strong>, push its neighbors — and
            differs only in <em>which</em> node it pops next. Watch how that one choice changes how
            much of the grid each algorithm floods before reaching the goal.
          </>
        }
        how="Pick a strategy and step through. Click any empty cell to add or remove a wall and watch the search re-plan."
        legend={[
          { color: 'var(--viz-3)', label: 'frontier (waiting to expand)' },
          { color: 'var(--viz-7)', label: 'explored (already expanded)' },
          { color: 'var(--viz-5)', label: 'node expanded this step' },
          { color: 'var(--viz-4)', label: 'final path' },
        ]}
      />

      <div className="sl-strategies">
        {STRATEGIES.map((s) => (
          <button
            key={s.id}
            className={`sl-strat${strategy === s.id ? ' is-on' : ''}`}
            onClick={() => {
              setStrategy(s.id)
              player.reset()
            }}
            title={s.blurb}
          >
            <span className="sl-strat-label">{s.label}</span>
            <span className="sl-strat-frontier mono">{s.frontier}</span>
          </button>
        ))}
      </div>

      <div className="sl-stats">
        <span>
          strategy <strong>{STRATEGIES.find((s) => s.id === strategy)!.label}</strong>
        </span>
        <span>
          expanded <span className="mono">{explored.size}</span>
        </span>
        <span>
          frontier <span className="mono">{frontier.size}</span>
        </span>
        <span>
          path cost{' '}
          <span className="mono">{onFinalPath ? result.cost : '—'}</span>
        </span>
        {onFinalPath && (
          <span className={STRATEGIES.find((s) => s.id === strategy)!.optimal ? 'sl-opt' : 'sl-subopt'}>
            {STRATEGIES.find((s) => s.id === strategy)!.optimal ? '✓ optimal' : '≈ not guaranteed optimal'}
          </span>
        )}
      </div>

      <div
        className="sl-grid"
        style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
        role="img"
        aria-label="search grid"
      >
        {Array.from({ length: ROWS }, (_, r) =>
          Array.from({ length: COLS }, (_, c) => (
            <button
              key={key(r, c)}
              className={cellClass(r, c)}
              onClick={() => toggleWall(r, c)}
              aria-label={`cell ${r},${c}`}
            >
              {eq([r, c], START) ? 'S' : eq([r, c], GOAL) ? 'G' : ''}
            </button>
          )),
        )}
      </div>

      <StepPlayer
        player={player}
        stepLabel={`Step ${stepIdx + 1} / ${result.steps.length}`}
        caption={
          onFinalPath
            ? `Goal reached — expanded ${explored.size} nodes for a path of cost ${result.cost}.`
            : step
              ? `Expanded (${step.popped[0]}, ${step.popped[1]}); frontier now holds ${frontier.size} nodes.`
              : ''
        }
      />
    </div>
  )
}
