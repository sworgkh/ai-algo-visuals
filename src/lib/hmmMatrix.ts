/**
 * Matrix form of HMM inference. The exact same recursions as `hmm.ts`, but
 * expressed as linear algebra on the state-ordered basis: a transition matrix
 * T, a diagonal observation matrix Oₑ, and the forward message as a column
 * vector f. Filtering is f′ = α · Oₑ · Tᵀ · f; Viterbi is the same shape with
 * `max` swapped in for the sum. The `hmmMatrix.test.ts` suite asserts these
 * agree with `hmm.ts` to floating-point tolerance.
 */

import type { HMM } from './hmm'

export type Vec = number[]
export type Matrix = number[][]

/** T[i][j] = P(state_t = states[j] | state_{t-1} = states[i]). */
export function transitionMatrix(hmm: HMM): Matrix {
  return hmm.states.map((from) => hmm.states.map((to) => hmm.trans[from][to]))
}

/** Diagonal observation matrix for `obs`: Oₑ[i][i] = P(obs | states[i]). */
export function observationMatrix(hmm: HMM, obs: string): Matrix {
  return hmm.states.map((s, i) =>
    hmm.states.map((_, j) => (i === j ? hmm.sensor[s][obs] : 0)),
  )
}

/** The sensor likelihood of `obs` as a plain vector (the diagonal of Oₑ). */
export function obsVec(hmm: HMM, obs: string): Vec {
  return hmm.states.map((s) => hmm.sensor[s][obs])
}

export function priorVec(hmm: HMM): Vec {
  return hmm.states.map((s) => hmm.prior[s])
}

export function transpose(m: Matrix): Matrix {
  return m[0].map((_, j) => m.map((row) => row[j]))
}

export function sumVec(v: Vec): number {
  return v.reduce((a, x) => a + x, 0)
}

export function normalizeVec(v: Vec): { vec: Vec; alpha: number } {
  const total = sumVec(v)
  const alpha = total === 0 ? 0 : 1 / total
  return { vec: v.map((x) => x * alpha), alpha }
}

export function hadamard(a: Vec, b: Vec): Vec {
  return a.map((x, i) => x * b[i])
}

/** Matrix·vector where each row is reduced by `reduce` (sum → filtering, max → Viterbi). */
function combine(m: Matrix, v: Vec, reduce: (row: Vec) => number): Vec {
  return m.map((row) => reduce(row.map((a, j) => a * v[j])))
}

const SUM = (row: Vec) => row.reduce((a, x) => a + x, 0)

export interface MatrixFilterStep {
  obs: string
  /** Tᵀ · f — the one-step prediction (before evidence). */
  predicted: Vec
  /** Oₑ · predicted — reweighted by the sensor, before normalizing. */
  weighted: Vec
  /** α · weighted — the new normalized forward message. */
  updated: Vec
  alpha: number
}

export function matrixFilter(
  hmm: HMM,
  obs: string[],
): { prior: Vec; T: Matrix; Tt: Matrix; steps: MatrixFilterStep[] } {
  const T = transitionMatrix(hmm)
  const Tt = transpose(T)
  let f = priorVec(hmm)
  const steps: MatrixFilterStep[] = []
  for (const o of obs) {
    const predicted = combine(Tt, f, SUM)
    const weighted = hadamard(obsVec(hmm, o), predicted)
    const { vec: updated, alpha } = normalizeVec(weighted)
    steps.push({ obs: o, predicted, weighted, updated, alpha })
    f = updated
  }
  return { prior: priorVec(hmm), T, Tt, steps }
}

/** Backward messages as vectors: b_k = T · (Oₑ_{k+1} · b_{k+1}); b_n = 1. */
export function matrixBackward(hmm: HMM, obs: string[]): Vec[] {
  const T = transitionMatrix(hmm)
  const n = obs.length
  const b: Vec[] = new Array(n + 1)
  b[n] = hmm.states.map(() => 1)
  for (let t = n - 1; t >= 0; t--) {
    const ob = hadamard(obsVec(hmm, obs[t]), b[t + 1])
    b[t] = combine(T, ob, SUM)
  }
  return b
}

export function matrixSmooth(
  hmm: HMM,
  obs: string[],
): { forwards: Vec[]; backwards: Vec[]; smoothed: Vec[] } {
  const filt = matrixFilter(hmm, obs)
  const forwards = [filt.prior, ...filt.steps.map((s) => s.updated)]
  const backwards = matrixBackward(hmm, obs)
  const smoothed: Vec[] = []
  for (let t = 1; t <= obs.length; t++) {
    smoothed.push(normalizeVec(hadamard(forwards[t], backwards[t])).vec)
  }
  return { forwards, backwards, smoothed }
}

export interface MatrixViterbiStep {
  obs: string
  /** Per-state max over predecessors of Tᵀ[s][·]·m (before the sensor). */
  maxed: Vec
  /** Oₑ · maxed — the new message. */
  message: Vec
  /** argmax predecessor index per state (empty on the first step). */
  backptr: number[]
}

export function matrixViterbi(
  hmm: HMM,
  obs: string[],
): { steps: MatrixViterbiStep[]; path: string[]; pathIdx: number[] } {
  const T = transitionMatrix(hmm)
  const Tt = transpose(T)
  const steps: MatrixViterbiStep[] = []
  // First step: marginalize the prior (sum), then apply the sensor.
  let m = hadamard(obsVec(hmm, obs[0]), combine(Tt, priorVec(hmm), SUM))
  steps.push({ obs: obs[0], maxed: combine(Tt, priorVec(hmm), SUM), message: m, backptr: [] })
  for (let t = 1; t < obs.length; t++) {
    const maxed: Vec = []
    const backptr: number[] = []
    for (let s = 0; s < hmm.states.length; s++) {
      let best = -Infinity
      let arg = 0
      for (let from = 0; from < hmm.states.length; from++) {
        const v = Tt[s][from] * m[from]
        if (v > best) {
          best = v
          arg = from
        }
      }
      maxed.push(best)
      backptr.push(arg)
    }
    const message = hadamard(obsVec(hmm, obs[t]), maxed)
    steps.push({ obs: obs[t], maxed, message, backptr })
    m = message
  }
  // Backtrace.
  const n = obs.length
  const pathIdx: number[] = new Array(n)
  let last = 0
  for (let s = 1; s < m.length; s++) if (m[s] > m[last]) last = s
  pathIdx[n - 1] = last
  for (let t = n - 1; t > 0; t--) pathIdx[t - 1] = steps[t].backptr[pathIdx[t]]
  return { steps, path: pathIdx.map((i) => hmm.states[i]), pathIdx }
}

export interface Blowup {
  vars: number
  /** Distinct values of the single mega-variable = 2^k. */
  states: number
  /** Cells in the transition matrix = states². */
  cells: number
  /** Free (independent) transition parameters = states·(states − 1). */
  freeParams: number
}

/** The cost of flattening `k` boolean state variables into one mega-variable. */
export function blowup(vars: number): Blowup {
  const states = 2 ** vars
  return { vars, states, cells: states * states, freeParams: states * (states - 1) }
}
