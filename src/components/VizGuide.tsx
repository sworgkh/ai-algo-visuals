import type { ReactNode } from 'react'
import './VizGuide.css'

export interface LegendItem {
  /** A custom swatch element (e.g. a hatched box); takes precedence over `color`. */
  swatch?: ReactNode
  /** Solid color for a square swatch. */
  color?: string
  label: ReactNode
}

export interface VizGuideProps {
  /** One or two sentences: what am I looking at? */
  what: ReactNode
  /** How to interact with it. */
  how?: ReactNode
  /** Key entries decoding the marks/colors. */
  legend?: LegendItem[]
  /** Optional annotated diagram shown beside the text. */
  diagram?: ReactNode
}

/**
 * A consistent "how to read this" panel shown atop every visualization:
 * a plain-language explanation, an optional annotated diagram, a color/mark
 * key, and an interaction hint.
 */
export function VizGuide({ what, how, legend, diagram }: VizGuideProps) {
  return (
    <section className="viz-guide">
      <div className="vg-text">
        <p className="vg-what">{what}</p>
        {how && (
          <p className="vg-how">
            <span className="vg-how-tag">Try it</span> {how}
          </p>
        )}
      </div>
      {(diagram || legend) && (
        <div className="vg-aside">
          {diagram}
          {legend && (
            <ul className="vg-legend">
              {legend.map((item, i) => (
                <li key={i}>
                  {item.swatch ?? (
                    <i className="vg-swatch" style={item.color ? { background: item.color } : undefined} />
                  )}
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
