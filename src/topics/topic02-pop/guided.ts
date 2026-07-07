/**
 * The canonical, provably-correct POP derivation for the Sussman anomaly,
 * expressed as a sequence of guided steps. It is *built by driving the real
 * engine* in `@/lib/pop` (never hand-faked), so the snapshots the UI animates
 * are exactly what the algorithm produces. `buildGuidedTrace` is also exercised
 * by the unit tests, which assert the final plan validates and that the two
 * threats are the expected `Clear(C)` and `Clear(B)` clobberings.
 */

import type { CausalLink, Plan, Resolution, Threat } from '@/lib/pop'
import {
  FINISH,
  START,
  addCausalLink,
  addStep,
  clonePlan,
  findThreats,
  initPlan,
  resolveThreat,
} from '@/lib/pop'
import { GOAL, INITIAL, actionByName } from './domain'

export interface GuidedStep {
  title: string
  caption: string
  /** Plan state after this step (post-resolution for threat steps). */
  plan: Plan
  /** Emphasis hints for the canvas. */
  focusStep?: string
  focusLink?: CausalLink
  /** Present when this step is an interactive threat resolution. */
  threat?: {
    /** Plan showing the unresolved threat (what to render + offer buttons on). */
    plan: Plan
    threat: Threat
    correct: Resolution
    promoteWhy: string
    demoteWhy: string
  }
}

function findThreat(plan: Plan, clobberer: string, literal: string, to: string): Threat {
  const t = findThreats(plan).find(
    (x) => x.clobberer === clobberer && x.link.literal === literal && x.link.to === to,
  )
  if (!t) throw new Error(`Expected threat ${clobberer}→(${literal}→${to}) not found`)
  return t
}

export function buildGuidedTrace(): GuidedStep[] {
  const steps: GuidedStep[] = []
  let plan = initPlan(INITIAL, GOAL)

  steps.push({
    title: 'Empty plan',
    caption:
      'Every POP starts with two dummy steps: Start (its effects are the initial state) and Finish (its preconditions are the goal). The goal literals On(A,B) and On(B,C) are the first open preconditions.',
    plan: clonePlan(plan),
    focusStep: FINISH,
  })

  // 1 — achieve On(A,B) with a new Move(A,Table,B)
  {
    const r = addStep(plan, actionByName('Move(A,Table,B)'))
    plan = addCausalLink(r.plan, r.stepId, FINISH, 'On(A,B)')
    steps.push({
      title: 'Achieve On(A,B)',
      caption:
        'Add Move(A,Table,B) to achieve On(A,B), protected by a causal link to Finish. Its own preconditions — On(A,Table), Clear(A), Clear(B) — become new open goals.',
      plan: clonePlan(plan),
      focusStep: r.stepId,
      focusLink: { from: r.stepId, to: FINISH, literal: 'On(A,B)' },
    })
  }

  // 2 — achieve On(B,C) with a new Move(B,Table,C)
  {
    const r = addStep(plan, actionByName('Move(B,Table,C)'))
    plan = addCausalLink(r.plan, r.stepId, FINISH, 'On(B,C)')
    steps.push({
      title: 'Achieve On(B,C)',
      caption:
        'Add Move(B,Table,C) to achieve On(B,C). New open goals: On(B,Table), Clear(B), Clear(C).',
      plan: clonePlan(plan),
      focusStep: r.stepId,
      focusLink: { from: r.stepId, to: FINISH, literal: 'On(B,C)' },
    })
  }

  // 3 — achieve Clear(A) with a new MoveToTable(C,A)
  {
    const r = addStep(plan, actionByName('MoveToTable(C,A)'))
    plan = addCausalLink(r.plan, r.stepId, 'S1', 'Clear(A)')
    steps.push({
      title: 'Achieve Clear(A)',
      caption:
        'Move(A,Table,B) needs Clear(A), but C sits on A. Add MoveToTable(C,A) — it adds Clear(A). New open goals: On(C,A), Clear(C).',
      plan: clonePlan(plan),
      focusStep: r.stepId,
      focusLink: { from: r.stepId, to: 'S1', literal: 'Clear(A)' },
    })
  }

  // 4–10 — the remaining open preconditions are all supplied by Start (they hold initially)
  const fromStart: Array<{ to: string; literal: string; note: string }> = [
    { to: 'S1', literal: 'On(A,Table)', note: 'A is on the table initially.' },
    { to: 'S1', literal: 'Clear(B)', note: 'B is clear initially.' },
    { to: 'S2', literal: 'On(B,Table)', note: 'B is on the table initially.' },
    { to: 'S2', literal: 'Clear(B)', note: 'B is clear initially — this link will be threatened.' },
    { to: 'S2', literal: 'Clear(C)', note: 'C is clear initially.' },
    { to: 'S3', literal: 'On(C,A)', note: 'C is on A initially.' },
    { to: 'S3', literal: 'Clear(C)', note: 'C is clear initially — this link will be threatened.' },
  ]
  for (const { to, literal, note } of fromStart) {
    plan = addCausalLink(plan, START, to, literal)
    steps.push({
      title: `Link ${literal}`,
      caption: `Support ${literal} for ${plan.steps[to].label} directly from Start — ${note}`,
      plan: clonePlan(plan),
      focusLink: { from: START, to, literal },
    })
  }

  // 11 — threat: Move(B,Table,C) deletes Clear(C), clobbering Start→MoveToTable(C,A)
  {
    const pre = clonePlan(plan)
    const threat = findThreat(pre, 'S2', 'Clear(C)', 'S3')
    const resolved = resolveThreat(pre, threat, 'demote')!
    plan = clonePlan(resolved)
    steps.push({
      title: 'Threat on Clear(C)',
      caption:
        'Move(B,Table,C) deletes Clear(C), which the link Start → MoveToTable(C,A) protects. Demote: order MoveToTable(C,A) before Move(B,Table,C).',
      plan: clonePlan(plan),
      threat: {
        plan: pre,
        threat,
        correct: 'demote',
        promoteWhy:
          'Promote would put Move(B,Table,C) before Start — impossible, Start is first. It creates an ordering cycle.',
        demoteWhy:
          'Demote puts the consumer MoveToTable(C,A) before the clobberer Move(B,Table,C), so Clear(C) survives until it is used.',
      },
    })
  }

  // 12 — threat: Move(A,Table,B) deletes Clear(B), clobbering Start→Move(B,Table,C)
  {
    const pre = clonePlan(plan)
    const threat = findThreat(pre, 'S1', 'Clear(B)', 'S2')
    const resolved = resolveThreat(pre, threat, 'demote')!
    plan = clonePlan(resolved)
    steps.push({
      title: 'Threat on Clear(B)',
      caption:
        'Move(A,Table,B) deletes Clear(B), which the link Start → Move(B,Table,C) protects. Demote: order Move(B,Table,C) before Move(A,Table,B). The plan is now complete and totally ordered: MoveToTable(C,A) → Move(B,Table,C) → Move(A,Table,B).',
      plan: clonePlan(plan),
      threat: {
        plan: pre,
        threat,
        correct: 'demote',
        promoteWhy:
          'Promote would put Move(A,Table,B) before Start — impossible. Cycle.',
        demoteWhy:
          'Demote puts Move(B,Table,C) before Move(A,Table,B): B is placed on C while it is still clear, then A goes on B. This is exactly the interleaving the Sussman anomaly forces.',
      },
    })
  }

  return steps
}
