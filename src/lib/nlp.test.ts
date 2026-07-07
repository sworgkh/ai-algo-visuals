import { describe, expect, it } from 'vitest'
import { coverage, lemmatize, stem, tokenize, wordFreq, zipfTable } from './nlp'

describe('tokenize', () => {
  it('lowercases and splits on non-letters, keeping internal apostrophes', () => {
    expect(tokenize("The cat's hat — 42 hats!")).toEqual(['the', "cat's", 'hat', 'hats'])
  })
  it('returns [] for empty / symbol-only input', () => {
    expect(tokenize('123 !!!')).toEqual([])
  })
})

describe('stem (rule-based, may not be a real word)', () => {
  it.each([
    ['cats', 'cat'],
    ['studies', 'study'],
    ['running', 'run'],
    ['hopped', 'hop'],
    ['quickly', 'quick'],
    ['boxes', 'box'],
    ['bring', 'bring'], // too short to strip -ing
  ])('stem(%s) = %s', (input, out) => {
    expect(stem(input)).toBe(out)
  })
})

describe('lemmatize (dictionary form, a real word)', () => {
  it.each([
    ['was', 'be'],
    ['mice', 'mouse'],
    ['studies', 'study'],
    ['cats', 'cat'],
    ['running', 'run'],
    ['saw', 'see'],
  ])('lemmatize(%s) = %s', (input, out) => {
    expect(lemmatize(input)).toBe(out)
  })

  it('differs from stem on words like "happily"', () => {
    expect(stem('happily')).toBe('happi') // crude
    expect(lemmatize('happily')).toBe('happily') // left intact (no rule)
  })
})

describe('frequency & Zipf', () => {
  const tokens = tokenize('the cat sat on the mat the cat ran')
  it('counts word frequencies', () => {
    const f = wordFreq(tokens)
    expect(f.get('the')).toBe(3)
    expect(f.get('cat')).toBe(2)
    expect(f.get('ran')).toBe(1)
  })
  it('ranks by descending frequency with 1-based ranks', () => {
    const z = zipfTable(tokens)
    expect(z[0]).toEqual({ word: 'the', rank: 1, freq: 3 })
    expect(z[1]).toEqual({ word: 'cat', rank: 2, freq: 2 })
    expect(z.map((e) => e.rank)).toEqual([1, 2, 3, 4, 5, 6])
    // ranks are contiguous and freqs are non-increasing
    for (let i = 1; i < z.length; i++) expect(z[i].freq).toBeLessThanOrEqual(z[i - 1].freq)
  })
})

describe('coverage / OOV', () => {
  const tokens = tokenize('the cat sat on the mat the cat ran') // 9 tokens, 6 types
  it('top word types cover the expected fraction of running tokens', () => {
    // top 2 types are "the"(3) + "cat"(2) = 5 of 9
    const c = coverage(tokens, 2)
    expect(c.total).toBe(9)
    expect(c.coverage).toBeCloseTo(5 / 9)
    expect(c.oovRate).toBeCloseTo(4 / 9)
  })
  it('full vocab gives 100% coverage, 0 OOV', () => {
    const c = coverage(tokens, 6)
    expect(c.coverage).toBeCloseTo(1)
    expect(c.oovRate).toBeCloseTo(0)
  })
})
