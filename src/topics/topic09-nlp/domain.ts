/**
 * Sample corpus + canonical ambiguity examples for the NLP foundations topic.
 * The corpus is original expository prose (no copyright), long enough that its
 * word frequencies show a clear Zipfian shape.
 */
export const CORPUS = `
Language is the way people share what they think, and it is the way people
learn what other people think. A machine that reads language must first break
the text into pieces, because a computer does not see words the way a person
sees words. It sees only symbols, and it must learn which symbols matter and
which symbols do not. The most common words appear again and again, while most
words appear only once or twice. This is why language is hard for a machine:
the machine must handle the common words and the rare words at the same time.
When the machine meets a word it has never seen, it must still do something
useful with that word, and that is one of the oldest problems in the study of
language. People solve these problems without effort, because people learn
language as children, but a machine must learn language from data, and data is
never complete. The more text a machine reads, the more words it learns, yet
there are always new words, new names, and new ways to say old things. So the
work of language never ends, and the machine must keep learning as language
keeps changing, the way people keep changing the way they speak.
`

export interface AmbiguityExample {
  type: string
  tag: string
  sentence: string
  /** The ambiguous span to highlight in the sentence. */
  span: string
  readings: { label: string; gloss: string }[]
}

export const AMBIGUITIES: AmbiguityExample[] = [
  {
    type: 'Lexical (word-sense)',
    tag: 'lexical',
    sentence: 'I left my money at the bank.',
    span: 'bank',
    readings: [
      { label: 'financial institution', gloss: 'a place that holds money' },
      { label: 'river bank', gloss: 'the land beside a river' },
    ],
  },
  {
    type: 'Syntactic (structural)',
    tag: 'syntactic',
    sentence: 'I saw the man with the telescope.',
    span: 'with the telescope',
    readings: [
      { label: 'attaches to “saw”', gloss: 'I used the telescope to see the man.' },
      { label: 'attaches to “the man”', gloss: 'The man who had the telescope.' },
    ],
  },
  {
    type: 'Semantic / referential',
    tag: 'semantic',
    sentence: 'The trophy did not fit in the suitcase because it was too big.',
    span: 'it',
    readings: [
      { label: '“it” = the trophy', gloss: 'The trophy was too big — the natural reading.' },
      { label: '“it” = the suitcase', gloss: 'Grammatically possible; needs world knowledge to rule out.' },
    ],
  },
]

export const NLP_TASKS = [
  'Tokenization',
  'Part-of-speech tagging',
  'Parsing',
  'Named-entity recognition',
  'Sentiment analysis',
  'Machine translation',
  'Question answering',
  'Summarization',
]
