import type { Joint } from '@/lib/probability'

/**
 * The canonical AIMA dentistry joint distribution over three boolean variables
 * — Cavity, Toothache, Catch (does the dentist's probe catch?). Sums to 1.
 *
 *              toothache            ¬toothache
 *           catch   ¬catch        catch   ¬catch
 *   cavity  .108     .012          .072     .008
 *  ¬cavity  .016     .064          .144     .576
 */
export const DENTIST_VARS = ['Cavity', 'Toothache', 'Catch'] as const

const row = (Cavity: boolean, Toothache: boolean, Catch: boolean, p: number) => ({
  assign: { Cavity, Toothache, Catch },
  p,
})

export const DENTIST_JOINT: Joint = {
  vars: [...DENTIST_VARS],
  entries: [
    row(true, true, true, 0.108),
    row(true, true, false, 0.012),
    row(true, false, true, 0.072),
    row(true, false, false, 0.008),
    row(false, true, true, 0.016),
    row(false, true, false, 0.064),
    row(false, false, true, 0.144),
    row(false, false, false, 0.576),
  ],
}
