import { describe, expect, it } from 'vitest'
import {
  bayesTest,
  condProb,
  enumerateQuery,
  fullJointParams,
  naiveBayesParams,
  prob,
} from './probability'
import { DENTIST_JOINT } from '@/topics/topic04-uncertainty/domain'
import { UNCERTAINTY_EXAMPLES } from '@/topics/topic04-uncertainty/examples'

const close = (a: number, b: number) => expect(a).toBeCloseTo(b, 6)

describe('joint distribution (AIMA dentist)', () => {
  it('sums to 1', () => {
    close(DENTIST_JOINT.entries.reduce((a, e) => a + e.p, 0), 1)
  })

  it('marginals: P(cavity)=0.2, P(toothache)=0.2', () => {
    close(prob(DENTIST_JOINT, { Cavity: true }), 0.2)
    close(prob(DENTIST_JOINT, { Toothache: true }), 0.2)
  })

  it('P(cavity | toothache) = <0.6, 0.4> by enumeration', () => {
    const r = enumerateQuery(DENTIST_JOINT, 'Cavity', { Toothache: true })
    close(r.branches[0].sum, 0.12) // cavity ∧ toothache
    close(r.branches[1].sum, 0.08) // ¬cavity ∧ toothache
    close(r.alpha, 5)
    close(r.branches[0].normalized, 0.6)
    close(r.branches[1].normalized, 0.4)
  })
})

describe('conditional independence: Toothache ⊥ Catch | Cavity', () => {
  it('P(catch | cavity) = P(catch | toothache, cavity) = 0.9', () => {
    close(condProb(DENTIST_JOINT, { Catch: true }, { Cavity: true }), 0.9)
    close(condProb(DENTIST_JOINT, { Catch: true }, { Cavity: true, Toothache: true }), 0.9)
    close(condProb(DENTIST_JOINT, { Catch: true }, { Cavity: true, Toothache: false }), 0.9)
  })

  it('but Toothache and Catch are NOT marginally independent', () => {
    const pCatch = prob(DENTIST_JOINT, { Catch: true })
    const pCatchGivenTooth = condProb(DENTIST_JOINT, { Catch: true }, { Toothache: true })
    expect(Math.abs(pCatch - pCatchGivenTooth)).toBeGreaterThan(0.05)
  })
})

describe("Bayes' rule diagnostic test", () => {
  it('base-rate fallacy: rare disease, good test, still low posterior', () => {
    // prior 1%, 90% sensitivity, 9.6% false-positive → ~8.7% posterior
    const r = bayesTest(0.01, 0.9, 0.096)
    close(r.posterior, 0.009 / (0.009 + 0.09504))
    expect(r.posterior).toBeLessThan(0.1)
  })

  it('posterior rises with prior', () => {
    const lo = bayesTest(0.01, 0.9, 0.1).posterior
    const hi = bayesTest(0.5, 0.9, 0.1).posterior
    expect(hi).toBeGreaterThan(lo)
  })
})

describe('all uncertainty examples', () => {
  it('each joint sums to 1 and has effect₁ ⟂ effect₂ | cause', () => {
    for (const ex of UNCERTAINTY_EXAMPLES) {
      const [cause, e1, e2] = ex.joint.vars
      close(ex.joint.entries.reduce((a, e) => a + e.p, 0), 1)
      // conditional independence given the cause holds for both cause values
      for (const c of [true, false]) {
        const withE1 = condProb(ex.joint, { [e2]: true }, { [e1]: true, [cause]: c })
        const withoutE1 = condProb(ex.joint, { [e2]: true }, { [e1]: false, [cause]: c })
        close(withE1, withoutE1)
      }
    }
  })

  it('but the two effects are marginally correlated (bars differ)', () => {
    for (const ex of UNCERTAINTY_EXAMPLES) {
      const [, e1, e2] = ex.joint.vars
      const withE1 = condProb(ex.joint, { [e2]: true }, { [e1]: true })
      const withoutE1 = condProb(ex.joint, { [e2]: true }, { [e1]: false })
      expect(Math.abs(withE1 - withoutE1)).toBeGreaterThan(0.02)
    }
  })
})

describe('parameter counts', () => {
  it('full joint = 2^n − 1, naïve Bayes = 2n + 1', () => {
    expect(fullJointParams(3)).toBe(7)
    expect(naiveBayesParams(3)).toBe(7)
    expect(fullJointParams(10)).toBe(1023)
    expect(naiveBayesParams(10)).toBe(21)
    expect(fullJointParams(20)).toBe(1048575)
    expect(naiveBayesParams(20)).toBe(41)
  })
})
