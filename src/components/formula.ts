/**
 * LaTeX authoring helpers for FormulaBlock.
 * Kept separate from the component file so fast-refresh stays happy.
 */

/** Wrap a sub-expression so FormulaBlock can highlight it by `key`. */
export function term(key: string, tex: string): string {
  return `\\htmlClass{fb-term fb-term--${key}}{${tex}}`
}
