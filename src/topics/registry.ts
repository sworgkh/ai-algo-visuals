import { lazy } from 'react'
import type { ComponentType, LazyExoticComponent } from 'react'

/**
 * Single source of truth for the 10 course topics.
 *
 * The sidebar, router and Home page all read from this list. To bring a topic
 * online: implement its page, add a `lazy(() => import(...))` to `Component`,
 * and flip `status` to `'available'`. Nothing else needs to change.
 */

export type TopicStatus = 'available' | 'coming-soon'

export interface Topic {
  /** 1-based course number. */
  num: number
  /** URL slug: /topic/<slug> */
  slug: string
  title: string
  /** One-line hook shown under the title. */
  tagline: string
  /** Key concepts — rendered as chips on the topic page. */
  concepts: string[]
  status: TopicStatus
  /** Lazily-loaded page; present only once the topic is built. */
  Component?: LazyExoticComponent<ComponentType>
}

export const TOPICS: Topic[] = [
  {
    num: 1,
    slug: 'search',
    title: 'Search Foundations',
    tagline: 'BFS, DFS, IDDFS, UCS, Greedy & A★ — frontier vs. explored, admissibility.',
    concepts: [
      'Formal search problem',
      'BFS / DFS / IDDFS',
      'Uniform-cost search',
      'Greedy & A*',
      'Admissible & consistent heuristics',
      'O(b^d) vs O(b·m)',
    ],    status: 'coming-soon',
  },
  {
    num: 2,
    slug: 'pop',
    title: 'Planning, STRIPS & POP',
    tagline: 'STRIPS operators, regression, and partial-order planning with causal links & threats.',
    concepts: [
      'Search vs. planning',
      'STRIPS (precond / add / delete)',
      'Forward & backward (regression)',
      'Partial-order planning',
      'Causal links & threats',
      'Promotion / demotion',
    ],    status: 'available',
    Component: lazy(() => import('./topic02-pop')),
  },
  {
    num: 3,
    slug: 'real-world-planning',
    title: 'Planning in the Real World',
    tagline: 'HTN decomposition, critical-path scheduling (ES/LS/slack), resources.',
    concepts: [
      'Hierarchical planning (HTN)',
      'HLA & refinements',
      'Critical path (ES / LS / slack)',
      'Reusable vs. consumable resources',
      'Conformant / contingent / online',
    ],
    status: 'available',
    Component: lazy(() => import('./topic03-real-world-planning')),
  },
  {
    num: 4,
    slug: 'uncertainty',
    title: 'Quantifying Uncertainty',
    tagline: 'Joint distributions, enumeration, normalization (α), Bayes’ rule, naïve Bayes.',
    concepts: [
      'Probability axioms',
      'Joint distributions',
      'Inference by enumeration',
      'Marginalization & normalization',
      '(Conditional) independence',
      'Bayes’ rule',
    ],
    status: 'available',
    Component: lazy(() => import('./topic04-uncertainty')),
  },
  {
    num: 5,
    slug: 'bayes-nets',
    title: 'Bayesian Networks',
    tagline: 'DAG + CPTs, global semantics, Markov blanket, enumeration & elimination.',
    concepts: [
      'DAG + CPTs',
      'Global semantics ∏ P(xᵢ|parents)',
      'Markov blanket',
      'Variable ordering',
      'Explaining away',
      'Variable elimination',
    ],    status: 'coming-soon',
  },
  {
    num: 6,
    slug: 'temporal',
    title: 'Temporal Models',
    tagline: 'Filtering (predict→update), prediction decay, smoothing, Viterbi.',
    concepts: [
      'Markov & sensor assumptions',
      'Filtering recursion',
      'Prediction & decay',
      'Forward–backward smoothing',
      'Viterbi (most likely path)',
    ],    status: 'coming-soon',
  },
  {
    num: 7,
    slug: 'hmm',
    title: 'Hidden Markov Models',
    tagline: 'Matrix form of filtering/smoothing/Viterbi; the mega-variable blowup.',
    concepts: [
      'Single discrete state',
      'Transition & sensor matrices',
      'Matrix filtering / smoothing',
      'Matrix Viterbi',
      'Mega-variable blowup',
    ],    status: 'coming-soon',
  },
  {
    num: 8,
    slug: 'particle-filter',
    title: 'DBN & Particle Filtering',
    tagline: 'DBN structure, HMM↔DBN, sample→weight→resample localization.',
    concepts: [
      'DBN intra/inter-slice arcs',
      'HMM vs. DBN factorization',
      'Intractability of exact inference',
      'Particle filtering',
      'Sample → weight → resample',
    ],    status: 'coming-soon',
  },
  {
    num: 9,
    slug: 'nlp',
    title: 'NLP Foundations',
    tagline: 'Tasks, three ambiguities, pipeline vs. neural, tokenization, Zipf & OOV.',
    concepts: [
      'NLP tasks',
      'Three ambiguity types',
      'Pipeline vs. end-to-end',
      'Tokenization / lemmatization / stemming',
      'Zipf’s law & OOV',
    ],    status: 'coming-soon',
  },
  {
    num: 10,
    slug: 'language-models',
    title: 'Language Models',
    tagline: 'n-grams, MLE, chain-rule vs. bigram, perplexity, smoothing.',
    concepts: [
      'Bag of words',
      'n-gram models & Markov assumption',
      'MLE estimation',
      'Chain rule vs. bigram trap',
      'Perplexity',
      'Laplace / backoff / interpolation',
    ],    status: 'coming-soon',
  },
]

export const topicBySlug = (slug: string): Topic | undefined =>
  TOPICS.find((t) => t.slug === slug)
