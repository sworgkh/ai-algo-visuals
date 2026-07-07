/**
 * The Sussman anomaly — the canonical blocks-world problem that proves why
 * linear (non-interleaved) planning fails and partial-order planning is needed.
 *
 *   Initial:  C on A, A on Table, B on Table   (C and B clear)
 *   Goal:     A on B  ∧  B on C
 *
 * Solving either goal fully before the other dead-ends; the only solution
 * interleaves the subgoals: MoveToTable(C,A) → Move(B,Table,C) → Move(A,Table,B).
 */

import type { Fluent, Operator, WorldObject } from '@/lib/strips'
import { fluentOf, groundAll, lit } from '@/lib/strips'

export const TABLE = 'Table'
export const BLOCKS = ['A', 'B', 'C'] as const

export const OBJECTS: WorldObject[] = [
  { name: 'A', type: 'block' },
  { name: 'B', type: 'block' },
  { name: 'C', type: 'block' },
  { name: TABLE, type: 'table' },
]

/**
 * Move(b, x, y): move block b from x onto block y.
 *   PRECOND On(b,x) ∧ Clear(b) ∧ Clear(y)
 *   ADD     On(b,y), Clear(x)
 *   DEL     On(b,x), Clear(y)
 * MoveToTable(b, x): move block b from block x onto the table (always clear).
 *   PRECOND On(b,x) ∧ Clear(b)
 *   ADD     On(b,Table), Clear(x)
 *   DEL     On(b,x)
 */
export const OPERATORS: Operator[] = [
  {
    name: 'Move',
    params: [
      { name: 'b', type: 'block' },
      { name: 'x', type: 'object' },
      { name: 'y', type: 'block' },
    ],
    precond: [lit('On', 'b', 'x'), lit('Clear', 'b'), lit('Clear', 'y')],
    add: [lit('On', 'b', 'y'), lit('Clear', 'x')],
    del: [lit('On', 'b', 'x'), lit('Clear', 'y')],
  },
  {
    name: 'MoveToTable',
    params: [
      { name: 'b', type: 'block' },
      { name: 'x', type: 'block' },
    ],
    precond: [lit('On', 'b', 'x'), lit('Clear', 'b')],
    add: [lit('On', 'b', TABLE), lit('Clear', 'x')],
    del: [lit('On', 'b', 'x')],
  },
]

export const INITIAL: Fluent[] = [
  fluentOf(lit('On', 'C', 'A')),
  fluentOf(lit('On', 'A', TABLE)),
  fluentOf(lit('On', 'B', TABLE)),
  fluentOf(lit('Clear', 'C')),
  fluentOf(lit('Clear', 'B')),
]

export const GOAL: Fluent[] = [fluentOf(lit('On', 'A', 'B')), fluentOf(lit('On', 'B', 'C'))]

/** All ground actions in this domain (18 of them). */
export const GROUND_ACTIONS = groundAll(OPERATORS, OBJECTS)

/** Look up a ground action by its display name, e.g. "Move(A,Table,B)". */
export function actionByName(name: string) {
  const a = GROUND_ACTIONS.find((g) => g.name === name)
  if (!a) throw new Error(`No ground action named ${name}`)
  return a
}

/** Blocks-world state → a tidy list of stacks (bottom→top) for rendering. */
export function stacksOf(state: ReadonlySet<Fluent>): string[][] {
  const on: Record<string, string> = {} // block → what it sits on
  for (const f of state) {
    const m = /^On\(([^,]+),([^)]+)\)$/.exec(f)
    if (m) on[m[1]] = m[2]
  }
  const bottoms = BLOCKS.filter((b) => on[b] === TABLE)
  const stackFrom = (bottom: string): string[] => {
    const stack = [bottom]
    let top = bottom
    // find the block sitting on `top`
    // (blocks world: at most one block directly on another)
    let guard = 0
    while (guard++ < BLOCKS.length) {
      const above = BLOCKS.find((b) => on[b] === top)
      if (!above) break
      stack.push(above)
      top = above
    }
    return stack
  }
  return bottoms.sort().map(stackFrom)
}
