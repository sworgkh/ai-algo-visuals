import { describe, expect, it } from 'vitest'
import {
  BOS,
  EOS,
  buildBigram,
  laplace,
  mle,
  nextWordDist,
  perplexity,
  sentenceProb,
} from './langmodel'

// the cat sat / the cat ran / the dog sat
const SENTS = [
  ['the', 'cat', 'sat'],
  ['the', 'cat', 'ran'],
  ['the', 'dog', 'sat'],
]
const M = buildBigram(SENTS)

describe('bigram counts', () => {
  it('counts following-word frequencies with boundaries', () => {
    expect(M.counts.get(BOS)!.get('the')).toBe(3)
    expect(M.counts.get('the')!.get('cat')).toBe(2)
    expect(M.counts.get('the')!.get('dog')).toBe(1)
    expect(M.counts.get('sat')!.get(EOS)).toBe(2)
  })
  it('vocab is the set of predictable tokens (words + EOS)', () => {
    expect([...M.vocab].sort()).toEqual([EOS, 'cat', 'dog', 'ran', 'sat', 'the'])
  })
})

describe('MLE', () => {
  it('P(cat|the)=2/3, P(dog|the)=1/3 and the distribution sums to 1', () => {
    expect(mle(M, 'the', 'cat')).toBeCloseTo(2 / 3)
    expect(mle(M, 'the', 'dog')).toBeCloseTo(1 / 3)
    expect(mle(M, 'the', 'cat') + mle(M, 'the', 'dog')).toBeCloseTo(1)
  })
  it('assigns zero to an unseen bigram', () => {
    expect(mle(M, 'dog', 'ran')).toBe(0)
  })
})

describe('Laplace (add-1) smoothing', () => {
  it('gives an unseen bigram positive probability', () => {
    // V = 6, count(dog,ran)=0, total(dog)=1 → (0+1)/(1+6) = 1/7
    expect(laplace(M, 'dog', 'ran', 1)).toBeCloseTo(1 / 7)
  })
  it('pulls a seen bigram toward uniform', () => {
    // (2+1)/(3+6) = 3/9 = 1/3, less peaked than the MLE 2/3
    expect(laplace(M, 'the', 'cat', 1)).toBeCloseTo(1 / 3)
    expect(laplace(M, 'the', 'cat', 1)).toBeLessThan(mle(M, 'the', 'cat'))
  })
})

describe('sentence probability & perplexity', () => {
  it('multiplies bigram probs via the chain rule', () => {
    // P(the|<s>)·P(cat|the)·P(sat|cat)·P(</s>|sat) = 1 · 2/3 · 1/2 · 1 = 1/3
    expect(sentenceProb(M, ['the', 'cat', 'sat'], 0)).toBeCloseTo(1 / 3)
  })
  it('is Infinity when a sentence contains an unseen bigram (MLE)', () => {
    expect(perplexity(M, ['the', 'dog', 'ran'], 0)).toBe(Infinity)
  })
  it('is finite once smoothing is applied', () => {
    expect(perplexity(M, ['the', 'dog', 'ran'], 1)).toBeLessThan(Infinity)
    expect(perplexity(M, ['the', 'dog', 'ran'], 1)).toBeGreaterThan(1)
  })
  it('lower perplexity for a more probable sentence', () => {
    const pp = perplexity(M, ['the', 'cat', 'sat'], 0)
    expect(pp).toBeCloseTo((1 / 3) ** (-1 / 4)) // N=4 predicted tokens
  })
})

describe('next-word distribution', () => {
  it('is sorted by probability and sums to 1 under MLE', () => {
    const d = nextWordDist(M, 'the', 0)
    expect(d[0].word).toBe('cat')
    expect(d.reduce((a, e) => a + e.p, 0)).toBeCloseTo(1)
  })
})
