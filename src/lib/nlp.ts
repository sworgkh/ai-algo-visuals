/**
 * Small, deterministic NLP primitives for the foundations topic: tokenization,
 * a documented rule-based stemmer, a dictionary-style lemmatizer, and
 * frequency / Zipf / vocabulary-coverage analysis. Not linguistically complete
 * — just faithful enough to show the ideas, and fully testable.
 */

/** Lowercase and split on runs of non-letters (apostrophes kept inside words). */
export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) ?? []).filter(Boolean)
}

const isVowel = (c: string) => 'aeiou'.includes(c)

/** Strip a trailing doubled consonant (runn → run), leaving vowels alone. */
function undouble(w: string): string {
  const n = w.length
  if (n >= 2 && w[n - 1] === w[n - 2] && !isVowel(w[n - 1])) return w.slice(0, -1)
  return w
}

/**
 * Crude suffix-stripping stemmer (a small Porter-flavored subset). Produces a
 * stem that may not be a real word — that's the point vs. lemmatization.
 */
export function stem(word: string): string {
  let w = word
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y'
  if (w.length > 3 && w.endsWith('es')) w = w.slice(0, -2)
  else if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1)
  if (w.length > 5 && w.endsWith('ing')) return undouble(w.slice(0, -3))
  if (w.length > 4 && w.endsWith('ed')) return undouble(w.slice(0, -2))
  if (w.length > 4 && w.endsWith('ly')) return w.slice(0, -2)
  return w
}

const IRREGULAR: Record<string, string> = {
  is: 'be', am: 'be', are: 'be', was: 'be', were: 'be', been: 'be', being: 'be',
  has: 'have', had: 'have', having: 'have',
  went: 'go', gone: 'go', goes: 'go', going: 'go',
  mice: 'mouse', men: 'man', women: 'woman', children: 'child', feet: 'foot',
  better: 'good', best: 'good', worse: 'bad',
  saw: 'see', seen: 'see', seeing: 'see',
}

/** Reduce a word to its dictionary lemma (a real word), unlike `stem`. */
export function lemmatize(word: string): string {
  if (IRREGULAR[word]) return IRREGULAR[word]
  if (word.length > 4 && word.endsWith('ies')) return word.slice(0, -3) + 'y'
  if (word.length > 4 && word.endsWith('ing')) {
    const base = undouble(word.slice(0, -3))
    return base.length >= 3 ? base : word
  }
  if (word.length > 3 && word.endsWith('ed')) {
    const base = undouble(word.slice(0, -2))
    return base.length >= 3 ? base : word
  }
  if (word.length > 3 && word.endsWith('es')) return word.slice(0, -2)
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}

export function wordFreq(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const t of tokens) m.set(t, (m.get(t) ?? 0) + 1)
  return m
}

export interface ZipfEntry {
  word: string
  rank: number
  freq: number
}

/** Words sorted by descending frequency, with 1-based ranks (ties by spelling). */
export function zipfTable(tokens: string[]): ZipfEntry[] {
  const freq = wordFreq(tokens)
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([word, f], i) => ({ word, rank: i + 1, freq: f }))
}

export interface Coverage {
  vocabSize: number
  /** Fraction of running tokens covered by the top-`vocabSize` word types. */
  coverage: number
  /** Fraction of running tokens that would be out-of-vocabulary. */
  oovRate: number
  /** Total token count. */
  total: number
}

/** How much of the corpus the most frequent `vocabSize` word types cover. */
export function coverage(tokens: string[], vocabSize: number): Coverage {
  const table = zipfTable(tokens)
  const total = tokens.length
  const covered = table.slice(0, vocabSize).reduce((a, e) => a + e.freq, 0)
  const cov = total === 0 ? 0 : covered / total
  return { vocabSize, coverage: cov, oovRate: 1 - cov, total }
}
