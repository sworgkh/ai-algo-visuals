/**
 * Partial-Order Planning (POP) engine — domain-agnostic.
 *
 * A plan is a set of steps (partially ordered), a set of causal links that
 * protect a producing literal until it's consumed, and an agenda of open
 * preconditions still to be achieved. This module owns the fiddly, correctness-
 * critical parts: threat detection, promotion/demotion, cycle checking, and a
 * linearize-then-simulate validator. It's pure so it can be unit-tested and
 * driven from both the guided and free-play UIs.
 */

import type { Action, Fluent, State } from './strips'
import { apply, isApplicable } from './strips'

export const START = 'Start'
export const FINISH = 'Finish'

export interface PopStep {
  id: string
  /** Display name, e.g. "Move(A,Table,B)" or "Start"/"Finish". */
  label: string
  precond: Fluent[]
  add: Fluent[]
  del: Fluent[]
}

export interface CausalLink {
  from: string
  to: string
  literal: Fluent
}

export interface OpenCond {
  step: string
  literal: Fluent
}

export interface Threat {
  clobberer: string
  link: CausalLink
}

export interface Plan {
  steps: Record<string, PopStep>
  /** Directed edges [before, after]. */
  orderings: Array<[string, string]>
  links: CausalLink[]
  open: OpenCond[]
}

// ---------------------------------------------------------------------------
// Construction & cloning
// ---------------------------------------------------------------------------

export function initPlan(startAdd: Fluent[], goal: Fluent[]): Plan {
  const steps: Record<string, PopStep> = {
    [START]: { id: START, label: 'Start', precond: [], add: [...startAdd], del: [] },
    [FINISH]: { id: FINISH, label: 'Finish', precond: [...goal], add: [], del: [] },
  }
  return {
    steps,
    orderings: [[START, FINISH]],
    links: [],
    open: goal.map((literal) => ({ step: FINISH, literal })),
  }
}

export function clonePlan(p: Plan): Plan {
  return {
    steps: Object.fromEntries(
      Object.entries(p.steps).map(([id, s]) => [
        id,
        { ...s, precond: [...s.precond], add: [...s.add], del: [...s.del] },
      ]),
    ),
    orderings: p.orderings.map((o) => [o[0], o[1]] as [string, string]),
    links: p.links.map((l) => ({ ...l })),
    open: p.open.map((o) => ({ ...o })),
  }
}

// ---------------------------------------------------------------------------
// Ordering graph
// ---------------------------------------------------------------------------

/** Is `after` reachable from `before` via ordering edges (strictly precedes)? */
export function precedes(plan: Plan, before: string, after: string): boolean {
  const adj = new Map<string, string[]>()
  for (const [a, b] of plan.orderings) {
    const list = adj.get(a) ?? []
    list.push(b)
    adj.set(a, list)
  }
  const seen = new Set<string>()
  const stack = [before]
  while (stack.length) {
    const cur = stack.pop()!
    for (const nxt of adj.get(cur) ?? []) {
      if (nxt === after) return true
      if (!seen.has(nxt)) {
        seen.add(nxt)
        stack.push(nxt)
      }
    }
  }
  return false
}

/** Adding before→after would create a cycle iff after already precedes before. */
export function wouldCycle(plan: Plan, before: string, after: string): boolean {
  if (before === after) return true
  return precedes(plan, after, before)
}

/** Add an ordering; returns a new plan, or null if it would cycle. */
export function addOrdering(plan: Plan, before: string, after: string): Plan | null {
  if (wouldCycle(plan, before, after)) return null
  // Skip exact duplicates.
  if (plan.orderings.some((o) => o[0] === before && o[1] === after)) return plan
  const next = clonePlan(plan)
  next.orderings.push([before, after])
  return next
}

// ---------------------------------------------------------------------------
// Steps, links, open conditions
// ---------------------------------------------------------------------------

/** Add a fresh step from a ground action, ordered Start ≺ step ≺ Finish. Its
 *  preconditions become new open conditions. Returns { plan, stepId }. */
export function addStep(plan: Plan, action: Action): { plan: Plan; stepId: string } {
  const existing = Object.keys(plan.steps).filter((id) => id !== START && id !== FINISH)
  const stepId = `S${existing.length + 1}`
  const next = clonePlan(plan)
  next.steps[stepId] = {
    id: stepId,
    label: action.name,
    precond: [...action.precond],
    add: [...action.add],
    del: [...action.del],
  }
  next.orderings.push([START, stepId], [stepId, FINISH])
  for (const p of action.precond) next.open.push({ step: stepId, literal: p })
  return { plan: next, stepId }
}

/** Record a causal link from→to protecting `literal`, add from≺to, and mark
 *  that open condition resolved. Returns a new plan (may add ordering). */
