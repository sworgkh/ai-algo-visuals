import type { Fluent } from '@/lib/strips'
import { GOAL, INITIAL } from './domain'

/** Block fill colors, shared by the static and animated blocks renders. */
export const BLOCK_COLOR: Record<string, string> = {
  A: 'var(--viz-1)',
  B: 'var(--viz-3)',
  C: 'var(--viz-5)',
}

/**
 * Full state realizing a goal (bottom block placed on the table) so a partial
 * goal like On(A,B) ∧ On(B,C) can be drawn as stacks.
 */
export function goalStateOf(goal: Fluent[]): Set<Fluent> {
  const s = new Set<Fluent>(goal)
  const pairs = goal
    .map((f) => /^On\(([^,]+),([^)]+)\)$/.exec(f))
    .filter(Boolean) as RegExpExecArray[]
  const children = new Set(pairs.map((m) => m[1]))
  for (const m of pairs) {
    const parent = m[2]
    if (parent !== 'Table' && !children.has(parent)) s.add(`On(${parent},Table)`)
  }
  return s
}

export const INITIAL_STATE: ReadonlySet<Fluent> = new Set(INITIAL)
export const GOAL_STATE: ReadonlySet<Fluent> = goalStateOf(GOAL)
