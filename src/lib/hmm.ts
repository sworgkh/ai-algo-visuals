/**
 * Discrete Hidden Markov Model + temporal inference: filtering (predict→update),
 * prediction, forward–backward smoothing, and Viterbi. Generic over a list of
 * states; pure and synchronous for testing + UI.
 */

export type Dist = Record<string, number>

export interface HMM {
  states: string[]
  prior: Dist
  /** trans[from][to] = P(state_t = to | state_{t-1} = from). */
  trans: Record<string, Dist>
  /** sensor[state][obs] = P(evidence = obs | state). */
  sensor: Record<string, Record<string, number>>
}

export function normalize(d: Dist): Dist {
  const total = Object.values(d).reduce((a, v) => a + v, 0)
  const out: Dist = {}
  for (const k of Object.keys(d)) out[k] = total === 0 ? 0 : d[k] / total
  return out
}

/** One-step prediction: roll the belief forward through the transition model. */
export function predict(hmm: HMM, d: Dist): Dist {
  const out: Dist = {}
  for (const to of hmm.states) {
    out[to] = hmm.states.reduce((a, from) => a + hmm.trans[from][to] * d[from], 0)
  }
  return out
}

/** Update: reweight by the sensor likelihood of `obs`, then normalize. */
export function update(hmm: HMM, d: Dist, obs: string): Dist {
  const out: Dist = {}
  for (const s of hmm.states) out[s] = hmm.sensor[s][obs] * d[s]
  return normalize(out)
}

export interface FilterStep {
  obs: string
  predicted: Dist
  updated: Dist
}

/**
 * Filtering: for each observation, predict then update. Returns the prior plus
 * one step per observation (predicted = before evidence, updated = after).
 */
export function filter(hmm: HMM, obs: string[]): { prior: Dist; steps: FilterStep[] } {
  let f = hmm.prior
  const steps: FilterStep[] = []
  for (const o of obs) {
    const predicted = predict(hmm, f)
    const updated = update(hmm, predicted, o)
    steps.push({ obs: o, predicted, updated })
    f = updated
  }
  return { prior: hmm.prior, steps }
}

/** Predict `k` steps ahead from `start` with no evidence (decays to stationary). */
export function predictAhead(hmm: HMM, start: Dist, k: number): Dist[] {
  const seq: Dist[] = [start]
  for (let i = 0; i < k; i++) seq.push(predict(hmm, seq[seq.length - 1]))
  return seq
}

/** Backward messages b_t (AIMA): b_T = 1; b_t = Σ P(e_{t+1}|x')·P(x'|x)·b_{t+1}. */
export function backward(hmm: HMM, obs: string[]): Dist[] {
  const n = obs.length
  const b: Dist[] = new Array(n + 1)
  b[n] = Object.fromEntries(hmm.states.map((s) => [s, 1]))
  for (let t = n - 1; t >= 0; t--) {
    const o = obs[t] // evidence at slice t+1 (1-indexed) → obs[t]
    const msg: Dist = {}
    for (const x of hmm.states) {
      msg[x] = hmm.states.reduce(
        (a, xn) => a + hmm.sensor[xn][o] * hmm.trans[x][xn] * b[t + 1][xn],
        0,
      )
    }
    b[t] = msg
  }
  return b
}

/** Forward–backward smoothing: smoothed_t ∝ f_t · b_t. */
export function smooth(hmm: HMM, obs: string[]): { filtered: Dist[]; smoothed: Dist[] } {
  const f = filter(hmm, obs)
  const forwards: Dist[] = [f.prior, ...f.steps.map((s) => s.updated)]
  const b = backward(hmm, obs)
  const smoothed: Dist[] = []
  for (let t = 1; t <= obs.length; t++) {
    const prod: Dist = {}
    for (const s of hmm.states) prod[s] = forwards[t][s] * b[t][s]
    smoothed.push(normalize(prod))
  }
  return { filtered: f.steps.map((s) => s.updated), smoothed }
}

export interface ViterbiResult {
  /** Best-path probability reaching each state at each time. */
  trellis: Dist[]
  /** Backpointers per step: state → best predecessor. */
  backptr: Record<string, string>[]
  /** The most likely state sequence. */
  path: string[]
}

/** Viterbi: most likely state sequence (max instead of sum). */
export function viterbi(hmm: HMM, obs: string[]): ViterbiResult {
  const trellis: Dist[] = []
  const backptr: Record<string, string>[] = []
  // t = 1
  let prev: Dist = {}
  for (const s of hmm.states) {
    prev[s] = hmm.states.reduce((a, from) => a + hmm.trans[from][s] * hmm.prior[from], 0)
    prev[s] *= hmm.sensor[s][obs[0]]
  }
  trellis.push(prev)
  backptr.push({})
  for (let t = 1; t < obs.length; t++) {
    const cur: Dist = {}
    const bp: Record<string, string> = {}
    for (const s of hmm.states) {
      let best = -1
      let arg = hmm.states[0]
      for (const from of hmm.states) {
        const v = prev[from] * hmm.trans[from][s]
        if (v > best) {
          best = v
          arg = from
        }
      }
      cur[s] = best * hmm.sensor[s][obs[t]]
      bp[s] = arg
    }
    trellis.push(cur)
    backptr.push(bp)
    prev = cur
  }
  // backtrace
  const path: string[] = new Array(obs.length)
  let last = hmm.states[0]
  for (const s of hmm.states) if (prev[s] > prev[last]) last = s
  path[obs.length - 1] = last
  for (let t = obs.length - 1; t > 0; t--) path[t - 1] = backptr[t][path[t]]
  return { trellis, backptr, path }
}