export function addCausalLink(
  plan: Plan,
  from: string,
  to: string,
  literal: Fluent,
): Plan {
  let next = addOrdering(plan, from, to) ?? clonePlan(plan)
  next = clonePlan(next)
  next.links.push({ from, to, literal })
  next.open = next.open.filter((o) => !(o.step === to && o.literal === literal))
  return next
}

// ---------------------------------------------------------------------------
// Threats
// ---------------------------------------------------------------------------

/**
 * A step U threatens a link (S →c T) when U deletes c and U can be ordered
 * strictly between S and T — i.e. U isn't already forced before S or after T.
 */
export function findThreats(plan: Plan): Threat[] {
  const threats: Threat[] = []
  for (const link of plan.links) {
    for (const step of Object.values(plan.steps)) {
      const u = step.id
      if (u === link.from || u === link.to) continue
      if (!step.del.includes(link.literal)) continue
      // Could U fall between from and to?
      const forcedBeforeFrom = precedes(plan, u, link.from)
      const forcedAfterTo = precedes(plan, link.to, u)
      if (!forcedBeforeFrom && !forcedAfterTo) {
        threats.push({ clobberer: u, link })
      }
    }
  }
  return threats
}

export type Resolution = 'promote' | 'demote'

/**
 * Resolve a threat:
 *  - promote: clobberer before the link's producer (clobberer ≺ from)
 *  - demote:  clobberer after the link's consumer  (to ≺ clobberer)
 * Returns a new plan, or null if that choice creates a cycle (i.e. impossible).
 */
export function resolveThreat(plan: Plan, threat: Threat, how: Resolution): Plan | null {
  if (how === 'promote') return addOrdering(plan, threat.clobberer, threat.link.from)
  return addOrdering(plan, threat.link.to, threat.clobberer)
}

// ---------------------------------------------------------------------------
// Completeness & validation
// ---------------------------------------------------------------------------

export function isComplete(plan: Plan): boolean {
  return plan.open.length === 0 && findThreats(plan).length === 0
}

/** Deterministic topological order of all steps consistent with the orderings. */
export function linearize(plan: Plan): string[] | null {
  const ids = Object.keys(plan.steps)
  const indeg = new Map<string, number>(ids.map((id) => [id, 0]))
  const adj = new Map<string, string[]>(ids.map((id) => [id, []]))
  for (const [a, b] of plan.orderings) {
    adj.get(a)!.push(b)
    indeg.set(b, (indeg.get(b) ?? 0) + 1)
  }
  // Kahn's algorithm; pick ready nodes in sorted order for determinism.
  const ready = ids.filter((id) => (indeg.get(id) ?? 0) === 0).sort()
  const order: string[] = []
  while (ready.length) {
    const n = ready.shift()!
    order.push(n)
    for (const m of adj.get(n)!) {
      indeg.set(m, indeg.get(m)! - 1)
      if (indeg.get(m) === 0) {
        ready.push(m)
        ready.sort()
      }
    }
  }
  return order.length === ids.length ? order : null // null ⇒ cycle
}

/**
 * Linearize the plan and simulate it forward with STRIPS from `init`, verifying
 * every step is applicable and the goal (Finish's preconditions) holds at the
 * end. This is the ground-truth check that the plan is actually executable.
 */
export function validatePlan(
  plan: Plan,
  init: State,
): { ok: boolean; order: string[] | null; reason?: string } {
  const order = linearize(plan)
  if (!order) return { ok: false, order: null, reason: 'ordering has a cycle' }

  let state = new Set(init)
  for (const id of order) {
    if (id === START || id === FINISH) continue
    const step = plan.steps[id]
    const action: Action = {
      op: step.label,
      binding: {},
      name: step.label,
      precond: step.precond,
      add: step.add,
      del: step.del,
    }
    if (!isApplicable(action, state)) {
      return { ok: false, order, reason: `${step.label} not applicable when reached` }
    }
    state = apply(action, state)
  }
  const goal = plan.steps[FINISH].precond
  const unmet = goal.filter((g) => !state.has(g))
  if (unmet.length) return { ok: false, order, reason: `goal unmet: ${unmet.join(', ')}` }
  return { ok: true, order }
}

// ---------------------------------------------------------------------------
// Free-play helpers
// ---------------------------------------------------------------------------

export interface Achievers {
  /** Existing steps whose effects add the literal and can be ordered before the consumer. */
  existing: string[]
  /** Ground actions (by name) that add the literal — candidates for a new step. */
  fresh: Action[]
}

/** Candidate ways to achieve one open condition. */
export function achieversFor(
  plan: Plan,
  open: OpenCond,
  groundActions: Action[],
): Achievers {
  const existing = Object.values(plan.steps)
    .filter((s) => s.id !== open.step && s.add.includes(open.literal))
    .filter((s) => !wouldCycle(plan, s.id, open.step))
    .map((s) => s.id)
  const fresh = groundActions.filter((a) => a.add.includes(open.literal))
  return { existing, fresh }
}
