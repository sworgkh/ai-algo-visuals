/**
 * Minimal STRIPS planning core — shared by the planning topics.
 *
 * Scope: positive-literal STRIPS (preconditions and goals are conjunctions of
 * positive fluents; effects add and delete positive fluents). That covers the
 * blocks world and keeps regression clean. Everything here is pure and
 * synchronous so it can be unit-tested and driven from the UI.
 */

// ---------------------------------------------------------------------------
// Literals & fluents
// ---------------------------------------------------------------------------

export interface Literal {
  pred: string
  args: string[]
}

/** Canonical ground fluent string, e.g. "On(A,B)". Used as a Set key. */
export type Fluent = string

export function lit(pred: string, ...args: string[]): Literal {
  return { pred, args }
}

export function fluentOf(l: Literal): Fluent {
  return l.args.length ? `${l.pred}(${l.args.join(',')})` : l.pred
}

/** Substitute variables → objects in a literal using a binding map. */
export function bindLiteral(l: Literal, binding: Record<string, string>): Literal {
  return { pred: l.pred, args: l.args.map((a) => binding[a] ?? a) }
}

// ---------------------------------------------------------------------------
// Operators (lifted) & actions (ground)
// ---------------------------------------------------------------------------

export type ParamType = 'block' | 'object'

export interface Param {
  name: string
  type: ParamType
}

export interface Operator {
  name: string
  params: Param[]
  precond: Literal[]
  add: Literal[]
  del: Literal[]
}

export interface Action {
  /** Operator name. */
  op: string
  /** Variable → object binding. */
  binding: Record<string, string>
  /** Display name, e.g. "Move(B,Table,C)". */
  name: string
  precond: Fluent[]
  add: Fluent[]
  del: Fluent[]
}

export interface WorldObject {
  name: string
  type: 'block' | 'table'
}

export type State = ReadonlySet<Fluent>

const groundName = (op: string, binding: Record<string, string>, params: Param[]): string =>
  `${op}(${params.map((p) => binding[p.name]).join(',')})`

function typeMatches(objType: WorldObject['type'], paramType: ParamType): boolean {
  return paramType === 'object' ? true : objType === 'block'
}

/**
 * Ground an operator over the world's objects. Enforces per-parameter typing
 * and all-distinct bindings (no action moves a block onto itself, etc.).
 */
export function groundOperator(op: Operator, objects: WorldObject[]): Action[] {
  const results: Action[] = []
  const byType = (p: Param) => objects.filter((o) => typeMatches(o.type, p.type))

  const recurse = (i: number, binding: Record<string, string>, used: Set<string>) => {
    if (i === op.params.length) {
      results.push({
        op: op.name,
        binding: { ...binding },
        name: groundName(op.name, binding, op.params),
        precond: op.precond.map((l) => fluentOf(bindLiteral(l, binding))),
        add: op.add.map((l) => fluentOf(bindLiteral(l, binding))),
        del: op.del.map((l) => fluentOf(bindLiteral(l, binding))),
      })
      return
    }
    const p = op.params[i]
    for (const o of byType(p)) {
      if (used.has(o.name)) continue // all-distinct params
      binding[p.name] = o.name
      used.add(o.name)
      recurse(i + 1, binding, used)
      used.delete(o.name)
      delete binding[p.name]
    }
  }
  recurse(0, {}, new Set())
  return results
}

export function groundAll(ops: Operator[], objects: WorldObject[]): Action[] {
  return ops.flatMap((op) => groundOperator(op, objects))
}

// ---------------------------------------------------------------------------
// Forward (progression)
// ---------------------------------------------------------------------------

export function isApplicable(action: Action, state: State): boolean {
  return action.precond.every((p) => state.has(p))
}

export function applicableActions(actions: Action[], state: State): Action[] {
  return actions.filter((a) => isApplicable(a, state))
}

/** Progress a state through an action (assumes applicable). */
export function apply(action: Action, state: State): Set<Fluent> {
  const next = new Set(state)
  for (const d of action.del) next.delete(d)
  for (const a of action.add) next.add(a)
  return next
}

export function satisfies(state: State, goal: Fluent[]): boolean {
  return goal.every((g) => state.has(g))
}

/** Run a linear plan from `init`; returns the final state or a failure point. */
export function simulate(
  init: State,
  plan: Action[],
): { ok: boolean; state: Set<Fluent>; failedAt: number | null } {
  let state = new Set(init)
  for (let i = 0; i < plan.length; i++) {
    if (!isApplicable(plan[i], state)) return { ok: false, state, failedAt: i }
    state = apply(plan[i], state)
  }
  return { ok: true, state, failedAt: null }
}

// ---------------------------------------------------------------------------
// Backward (regression)
// ---------------------------------------------------------------------------

/**
 * An action is *relevant* to a goal set when it achieves at least one needed
 * literal and deletes none of them. This is the whole point of backward
 * search: only relevant actions ever enter the frontier.
 */
export function isRelevant(action: Action, goal: ReadonlySet<Fluent>): boolean {
  const achievesSomething = action.add.some((a) => goal.has(a))
  const deletesNeeded = action.del.some((d) => goal.has(d))
  return achievesSomething && !deletesNeeded
}

export function relevantActions(actions: Action[], goal: ReadonlySet<Fluent>): Action[] {
  return actions.filter((a) => isRelevant(a, goal))
}

/**
 * Regress a goal set through a relevant action:
 *   G' = (G \ add(a)) ∪ precond(a)
 * (Caller should ensure `isRelevant` first.)
 */
export function regress(goal: ReadonlySet<Fluent>, action: Action): Set<Fluent> {
  const next = new Set(goal)
  for (const a of action.add) next.delete(a)
  for (const p of action.precond) next.add(p)
  return next
}
