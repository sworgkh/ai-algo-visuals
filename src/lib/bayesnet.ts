/**
 * Boolean Bayesian network + exact inference by enumeration.
 * Pure and synchronous so it can be unit-tested and drive the UI.
 */

export interface BNNode {
  name: string
  parents: string[]
  /**
   * P(name = true | parents). Keyed by the parents' truth values in order,
   * e.g. parents [B,E] → keys "TT","TF","FT","FF"; root nodes use key "".
   */
  cpt: Record<string, number>
}

export type BayesNet = BNNode[]
export type World = Record<string, boolean>

const byName = (bn: BayesNet) => new Map(bn.map((n) => [n.name, n]))

/** Topological order (parents before children). */
export function topoOrder(bn: BayesNet): string[] {
  const nodes = byName(bn)
  const order: string[] = []
  const seen = new Set<string>()
  const visit = (name: string) => {
    if (seen.has(name)) return
    seen.add(name)
    for (const p of nodes.get(name)!.parents) visit(p)
    order.push(name)
  }
  for (const n of bn) visit(n.name)
  return order
}

const cptKey = (node: BNNode, world: World) => node.parents.map((p) => (world[p] ? 'T' : 'F')).join('')

/** P(node = value | its parents' values in `world`). */
export function nodeProb(node: BNNode, value: boolean, world: World): number {
  const pTrue = node.cpt[cptKey(node, world)]
  return value ? pTrue : 1 - pTrue
}

function enumerateAll(vars: string[], evidence: World, nodes: Map<string, BNNode>): number {
  if (vars.length === 0) return 1
  const [y, ...rest] = vars
  const node = nodes.get(y)!
  if (y in evidence) {
    return nodeProb(node, evidence[y], evidence) * enumerateAll(rest, evidence, nodes)
  }
  let sum = 0
  for (const v of [true, false]) {
    sum += nodeProb(node, v, { ...evidence, [y]: v }) * enumerateAll(rest, { ...evidence, [y]: v }, nodes)
  }
  return sum
}

export interface AskResult {
  /** Normalized P(queryVar | evidence). */
  true: number
  false: number
  /** Unnormalized Σ for each value (before dividing by α). */
  rawTrue: number
  rawFalse: number
}

/** Exact inference P(queryVar | evidence) by enumeration (AIMA ENUMERATION-ASK). */
export function enumerationAsk(bn: BayesNet, queryVar: string, evidence: World = {}): AskResult {
  const nodes = byName(bn)
  const vars = topoOrder(bn)
  const rawTrue = enumerateAll(vars, { ...evidence, [queryVar]: true }, nodes)
  const rawFalse = enumerateAll(vars, { ...evidence, [queryVar]: false }, nodes)
  const total = rawTrue + rawFalse
  return {
    true: total === 0 ? 0 : rawTrue / total,
    false: total === 0 ? 0 : rawFalse / total,
    rawTrue,
    rawFalse,
  }
}

export interface EnumFactor {
  node: string
  value: boolean
  given: { name: string; value: boolean }[]
  p: number
}
export interface EnumTerm {
  hidden: World
  factors: EnumFactor[]
  product: number
}

/**
 * The concrete term-by-term expansion of the unnormalized sum for one query
 * value — one term per assignment of the hidden variables, each a product of
 * CPT entries. Drives the "watch enumeration unfold" view.
 */
export function enumerationTerms(
  bn: BayesNet,
  queryVar: string,
  queryValue: boolean,
  evidence: World = {},
): { terms: EnumTerm[]; sum: number } {
  const nodes = byName(bn)
  const order = topoOrder(bn)
  const fixed: World = { ...evidence, [queryVar]: queryValue }
  const hiddenVars = order.filter((v) => !(v in fixed))

  const combos: World[] = [{}]
  for (const h of hiddenVars) {
    const next: World[] = []
    for (const c of combos) for (const v of [true, false]) next.push({ ...c, [h]: v })
    combos.length = 0
    combos.push(...next)
  }

  const terms = combos.map((hidden) => {
    const world = { ...fixed, ...hidden }
    const factors: EnumFactor[] = order.map((v) => {
      const node = nodes.get(v)!
      return {
        node: v,
        value: world[v],
        given: node.parents.map((p) => ({ name: p, value: world[p] })),
        p: nodeProb(node, world[v], world),
      }
    })
    const product = factors.reduce((a, f) => a * f.p, 1)
    return { hidden, factors, product }
  })
  return { terms, sum: terms.reduce((a, t) => a + t.product, 0) }
}

// ---------------------------------------------------------------------------
// Structure helpers
// ---------------------------------------------------------------------------

export function childrenOf(bn: BayesNet, name: string): string[] {
  return bn.filter((n) => n.parents.includes(name)).map((n) => n.name)
}

/** Markov blanket: parents ∪ children ∪ children's other parents. */
export function markovBlanket(bn: BayesNet, name: string): string[] {
  const nodes = byName(bn)
  const set = new Set<string>()
  for (const p of nodes.get(name)!.parents) set.add(p)
  for (const c of childrenOf(bn, name)) {
    set.add(c)
    for (const cp of nodes.get(c)!.parents) if (cp !== name) set.add(cp)
  }
  set.delete(name)
  return [...set]
}

/** Independent parameters in the network: Σ 2^(#parents) over nodes. */
export function paramCount(bn: BayesNet): number {
  return bn.reduce((a, n) => a + 2 ** n.parents.length, 0)
}

export function arcCount(bn: BayesNet): number {
  return bn.reduce((a, n) => a + n.parents.length, 0)
}

// ---------------------------------------------------------------------------
// Variable-ordering experiment: the network a given ordering induces.
// For each variable we find the *minimal* set of predecessors that makes it
// conditionally independent of the rest — the structure the ordering forces.
// ---------------------------------------------------------------------------

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]]
  if (k > arr.length) return []
  const [head, ...tail] = arr
  return [...combinations(tail, k - 1).map((c) => [head, ...c]), ...combinations(tail, k)]
}

function worlds(vars: string[]): World[] {
  let out: World[] = [{}]
  for (const v of vars) out = out.flatMap((w) => [{ ...w, [v]: true }, { ...w, [v]: false }])
  return out
}

/** Is `X ⟂ (preds \ S) | S` in the true distribution `bn`? */
function isSufficient(bn: BayesNet, X: string, S: string[], preds: string[]): boolean {
  const rest = preds.filter((p) => !S.includes(p))
  for (const sAssign of worlds(S)) {
    let ref: number | null = null
    for (const rAssign of worlds(rest)) {
      const p = enumerationAsk(bn, X, { ...sAssign, ...rAssign }).true
      if (ref === null) ref = p
      else if (Math.abs(p - ref) > 1e-9) return false
    }
  }
  return true
}

/**
 * The network induced by adding variables in `ordering`: each node's parents
 * are the smallest predecessor set that d-separates it from the other
 * predecessors. Reproduces the causal net for the causal order, and denser
 * nets (more arcs/params) for non-causal orders.
 */
export function minimalParents(bn: BayesNet, ordering: string[]): { name: string; parents: string[] }[] {
  const result: { name: string; parents: string[] }[] = []
  for (let i = 0; i < ordering.length; i++) {
    const X = ordering[i]
    const preds = ordering.slice(0, i)
    let best = preds
    search: for (let k = 0; k <= preds.length; k++) {
      for (const S of combinations(preds, k)) {
        if (isSufficient(bn, X, S, preds)) {
          best = S
          break search
        }
      }
    }
    result.push({ name: X, parents: best })
  }
  return result
}
