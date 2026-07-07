import { useEffect, useMemo, useRef, useState } from 'react'
import type { Action, Fluent } from '@/lib/strips'
import { apply, applicableActions } from '@/lib/strips'
import { useStepPlayer } from '@/hooks/useStepPlayer'
import { StepPlayer } from '@/components/StepPlayer'
import { Blocks } from '@/components/Icons'
import { VizGuide } from '@/components/VizGuide'
import { BlocksView } from './BlocksView'
import { OperatorCard } from './OperatorCard'
import { StaticBlocks } from './StaticBlocks'
import { GOAL_STATE } from './blocksState'
import { GOAL, GROUND_ACTIONS, INITIAL, actionByName } from './domain'
import './StripsForward.css'

interface FwdStep {
  action: Action
  before: Set<Fluent>
  after: Set<Fluent>
  applied: boolean
  missing: Fluent[]
}

function runScenario(names: string[]): FwdStep[] {
  const steps: FwdStep[] = []
  let state = new Set<Fluent>(INITIAL)
  for (const name of names) {
    const action = actionByName(name)
    const missing = action.precond.filter((p) => !state.has(p))
    const applied = missing.length === 0
    const after = applied ? apply(action, state) : new Set(state)
    steps.push({ action, before: new Set(state), after, applied, missing })
    if (!applied) break
    state = after
  }
  return steps
}

const SCENARIOS: Record<string, { label: string; verdict: 'good' | 'bad'; names: string[] }> = {
  interleaved: {
    label: 'Interleaved ✓',
    verdict: 'good',
    names: ['MoveToTable(C,A)', 'Move(B,Table,C)', 'Move(A,Table,B)'],
  },
  aFirst: {
    label: 'On(A,B) first ✗',
    verdict: 'bad',
    names: ['MoveToTable(C,A)', 'Move(A,Table,B)', 'Move(B,Table,C)'],
  },
  bFirst: {
    label: 'On(B,C) first ✗',
    verdict: 'bad',
    names: ['Move(B,Table,C)', 'MoveToTable(C,A)', 'Move(A,Table,B)'],
  },
}
type ScenarioKey = keyof typeof SCENARIOS

function GoalChips({ state }: { state: ReadonlySet<Fluent> }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div className="sf-goal" ref={ref}>
      <button
        className={`sf-goal-btn${open ? ' is-open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        title="Show the goal arrangement"
      >
        <Blocks size={15} />
        Goal
      </button>
      {GOAL.map((g) => (
        <span key={g} className={`sf-goal-chip mono${state.has(g) ? ' is-met' : ''}`}>
          {state.has(g) ? '✓' : '○'} {g}
        </span>
      ))}
      {open && (
        <div className="sf-goal-pop" role="tooltip">
          <div className="sf-goal-pop-title">Goal arrangement</div>
          <StaticBlocks state={GOAL_STATE} />
          <div className="sf-goal-pop-formula mono">{GOAL.join(' ∧ ')}</div>
        </div>
      )}
    </div>
  )
}

// Remounted (via key) when the scenario changes, so the player resets to step 0.
function ScenarioRunner({ scenario }: { scenario: ScenarioKey }) {
  const steps = useMemo(() => runScenario(SCENARIOS[scenario].names), [scenario])
  const player = useStepPlayer(steps.length)

  const step = steps[player.index]
  const shownState = step.applied ? step.after : step.before

  const caption = step.applied
    ? `Apply ${step.action.name}: delete ${step.action.del.join(', ') || '∅'}; add ${
        step.action.add.join(', ') || '∅'
      }.`
    : `${step.action.name} is NOT applicable — precondition ${step.missing.join(
        ', ',
      )} is false. Dead-end.`

  return (
    <>
      <div className="sf-run">
        <BlocksView state={shownState} />
        <div className="sf-run-side">
          <OperatorCard
            label={step.action.name}
            precond={step.action.precond}
            add={step.action.add}
            del={step.action.del}
            openLiterals={step.applied ? [] : step.missing}
          />
          {!step.applied && (
            <div className="sf-deadend">
              <strong>Dead-end.</strong> {step.missing.join(', ')} was clobbered earlier — this
              goal ordering can’t be completed. That’s the Sussman anomaly.
            </div>
          )}
          <GoalChips state={shownState} />
        </div>
      </div>
      <StepPlayer player={player} stepLabel={`Step ${player.index + 1}`} caption={caption} />
    </>
  )
}

function FreeBuild() {
  const [state, setState] = useState<Set<Fluent>>(() => new Set(INITIAL))
  const [history, setHistory] = useState<Action[]>([])
  const applicable = applicableActions(GROUND_ACTIONS, state)
  const reached = GOAL.every((g) => state.has(g))

  const doAction = (a: Action) => {
    setState(apply(a, state))
    setHistory((h) => [...h, a])
  }
  const reset = () => {
    setState(new Set(INITIAL))
    setHistory([])
  }

  return (
    <>
      <div className="sf-run">
        <BlocksView state={state} />
        <div className="sf-run-side">
          <div className="sf-panel-title">Applicable actions ({applicable.length})</div>
          <div className="sf-actions">
            {applicable.map((a) => (
              <button key={a.name} className="sf-action-btn mono" onClick={() => doAction(a)}>
                {a.name}
              </button>
            ))}
          </div>
          <GoalChips state={state} />
          {reached && <div className="sf-reached">✓ Goal reached in {history.length} steps!</div>}
        </div>
      </div>
      <div className="sf-free-footer">
        <span className="sf-plan mono">
          {history.length ? history.map((a) => a.name).join('  →  ') : 'No actions applied yet.'}
        </span>
        <button className="sf-reset" onClick={reset}>
          Reset
        </button>
      </div>
    </>
  )
}

export function StripsForward() {
  const [mode, setMode] = useState<ScenarioKey | 'free'>('interleaved')
  return (
    <div className="strips-forward">
      <VizGuide
        what={
          <>
            A STRIPS action fires only when its <em>preconditions</em> hold; it then{' '}
            <span className="sf-del">deletes</span> and <span className="sf-add">adds</span>{' '}
            literals. The stacks show the world state; the card shows the current action’s
            precond / add / delete.
          </>
        }
        how="Try each goal ordering — both single-goal-first plans dead-end; only interleaving works. Or Free-build your own. Click Goal to preview the target arrangement."
        legend={[
          { color: 'var(--success)', label: 'added literal' },
          { color: 'var(--danger)', label: 'deleted literal' },
        ]}
      />
      <div className="sf-modes">
        {(Object.keys(SCENARIOS) as ScenarioKey[]).map((k) => (
          <button
            key={k}
            className={`sf-mode sf-mode--${SCENARIOS[k].verdict}${mode === k ? ' is-active' : ''}`}
            onClick={() => setMode(k)}
          >
            {SCENARIOS[k].label}
          </button>
        ))}
        <button
          className={`sf-mode${mode === 'free' ? ' is-active' : ''}`}
          onClick={() => setMode('free')}
        >
          Free build
        </button>
      </div>
      {mode === 'free' ? <FreeBuild /> : <ScenarioRunner key={mode} scenario={mode} />}
    </div>
  )
}
