import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { OpenCond, Plan, Threat } from '@/lib/pop'
import {
  FINISH,
  START,
  achieversFor,
  addCausalLink,
  addStep,
  findThreats,
  initPlan,
  isComplete,
  resolveThreat,
  validatePlan,
} from '@/lib/pop'
import { useStepPlayer } from '@/hooks/useStepPlayer'
import { StepPlayer } from '@/components/StepPlayer'
import { PopCanvas } from './PopCanvas'
import { OperatorCard } from './OperatorCard'
import { ProblemStrip } from './StaticBlocks'
import { buildGuidedTrace } from './guided'
import { GOAL, GROUND_ACTIONS, INITIAL } from './domain'
import './PopPlanner.css'

type Mode = 'guided' | 'free'

const initialState = new Set(INITIAL)

function Legend() {
  return (
    <div className="pp-legend">
      <span><i className="lg lg--link" /> causal link</span>
      <span><i className="lg lg--order" /> ordering</span>
      <span><i className="lg lg--threat" /> threat</span>
      <span><i className="lg lg--open" /> open precond</span>
    </div>
  )
}

function StepAnnotation({ plan, id }: { plan: Plan; id: string | null }) {
  if (!id || !plan.steps[id]) return null
  const s = plan.steps[id]
  const open = plan.open.filter((o) => o.step === id).map((o) => o.literal)
  return (
    <div className="pp-annot">
      <div className="pp-panel-title">Selected step</div>
      <OperatorCard label={s.label} precond={s.precond} add={s.add} del={s.del} openLiterals={open} />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Guided mode                                                                 */
/* -------------------------------------------------------------------------- */

function GuidedMode({
  selectedStep,
  setSelectedStep,
  initialStep,
}: {
  selectedStep: string | null
  setSelectedStep: (id: string) => void
  initialStep: number
}) {
  const trace = useMemo(() => buildGuidedTrace(), [])
  const player = useStepPlayer(trace.length, { initialSpeed: 1, initialIndex: initialStep })
  const [resolved, setResolved] = useState<Record<number, boolean>>({})
  const [wrongAt, setWrongAt] = useState<number | null>(null)

  const step = trace[player.index]
  const isThreat = !!step.threat
  const isResolved = !!resolved[player.index]

  // While autoplaying we skip the interactive gate and show the resolved plan,
  // so a run flows straight through to the completed plan.
  const showThreat = isThreat && !isResolved && !player.isPlaying
  const plan = showThreat ? step.threat!.plan : step.plan
  const threat = showThreat ? step.threat!.threat : null
  const showWrong = wrongAt === player.index

  const choose = (how: 'promote' | 'demote') => {
    if (!step.threat) return
    if (how === step.threat.correct) {
      setResolved((r) => ({ ...r, [player.index]: true }))
      setWrongAt(null)
    } else {
      setWrongAt(player.index)
    }
  }

  return (
    <>
      <div className="pp-main">
        <PopCanvas
          plan={plan}
          threat={threat}
          highlightLink={showThreat ? null : step.focusLink}
          selectedStep={selectedStep ?? step.focusStep ?? null}
          onSelectStep={setSelectedStep}
        />
        <aside className="pp-side">
          {showThreat ? (
            <div className="pp-threat-panel">
              <div className="pp-panel-title pp-panel-title--danger">⚡ Threat</div>
              <p className="pp-threat-desc">
                <span className="mono">{plan.steps[threat!.clobberer].label}</span> deletes{' '}
                <span className="mono hl">{threat!.link.literal}</span>, clobbering the link{' '}
                <span className="mono">{plan.steps[threat!.link.from].label}</span> →{' '}
                <span className="mono">{plan.steps[threat!.link.to].label}</span>.
              </p>
              <div className="pp-choice">
                <button className="pp-btn pp-btn--wrong" onClick={() => choose('promote')}>
                  Promote
                </button>
                <button className="pp-btn pp-btn--right" onClick={() => choose('demote')}>
                  Demote
                </button>
              </div>
              {showWrong && <p className="pp-why pp-why--bad">✗ {step.threat!.promoteWhy}</p>}
              <p className="pp-hint">Pick a resolution to protect the link.</p>
            </div>
          ) : (
            <>
              {isThreat && isResolved && (
                <p className="pp-why pp-why--good">✓ {step.threat!.demoteWhy}</p>
              )}
              <Agenda plan={plan} />
            </>
          )}
          <StepAnnotation plan={plan} id={selectedStep ?? step.focusStep ?? null} />
          <Legend />
        </aside>
      </div>
      <StepPlayer player={player} stepLabel={step.title} caption={step.caption} />
    </>
  )
}

function Agenda({ plan }: { plan: Plan }) {
  if (plan.open.length === 0) {
    return (
      <div className="pp-agenda">
        <div className="pp-panel-title">Agenda</div>
        <p className="pp-agenda-empty">No open preconditions ✓</p>
      </div>
    )
  }
  return (
    <div className="pp-agenda">
      <div className="pp-panel-title">Open preconditions ({plan.open.length})</div>
      <ul className="pp-agenda-list">
        {plan.open.map((o) => (
          <li key={`${o.step}:${o.literal}`} className="pp-agenda-item mono">
            <span className="hl">{o.literal}</span>
            <span className="pp-agenda-at">@ {plan.steps[o.step].label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Free mode                                                                   */
/* -------------------------------------------------------------------------- */

function FreeMode({
  selectedStep,
  setSelectedStep,
}: {
  selectedStep: string | null
  setSelectedStep: (id: string) => void
}) {
  const [plan, setPlan] = useState<Plan>(() => initPlan(INITIAL, GOAL))
  const [picked, setPicked] = useState<OpenCond | null>(null)
  const [cycleMsg, setCycleMsg] = useState<string | null>(null)

  const threats = findThreats(plan)
  const complete = isComplete(plan)
  const validation = complete ? validatePlan(plan, initialState) : null

  const resetAll = () => {
    setPlan(initPlan(INITIAL, GOAL))
    setPicked(null)
    setCycleMsg(null)
  }

  const applyExisting = (from: string, o: OpenCond) => {
    setPlan(addCausalLink(plan, from, o.step, o.literal))
    setPicked(null)
    setCycleMsg(null)
  }
  const applyFresh = (actionName: string, o: OpenCond) => {
    const action = GROUND_ACTIONS.find((a) => a.name === actionName)!
    const r = addStep(plan, action)
    setPlan(addCausalLink(r.plan, r.stepId, o.step, o.literal))
    setPicked(null)
    setCycleMsg(null)
  }
  const resolve = (t: Threat, how: 'promote' | 'demote') => {
    const next = resolveThreat(plan, t, how)
    if (!next) {
      setCycleMsg(
        `${how === 'promote' ? 'Promote' : 'Demote'} creates an ordering cycle — try the other option.`,
      )
    } else {
      setPlan(next)
      setCycleMsg(null)
    }
  }

  const achievers = picked ? achieversFor(plan, picked, GROUND_ACTIONS) : null

  return (
    <>
      <div className="pp-main">
        <PopCanvas
          plan={plan}
          threat={threats[0] ?? null}
          selectedStep={selectedStep}
          onSelectStep={setSelectedStep}
        />
        <aside className="pp-side">
          {complete ? (
            <div className="pp-complete">
              <div className="pp-panel-title pp-panel-title--good">✓ Plan complete</div>
              <p className="pp-complete-order mono">
                {validation?.order
                  ?.filter((id) => id !== START && id !== FINISH)
                  .map((id) => plan.steps[id].label)
                  .join('  →  ')}
              </p>
            </div>
          ) : threats.length > 0 ? (
            <div className="pp-threat-panel">
              <div className="pp-panel-title pp-panel-title--danger">
                ⚡ {threats.length} threat{threats.length > 1 ? 's' : ''}
              </div>
              {threats.map((t, i) => (
                <div key={i} className="pp-threat-row">
                  <p className="pp-threat-desc">
                    <span className="mono">{plan.steps[t.clobberer].label}</span> deletes{' '}
                    <span className="mono hl">{t.link.literal}</span> (link{' '}
                    <span className="mono">{plan.steps[t.link.from].label}</span>→
                    <span className="mono">{plan.steps[t.link.to].label}</span>)
                  </p>
                  <div className="pp-choice">
                    <button className="pp-btn" onClick={() => resolve(t, 'promote')}>Promote</button>
                    <button className="pp-btn" onClick={() => resolve(t, 'demote')}>Demote</button>
                  </div>
                </div>
              ))}
              {cycleMsg && <p className="pp-why pp-why--bad">✗ {cycleMsg}</p>}
            </div>
          ) : picked ? (
            <div className="pp-chooser">
              <div className="pp-panel-title">
                Achieve <span className="mono hl">{picked.literal}</span> @{' '}
                {plan.steps[picked.step].label}
              </div>
              {achievers!.existing.length > 0 && (
                <>
                  <div className="pp-chooser-sub">Reuse an existing step</div>
                  {achievers!.existing.map((id) => (
                    <button key={id} className="pp-btn pp-btn--wide" onClick={() => applyExisting(id, picked)}>
                      {plan.steps[id].label}
                    </button>
                  ))}
                </>
              )}
              <div className="pp-chooser-sub">Add a new action</div>
              {achievers!.fresh.map((a) => (
                <button key={a.name} className="pp-btn pp-btn--wide" onClick={() => applyFresh(a.name, picked)}>
                  {a.name}
                </button>
              ))}
              <button className="pp-btn pp-btn--ghost" onClick={() => setPicked(null)}>
                Cancel
              </button>
            </div>
          ) : (
            <div className="pp-agenda">
              <div className="pp-panel-title">Open preconditions ({plan.open.length})</div>
              <p className="pp-hint">Click one to choose how to achieve it.</p>
              <ul className="pp-agenda-list">
                {plan.open.map((o) => (
                  <li key={`${o.step}:${o.literal}`}>
                    <button className="pp-agenda-btn mono" onClick={() => setPicked(o)}>
                      <span className="hl">{o.literal}</span>
                      <span className="pp-agenda-at">@ {plan.steps[o.step].label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <StepAnnotation plan={plan} id={selectedStep} />
          <Legend />
        </aside>
      </div>
      <div className="pp-free-footer">
        <p className="pp-hint">
          Free play: resolve every open precondition, then clear any threats until the plan is
          complete.
        </p>
        <button className="pp-btn pp-btn--ghost" onClick={resetAll}>
          Reset
        </button>
      </div>
    </>
  )
}

/* -------------------------------------------------------------------------- */

export function PopPlanner() {
  const [mode, setMode] = useState<Mode>('guided')
  const [selectedStep, setSelectedStep] = useState<string | null>(null)
  const [params] = useSearchParams()
  const initialStep = Math.max(0, Number(params.get('step') ?? 0) || 0)

  return (
    <div className="pop-planner">
      <div className="pp-modes" role="tablist" aria-label="POP mode">
        <button
          className={`pp-mode${mode === 'guided' ? ' is-active' : ''}`}
          onClick={() => setMode('guided')}
          role="tab"
          aria-selected={mode === 'guided'}
        >
          Guided
        </button>
        <button
          className={`pp-mode${mode === 'free' ? ' is-active' : ''}`}
          onClick={() => setMode('free')}
          role="tab"
          aria-selected={mode === 'free'}
        >
          Free play
        </button>
      </div>
      <ProblemStrip className="pp-problem" />
      {mode === 'guided' ? (
        <GuidedMode
          selectedStep={selectedStep}
          setSelectedStep={setSelectedStep}
          initialStep={initialStep}
        />
      ) : (
        <FreeMode selectedStep={selectedStep} setSelectedStep={setSelectedStep} />
      )}
    </div>
  )
}
