/**
 * Critical Path Method (CPM) — the arithmetic behind schedule planning.
 *
 * Forward pass:  ES = max(EF of predecessors),   EF = ES + duration
 * Backward pass: LF = min(LS of successors),     LS = LF − duration
 * Slack = LS − ES = LF − EF.  Critical tasks have zero slack; the critical
 * path is the chain of zero-slack tasks that fixes the project duration.
 *
 * Pure and synchronous so it can be unit-tested and driven from the UI.
 */

export interface CpmTask {
  id: string
  label: string
  duration: number
  /** Predecessor task ids (edges dep → this). */
  deps: string[]
}

export interface TaskSchedule {
  id: string
  es: number
  ef: number
  ls: number
  lf: number
  slack: number
  critical: boolean
}

export interface Schedule {
  tasks: Record<string, TaskSchedule>
  /** Topological order (used to reveal the forward pass step by step). */
  order: string[]
  projectDuration: number
  /** Zero-slack tasks in topological order. */
  criticalPath: string[]
}

/** Topological order of task ids, or null if the precedence graph has a cycle. */
export function topoOrder(tasks: CpmTask[]): string[] | null {
  const ids = tasks.map((t) => t.id)
  const indeg = new Map<string, number>(ids.map((id) => [id, 0]))
  const succ = new Map<string, string[]>(ids.map((id) => [id, []]))
  const byId = new Map(tasks.map((t) => [t.id, t]))
  for (const t of tasks) {
    for (const d of t.deps) {
      if (!byId.has(d)) continue
      succ.get(d)!.push(t.id)
      indeg.set(t.id, (indeg.get(t.id) ?? 0) + 1)
    }
  }
  const ready = ids.filter((id) => indeg.get(id) === 0).sort()
  const order: string[] = []
  while (ready.length) {
    const n = ready.shift()!
    order.push(n)
    for (const m of succ.get(n)!) {
      indeg.set(m, indeg.get(m)! - 1)
      if (indeg.get(m) === 0) {
        ready.push(m)
        ready.sort()
      }
    }
  }
  return order.length === ids.length ? order : null
}

export function computeSchedule(tasks: CpmTask[]): Schedule {
  const order = topoOrder(tasks)
  if (!order) throw new Error('CPM precedence graph has a cycle')
  const byId = new Map(tasks.map((t) => [t.id, t]))
  const succ = new Map<string, string[]>(tasks.map((t) => [t.id, []]))
  for (const t of tasks) for (const d of t.deps) if (byId.has(d)) succ.get(d)!.push(t.id)

  const es: Record<string, number> = {}
  const ef: Record<string, number> = {}
  // Forward pass in topological order.
  for (const id of order) {
    const t = byId.get(id)!
    const start = t.deps.filter((d) => byId.has(d)).map((d) => ef[d])
    es[id] = start.length ? Math.max(...start) : 0
    ef[id] = es[id] + t.duration
  }
  const projectDuration = Math.max(0, ...order.map((id) => ef[id]))

  const ls: Record<string, number> = {}
  const lf: Record<string, number> = {}
  // Backward pass in reverse topological order.
  for (let i = order.length - 1; i >= 0; i--) {
    const id = order[i]
    const t = byId.get(id)!
    const succLs = succ.get(id)!.map((s) => ls[s])
    lf[id] = succLs.length ? Math.min(...succLs) : projectDuration
    ls[id] = lf[id] - t.duration
  }

  const result: Record<string, TaskSchedule> = {}
  for (const id of order) {
    const slack = ls[id] - es[id]
    result[id] = { id, es: es[id], ef: ef[id], ls: ls[id], lf: lf[id], slack, critical: slack === 0 }
  }
  const criticalPath = order.filter((id) => result[id].critical)
  return { tasks: result, order, projectDuration, criticalPath }
}
