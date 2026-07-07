import type { BayesNet } from '@/lib/bayesnet'

/**
 * The canonical AIMA burglary network.
 *   Burglary, Earthquake → Alarm → JohnCalls, MaryCalls
 * P(Burglary | JohnCalls, MaryCalls) = ⟨0.284, 0.716⟩.
 */
export const BURGLARY_NET: BayesNet = [
  { name: 'B', parents: [], cpt: { '': 0.001 } },
  { name: 'E', parents: [], cpt: { '': 0.002 } },
  { name: 'A', parents: ['B', 'E'], cpt: { TT: 0.95, TF: 0.94, FT: 0.29, FF: 0.001 } },
  { name: 'J', parents: ['A'], cpt: { T: 0.9, F: 0.05 } },
  { name: 'M', parents: ['A'], cpt: { T: 0.7, F: 0.01 } },
]

export const NODE_LABELS: Record<string, string> = {
  B: 'Burglary',
  E: 'Earthquake',
  A: 'Alarm',
  J: 'JohnCalls',
  M: 'MaryCalls',
}

/** Layout positions (0..1) for the DAG render. */
export const NODE_POS: Record<string, { x: number; y: number }> = {
  B: { x: 0.28, y: 0.12 },
  E: { x: 0.72, y: 0.12 },
  A: { x: 0.5, y: 0.5 },
  J: { x: 0.28, y: 0.88 },
  M: { x: 0.72, y: 0.88 },
}

/** Preset variable orderings for the ordering experiment. */
export const ORDERINGS: { id: string; label: string; order: string[] }[] = [
  { id: 'causal', label: 'Causal (B, E, A, J, M)', order: ['B', 'E', 'A', 'J', 'M'] },
  { id: 'mja', label: 'M, J, A, B, E', order: ['M', 'J', 'A', 'B', 'E'] },
  { id: 'mje', label: 'M, J, E, B, A', order: ['M', 'J', 'E', 'B', 'A'] },
]
