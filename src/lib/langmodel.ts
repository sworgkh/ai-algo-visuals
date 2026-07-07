/**
 * Bigram language model: MLE estimation, add-α (Laplace) smoothing, sentence
 * probability via the chain rule under the Markov assumption, and perplexity.
 * Pure and deterministic for testing. Sentences are padded with <s> / </s>.
 */

export const BOS = '<s>'
export const EOS = '</s>'

export interface BigramModel {
  /** context word → (next word → count). */
  counts: Map<string, Map<string, number>>
  /** context word → total count of following words. */
  contextTotals: Map<string, number>
  /** predictable vocabulary (real words + EOS), for smoothing denominators. */
  vocab: string[]
}

/** Build a bigram model from already-tokenized sentences (no boundaries yet). */
export function buildBigram(sentences: string[][]): BigramModel {
  const counts = new Map<string, Map<string, number>>()
  const contextTotals = new Map<string, number>()
  const vocab = new Set<string>([EOS])

  for (const raw of sentences) {
    const s = [BOS, ...raw, EOS]
    for (const w of raw) vocab.add(w)
    for (let i = 0; i < s.length - 1; i++) {
      const ctx = s[i]
      const next = s[i + 1]
      if (!counts.has(ctx)) counts.set(ctx, new Map())
      const row = counts.get(ctx)!
      row.set(next, (row.get(next) ?? 0) + 1)
      contextTotals.set(ctx, (contextTotals.get(ctx) ?? 0) + 1)
    }
  }
  return { counts, contextTotals, vocab: [...vocab] }
}

/** Maximum-likelihood P(word | context) = count(ctx, word) / count(ctx). */
export function mle(model: BigramModel, ctx: string, word: string): number {
  const total = model.contextTotals.get(ctx) ?? 0
  if (total === 0) return 0
  return (model.counts.get(ctx)?.get(word) ?? 0) / total
}

/** Add-α (Laplace when α=1) smoothed P(word | context). Never zero for α>0. */
export function laplace(model: BigramModel, ctx: string, word: string, alpha: number): number {
  const total = model.contextTotals.get(ctx) ?? 0
  const c = model.counts.get(ctx)?.get(word) ?? 0
  const v = model.vocab.length
  return (c + alpha) / (total + alpha * v)
}

export interface StepProb {
  ctx: string
  word: string
  p: number
}

/** The bigram chain-rule breakdown of a sentence: one P(wᵢ | wᵢ₋₁) per step. */
export function sentenceSteps(
  model: BigramModel,
  sentence: string[],
  alpha: number,
): StepProb[] {
  const s = [BOS, ...sentence, EOS]
  const steps: StepProb[] = []
  for (let i = 0; i < s.length - 1; i++) {
    const ctx = s[i]
    const word = s[i + 1]
    const p = alpha > 0 ? laplace(model, ctx, word, alpha) : mle(model, ctx, word)
    steps.push({ ctx, word, p })
  }
  return steps
}

/** Product of the per-step probabilities (0 if any step is 0 under MLE). */
export function sentenceProb(model: BigramModel, sentence: string[], alpha: number): number {
  return sentenceSteps(model, sentence, alpha).reduce((acc, s) => acc * s.p, 1)
}

/**
 * Perplexity = P(sentence)^(-1/N), N = number of predicted tokens. Returns
 * Infinity if any step has probability 0 (the zero-probability problem).
 */
export function perplexity(model: BigramModel, sentence: string[], alpha: number): number {
  const steps = sentenceSteps(model, sentence, alpha)
  if (steps.some((s) => s.p === 0)) return Infinity
  const sumLog = steps.reduce((acc, s) => acc + Math.log2(s.p), 0)
  return 2 ** (-sumLog / steps.length)
}

/** Next-word distribution for a context, sorted by probability (for display). */
export function nextWordDist(
  model: BigramModel,
  ctx: string,
  alpha: number,
): { word: string; p: number; count: number }[] {
  const row = model.counts.get(ctx)
  const words = alpha > 0 ? model.vocab : [...(row?.keys() ?? [])]
  return words
    .map((word) => ({
      word,
      p: alpha > 0 ? laplace(model, ctx, word, alpha) : mle(model, ctx, word),
      count: row?.get(word) ?? 0,
    }))
    .filter((e) => e.p > 0)
    .sort((a, b) => b.p - a.p || a.word.localeCompare(b.word))
}
