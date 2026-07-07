import { useLayoutEffect, useMemo, useRef } from 'react'
import katex from 'katex'
import './FormulaBlock.css'

/**
 * Renders LaTeX with KaTeX and supports **per-term highlighting** synced to a
 * visualization step — the load-bearing requirement of this course portal.
 *
 * Authoring: wrap any highlightable sub-expression with `term(key, tex)`, e.g.
 *
 *   const tex = `P(X_t \\mid e_{1:t}) = ${term('norm', '\\alpha')}\\,
 *                ${term('update', 'P(e_t \\mid X_t)')}\\,
 *                ${term('predict', '\\sum_{x} P(X_t \\mid x) f_x')}`
 *
 * Then drive it from the StepPlayer:  <FormulaBlock tex={tex} activeTerms={['predict']} />
 * and the prediction term glows while the rest dims.
 *
 * The `term(key, tex)` authoring helper lives in `./formula`.
 */

export interface FormulaBlockProps {
  /** LaTeX source. Use `term(key, ...)` to mark highlightable parts. */
  tex: string
  /** Block (centered, larger) vs inline. Default: block. */
  display?: boolean
  /** Term keys to highlight right now. Others dim when any are active. */
  activeTerms?: string[]
  /** Accessible description of the equation (screen readers can't read math markup). */
  ariaLabel?: string
  className?: string
}

export function FormulaBlock({
  tex,
  display = true,
  activeTerms,
  ariaLabel,
  className,
}: FormulaBlockProps) {
  const ref = useRef<HTMLDivElement>(null)

  const html = useMemo(
    () =>
      katex.renderToString(tex, {
        displayMode: display,
        throwOnError: false,
        // All LaTeX is authored in-repo (static), so \htmlClass is safe to trust.
        trust: true,
        strict: 'ignore',
        output: 'html',
      }),
    [tex, display],
  )

  // Inject rendered math once per formula change.
  useLayoutEffect(() => {
    if (ref.current) ref.current.innerHTML = html
  }, [html])

  // Toggle highlight classes whenever the active set changes.
  const activeKey = (activeTerms ?? []).join('|')
  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    const active = activeKey ? activeKey.split('|') : []
    root.classList.toggle('fb-has-active', active.length > 0)
    root.querySelectorAll('.fb-term').forEach((el) => el.classList.remove('is-active'))
    for (const key of active) {
      root.querySelectorAll(`.fb-term--${CSS.escape(key)}`).forEach((el) =>
        el.classList.add('is-active'),
      )
    }
  }, [html, activeKey])

  return (
    <div
      ref={ref}
      className={`formula-block${display ? '' : ' formula-block--inline'}${className ? ` ${className}` : ''}`}
      role="math"
      aria-label={ariaLabel}
    />
  )
}
