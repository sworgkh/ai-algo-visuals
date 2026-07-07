/**
 * Discrete-probability core over a full joint distribution of boolean variables.
 * Supports inference by enumeration, marginalization, conditional probability,
 * and a couple of textbook comparisons. Pure and synchronous for testing + UI.
 */

export type Assignment = Record<string, boolean>

export interface JointEntry {
  assign: Assignment
  p: number
}

export interface Joint {
  vars: string[]
  entries: JointEntry[]
}

/** Does `entry` agree with every variable fixed in `condition`? */
function matches(entry: JointEntry, condition: Assignment): boolean {
  return Object.entries(condition).every(([v, val]) => entry.assign[v] === val)
}

/** Entries consistent with a (possibly partial) assignment. */
export function rowsMatching(joint: Joint, condition: Assignment): JointEntry[] {
  return joint.entries.filter((e) => matches(e, condition))
}

/** Total probability mass of a (possibly partial) assignment: P(condition). */
export function prob(joint: Joint, condition: Assignment): number {
  return rowsMatching(joint, condition).reduce((a, e) => a + e.p, 0)
}

/** Conditional probability P(target | given) = P(target ∧ given) / P(given). */
export function condProb(joint: Joint, target: Assignment, given: Assignment): number {
  const denom = prob(joint, given)
  if (denom === 0) return NaN
  return prob(joint, { ...given, ...target }) / denom
}

export interface QueryBranch {
  value: boolean
  /** Joint cells summed for this branch (query=value ∧ evidence). */
  cells: JointEntry[]
  /** Unnormalized Σ P(query=value, evidence). */
  sum: number
  /** Normalized P(query=value | evidence). */
  normalized: number
}

export interface QueryResult {
  queryVar: string
  evidence: Assignment
  branches: QueryBranch[]
  /** Normalization constant α = 1 / Σ. */
  alpha: number
}

/**
 * Inference by enumeration: P(queryVar | evidence). For each value of the query
 * variable, sum the joint cells consistent with (query=value ∧ evidence), then
 * normalize by α = 1 / Σ. Returns the cells per branch so the UI can show which
 * ones were summed.
 */
export function enumerateQuery(
  joint: Joint,
  queryVar: string,
  evidence: Assignment = {},
): QueryResult {
  const branchOf = (value: boolean): QueryBranch => {
    const cells = rowsMatching(joint, { ...evidence, [queryVar]: value })
    const sum = cells.reduce((a, e) => a + e.p, 0)
    return { value, cells, sum, normalized: 0 }
  }
  const branches = [branchOf(true), branchOf(false)]
  const total = branches[0].sum + branches[1].sum
  const alpha = total === 0 ? 0 : 1 / total
  for (const b of branches) b.normalized = b.sum * alpha
  return { queryVar, evidence, branches, alpha }
}

// ---------------------------------------------------------------------------
// Bayes' rule (two-hypothesis diagnostic test)
// ---------------------------------------------------------------------------

export interface BayesResult {
  prior: number
  sensitivity: number
  falsePositive: number
  /** P(positive) = sens·prior + fp·(1−prior). */
  evidenceProb: number
  /** P(disease | positive). */
  posterior: number
  /** Joint masses, for the mass-flow diagram. */
  truePositive: number
  falsePositiveMass: number
}

export function bayesTest(prior: number, sensitivity: number, falsePositive: number): BayesResult {
  const tp = sensitivity * prior
  const fp = falsePositive * (1 - prior)
  const evidenceProb = tp + fp
  return {
    prior,
    sensitivity,
    falsePositive,
    evidenceProb,
    posterior: evidenceProb === 0 ? 0 : tp / evidenceProb,
    truePositive: tp,
    falsePositiveMass: fp,
  }
}

// ---------------------------------------------------------------------------
// Parameter counts: full joint vs naïve Bayes
// ---------------------------------------------------------------------------

/** Independent parameters in a full joint over n boolean vars: 2^n − 1. */
export const fullJointParams = (n: number): number => 2 ** n - 1

/** Naïve Bayes over n boolean features + 1 boolean class: 2n + 1. */
export const naiveBayesParams = (n: number): number => 2 * n + 1
