import type { Joint } from '@/lib/probability'
import { DENTIST_JOINT } from './domain'

export interface UncertaintyExample {
  id: string
  label: string
  /** Short structure note, e.g. "Cavity → Toothache, Catch". */
  note: string
  /** Full joint over [cause, effect1, effect2]. */
  joint: Joint
}

/**
 * Build a full joint over three booleans [cause, e1, e2] from a naïve-Bayes
 * model  P(cause)·P(e1|cause)·P(e2|cause).  By construction e1 ⟂ e2 | cause,
 * so the conditional-independence demo holds for every example.
 */
function naiveBayesJoint(
  vars: [string, string, string],
  pCause: number,
  pE1given: number,
  pE1givenNot: number,
  pE2given: number,
  pE2givenNot: number,
): Joint {
  const [C, E1, E2] = vars
  const pick = (on: boolean, given: number, givenNot: number, cause: boolean) => {
    const base = cause ? given : givenNot
    return on ? base : 1 - base
  }
  const entries = []
  for (const c of [true, false]) {
    for (const e1 of [true, false]) {
      for (const e2 of [true, false]) {
        const p =
          (c ? pCause : 1 - pCause) *
          pick(e1, pE1given, pE1givenNot, c) *
          pick(e2, pE2given, pE2givenNot, c)
        entries.push({ assign: { [C]: c, [E1]: e1, [E2]: e2 }, p })
      }
    }
  }
  return { vars, entries }
}

export const UNCERTAINTY_EXAMPLES: UncertaintyExample[] = [
  {
    id: 'dentist',
    label: 'Dentistry',
    note: 'Cavity → Toothache, Catch',
    joint: DENTIST_JOINT,
  },
  {
    id: 'flu',
    label: 'Flu diagnosis',
    note: 'Flu → Fever, Cough',
    joint: naiveBayesJoint(['Flu', 'Fever', 'Cough'], 0.1, 0.8, 0.1, 0.7, 0.2),
  },
  {
    id: 'spam',
    label: 'Spam filter',
    note: 'Spam → “free”, “prize”',
    joint: naiveBayesJoint(['Spam', 'Free', 'Prize'], 0.4, 0.6, 0.1, 0.5, 0.05),
  },
]
