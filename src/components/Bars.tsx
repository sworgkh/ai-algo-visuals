import { motion } from 'framer-motion'
import './Bars.css'

export interface Datum {
  label: string
  value: number
  /** CSS color; falls back to the viz palette by index. */
  color?: string
}

const PALETTE = [
  'var(--viz-1)',
  'var(--viz-2)',
  'var(--viz-3)',
  'var(--viz-4)',
  'var(--viz-5)',
  'var(--viz-6)',
]

const fmt = (v: number, dp: number) => v.toFixed(dp)

export interface BarPairProps {
  /** Distribution outcomes (2+). Values are shown as-is; heights scale to `max`. */
  data: Datum[]
  /** Value mapped to full bar height. Default 1 (probabilities). */
  max?: number
  /** Bar column height in px. */
  height?: number
  /** Decimal places for the printed value. */
  decimals?: number
  title?: string
  className?: string
}

/**
 * Vertical probability bars sitting side by side — e.g. P(Rain) vs P(¬Rain).
 * Heights animate on value change so predict→update shifts are visible.
 */
export function BarPair({
  data,
  max = 1,
  height = 148,
  decimals = 3,
  title,
  className,
}: BarPairProps) {
  return (
    <figure className={`barpair${className ? ` ${className}` : ''}`}>
      {title && <figcaption className="barpair-title">{title}</figcaption>}
      <div className="barpair-cols" style={{ height }}>
        {data.map((d, i) => {
          const pct = Math.max(0, Math.min(1, d.value / max)) * 100
          const color = d.color ?? PALETTE[i % PALETTE.length]
          return (
            <div className="barpair-col" key={d.label}>
              <span className="barpair-value mono">{fmt(d.value, decimals)}</span>
              <div className="barpair-track">
                <motion.div
                  className="barpair-fill"
                  style={{ background: color }}
                  initial={false}
                  animate={{ height: `${pct}%` }}
                  transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <span className="barpair-label">{d.label}</span>
            </div>
          )
        })}
      </div>
    </figure>
  )
}

export interface BarStackProps {
  /** Segments of one distribution; typically sums to `total`. */
  data: Datum[]
  /** Full-width value. Default: sum of values. */
  total?: number
  decimals?: number
  title?: string
  /** Show a value label inside each segment when it's wide enough. */
  showValues?: boolean
  className?: string
}

/**
 * A single horizontal bar split into proportional segments — good for showing
 * one distribution and how normalization rescales it.
 */
export function BarStack({
  data,
  total,
  decimals = 3,
  title,
  showValues = true,
  className,
}: BarStackProps) {
  const sum = total ?? data.reduce((a, d) => a + d.value, 0)
  return (
    <figure className={`barstack${className ? ` ${className}` : ''}`}>
      {title && <figcaption className="barstack-title">{title}</figcaption>}
      <div className="barstack-track">
        {data.map((d, i) => {
          const pct = sum > 0 ? (d.value / sum) * 100 : 0
          const color = d.color ?? PALETTE[i % PALETTE.length]
          return (
            <motion.div
              key={d.label}
              className="barstack-seg"
              style={{ background: color }}
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
              title={`${d.label}: ${fmt(d.value, decimals)}`}
            >
              {showValues && pct > 12 && (
                <span className="barstack-seg-value mono">{fmt(d.value, decimals)}</span>
              )}
            </motion.div>
          )
        })}
      </div>
      <div className="barstack-legend">
        {data.map((d, i) => (
          <span className="barstack-legend-item" key={d.label}>
            <i style={{ background: d.color ?? PALETTE[i % PALETTE.length] }} />
            {d.label}
          </span>
        ))}
      </div>
    </figure>
  )
}
