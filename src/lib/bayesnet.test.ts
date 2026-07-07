import { describe, expect, it } from 'vitest'
import {
  arcCount,
  enumerationAsk,
  enumerationTerms,
  markovBlanket,
  minimalParents,
  paramCount,
} from './bayesnet'
import { BURGLARY_NET, ORDERINGS } from '@/topics/topic05-bayes-nets/domain'

const close = (a: number, b: number, d = 4) => expect(a).toBeCloseTo(b, d)

describe('Bayes net — burglary network inference', () => {
  it('P(Burglary | JohnCalls, MaryCalls) = ⟨0.284, 0.716⟩', () => {
    const r = enumerationAsk(BURGLARY_NET, 'B', { J: true, M: true })
    close(r.true, 0.2842)
    close(r.false, 0.7158)
  })

  it('P(Alarm) marginal ≈ 0.00252', () => {
    close(enumerationAsk(BURGLARY_NET, 'A', {}).true, 0.002516, 5)
  })

  it('enumeration terms multiply out and sum to the unnormalized value', () => {
    const t = enumerationTerms(BURGLARY_NET, 'B', true, { J: true, M: true })
    // hidden vars are E, A → 4 terms
    expect(t.terms).toHaveLength(4)
    const raw = enumerationAsk(BURGLARY_NET, 'B', { J: true, M: true }).rawTrue
    close(t.sum, raw, 8)
    // each factor product uses all 5 nodes
    expect(t.terms[0].factors).toHaveLength(5)
  })
})

describe('Markov blanket', () => {
  it('MB(Alarm) = {B, E, J, M}; MB(Burglary) = {A, E}', () => {
    expect(markovBlanket(BURGLARY_NET, 'A').sort()).toEqual(['B', 'E', 'J', 'M'])
    expect(markovBlanket(BURGLARY_NET, 'B').sort()).toEqual(['A', 'E'])
    expect(markovBlanket(BURGLARY_NET, 'J').sort()).toEqual(['A'])
  })
})

describe('variable ordering', () => {
  it('causal order reproduces the minimal net (4 arcs, 10 params)', () => {
    const causal = ORDERINGS.find((o) => o.id === 'causal')!.order
    const learned = minimalParents(BURGLARY_NET, causal)
    const net = learned.map((n) => ({ ...n, cpt: {} }))
    expect(arcCount(net)).toBe(4)
    expect(paramCount(net)).toBe(10)
    // Alarm gets both B and E; J and M get only A
    expect(learned.find((n) => n.name === 'A')!.parents.sort()).toEqual(['B', 'E'])
    expect(learned.find((n) => n.name === 'J')!.parents).toEqual(['A'])
  })

  it('non-causal order M,J,A,B,E needs more arcs & params (AIMA: 6 arcs, 13 params)', () => {
    const order = ORDERINGS.find((o) => o.id === 'mja')!.order
    const learned = minimalParents(BURGLARY_NET, order)
    const net = learned.map((n) => ({ ...n, cpt: {} }))
    expect(arcCount(net)).toBe(6)
    expect(paramCount(net)).toBe(13)
  })
})
