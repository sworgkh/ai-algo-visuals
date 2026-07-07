import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Action, Fluent } from '@/lib/strips'
import { regress, relevantActions } from '@/lib/strips'
import { OperatorCard } from './OperatorCard'
import { GOAL, GROUND_ACTIONS, INITIAL } from './domain'
import './Regression.css'

const initialState = new Set(INITIAL)

interface Frame {
  goal: Fluent[]
  action: Action | null // action regressed to reach this frame (null for the goal itself)
}

export function Regression() {
  const [frames, setFrames] = useState<Frame[]>([{ goal: GOAL, action: null }])
  const current = frames[frames.length - 1]
  const goalSet = new Set(current.goal)
  const relevant = relevantActions(GROUND_ACTIONS, goalSet)
  const solved = current.goal.every((g) => initialState.has(g))

  const regressThrough = (a: Action) => {
    const next = [...regress(goalSet, a)].sort()
    setFrames((f) => [...f, { goal: next, action: a }])
  }
  const undo = () => setFrames((f) => (f.length > 1 ? f.slice(0, -1) : f))
  const reset = () => setFrames([{ goal: GOAL, action: null }])

  // Forward plan = actions chosen, reversed (regression discovers them last-first).
  const forwardPlan = frames
    .map((f) => f.action)
    .filter((a): a is Action => a !== null)
    .reverse()

  return (
    <div className="regression">
      <p className="rg-intro">
        Backward search starts at the goal and works towards the initial state. At each step it
        picks a <strong>relevant</strong> action — one that achieves a needed literal without
        deleting another — and <strong>regresses</strong> the goal:{' '}
        <span className="mono">G' = (G − add) ∪ precond</span>. Only relevant actions ever appear.
      </p>

      <div className="rg-main">
        <div className="rg-goalbox">
          <div className="rg-panel-title">Current goal set</div>
          <div className="rg-chips">
            <AnimatePresence initial={false}>
              {current.goal.map((g) => (
                <motion.span
                  key={g}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.25 }}
                  className={`rg-chip mono${initialState.has(g) ? ' is-init' : ''}`}
                >
                  {initialState.has(g) && <span className="rg-check">✓</span>}
                  {g}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
          <p className="rg-hint">
            Green literals already hold in the initial state. When all do, we’ve reached it.
          </p>
        </div>

        <div className="rg-side">
          {solved ? (
            <div className="rg-solved">
              <div className="rg-panel-title rg-panel-title--good">✓ Reached the initial state</div>
              <p className="rg-plan mono">{forwardPlan.map((a) => a.name).join('  →  ') || '—'}</p>
              <p className="rg-hint">Reverse the regression to read the plan forward.</p>
            </div>
          ) : (
            <>
              <div className="rg-panel-title">Relevant actions ({relevant.length})</div>
              <p className="rg-hint">
                Of {GROUND_ACTIONS.length} ground actions, only these are relevant to the current
                goal.
              </p>
              <div className="rg-actions">
                {relevant.map((a) => (
                  <button key={a.name} className="rg-action mono" onClick={() => regressThrough(a)}>
                    {a.name}
                  </button>
                ))}
              </div>
            </>
          )}
          {current.action && (
            <OperatorCard
              label={current.action.name}
              precond={current.action.precond}
              add={current.action.add}
              del={current.action.del}
              highlight={current.action.add}
            />
          )}
        </div>
      </div>

      <div className="rg-footer">
        <span className="rg-depth">Depth: {frames.length - 1}</span>
        <div className="rg-footer-btns">
          <button className="rg-btn" onClick={undo} disabled={frames.length === 1}>
            Undo
          </button>
          <button className="rg-btn" onClick={reset} disabled={frames.length === 1}>
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}
