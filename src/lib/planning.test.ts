import { describe, expect, it } from 'vitest'
import {
  applicableActions,
  isRelevant,
  regress,
  relevantActions,
  simulate,
} from './strips'
import { FINISH, START, isComplete, resolveThreat, validatePlan } from './pop'
import {
  GOAL,
  GROUND_ACTIONS,
  INITIAL,
  actionByName,
} from '@/topics/topic02-pop/domain'
import { buildGuidedTrace } from '@/topics/topic02-pop/guided'

const initState = new Set(INITIAL)
const goalSet = new Set(GOAL)

describe('STRIPS domain (Sussman anomaly)', () => {
  it('grounds Move + MoveToTable into 18 distinct actions', () => {
    expect(GROUND_ACTIONS).toHaveLength(18)
    expect(new Set(GROUND_ACTIONS.map((a) => a.name)).size).toBe(18)
  })

  it('the interleaved plan reaches the goal', () => {
    const plan = [
      actionByName('MoveToTable(C,A)'),
      actionByName('Move(B,Table,C)'),
      actionByName('Move(A,Table,B)'),
    ]
    const res = simulate(initState, plan)
    expect(res.ok).toBe(true)
    expect(res.state.has('On(A,B)')).toBe(true)
    expect(res.state.has('On(B,C)')).toBe(true)
  })

  it('both goal-first linear orderings dead-end (the anomaly)', () => {
    // Achieve On(A,B) fully, then try On(B,C): B is no longer clear.
    const aFirst = simulate(initState, [
      actionByName('MoveToTable(C,A)'),
      actionByName('Move(A,Table,B)'),
      actionByName('Move(B,Table,C)'),
    ])
    expect(aFirst.ok).toBe(false)

    // Achieve On(B,C) first: C is no longer clear, so C can't be moved off A.
    const bFirst = simulate(initState, [
      actionByName('Move(B,Table,C)'),
      actionByName('MoveToTable(C,A)'),
      actionByName('Move(A,Table,B)'),
    ])
    expect(bFirst.ok).toBe(false)
  })
})

describe('relevance (backward search branching)', () => {
  it('only goal-achieving, non-clobbering actions are relevant to the goal', () => {
    const rel = relevantActions(GROUND_ACTIONS, goalSet).map((a) => a.name).sort()
    // Only actions that add On(A,B) or On(B,C): Move(A,*,B) and Move(B,*,C).
    expect(rel).toEqual(['Move(A,C,B)', 'Move(A,Table,B)', 'Move(B,A,C)', 'Move(B,Table,C)'])
  })

  it('relevance filters the action set and never admits a goal-clobbering action', () => {
    // Backward only ever considers actions relevant to the current goal:
    // 4 of the 18 ground actions. Forward must consider every *applicable*
    // action, relevant or not — that's the branching it pays for.
    const backward = relevantActions(GROUND_ACTIONS, goalSet).length
    expect(backward).toBe(4)
    expect(backward).toBeLessThan(GROUND_ACTIONS.length)
    // An action that deletes a needed literal is never relevant.
    expect(isRelevant(actionByName('MoveToTable(A,B)'), new Set(['On(A,B)']))).toBe(false)
    // Every applicable action at the initial state is a concrete branch forward pays for.
    expect(applicableActions(GROUND_ACTIONS, initState).length).toBeGreaterThan(0)
  })

  it('regression replaces an achieved goal literal with the action’s preconditions', () => {
    const g = regress(goalSet, actionByName('Move(A,Table,B)'))
    expect(g.has('On(A,B)')).toBe(false) // achieved
    expect(g.has('On(B,C)')).toBe(true) // still needed
    expect(g.has('On(A,Table)')).toBe(true) // precond added
    expect(g.has('Clear(A)')).toBe(true)
    expect(g.has('Clear(B)')).toBe(true)
  })
})

describe('POP guided derivation', () => {
  const trace = buildGuidedTrace()
  const final = trace[trace.length - 1].plan

  it('produces a complete, valid, executable plan', () => {
    expect(isComplete(final)).toBe(true)
    const v = validatePlan(final, initState)
    expect(v.ok).toBe(true)
    // Total order: Start, MoveToTable(C,A), Move(B,Table,C), Move(A,Table,B), Finish.
    expect(v.order).toEqual([START, 'S3', 'S2', 'S1', FINISH])
  })

  it('surfaces exactly the two expected threats, both requiring demotion', () => {
    const threatSteps = trace.filter((s) => s.threat)
    expect(threatSteps).toHaveLength(2)

    for (const s of threatSteps) {
      expect(s.threat!.correct).toBe('demote')
      // Promote creates a cycle (must precede Start) → impossible.
      expect(resolveThreat(s.threat!.plan, s.threat!.threat, 'promote')).toBeNull()
      // Demote is consistent.
      expect(resolveThreat(s.threat!.plan, s.threat!.threat, 'demote')).not.toBeNull()
    }

    const literals = threatSteps.map((s) => s.threat!.threat.link.literal).sort()
    expect(literals).toEqual(['Clear(B)', 'Clear(C)'])
  })
})
