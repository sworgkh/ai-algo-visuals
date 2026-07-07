import { tokenize } from '@/lib/nlp'
import { buildBigram } from '@/lib/langmodel'

/**
 * A small themed corpus with heavily overlapping vocabulary, so the bigram
 * distributions are interesting (several plausible next words per context).
 */
export const CORPUS_SENTENCES = [
  'the cat sat on the mat',
  'the cat chased the mouse',
  'the dog chased the cat',
  'the dog sat on the rug',
  'a cat and a dog sat',
  'the mouse ran from the cat',
  'the dog ran in the park',
  'the cat sat in the sun',
  'a dog chased a ball',
  'the cat and the dog played',
]

export const SENTENCES: string[][] = CORPUS_SENTENCES.map((s) => tokenize(s))
export const MODEL = buildBigram(SENTENCES)

/** Preset sentences to score — the last one contains an unseen bigram. */
export const PRESETS = [
  'the cat sat on the mat',
  'the dog chased the cat',
  'a cat ran in the park',
  'the mouse played the piano', // "the piano" / "mouse played" unseen → zero prob under MLE
]
