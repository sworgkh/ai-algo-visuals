import { useState } from 'react'
import { blowup } from '@/lib/hmmMatrix'
import { VizGuide } from '@/components/VizGuide'
import './MegaBlowupView.css'

const MAX_K = 6

export function MegaBlowupView() {
  const [k, setK] = useState(3)
  const b = blowup(k)
  const factored = 2 * k // k independent boolean chains: 2 params each

  return (
    <div className="mb">
      <VizGuide
        what={
          <>
            An HMM has a <strong>single</strong> discrete state variable. Model a world with{' '}
            <strong>k boolean</strong> features and you must fold them into one mega-variable with{' '}
            <strong>2ᵏ</strong> values — so the transition matrix is <strong>2ᵏ × 2ᵏ</strong> and its
            free parameters grow as <strong>2ᵏ(2ᵏ−1)</strong>. This exponential blow-up is exactly
            why we factor the state into a dynamic Bayes net (next topic).
          </>
        }
        how="Drag k and watch the transition matrix — and its parameter count — explode, next to what a factored model would need."
        legend={[
          { color: 'var(--brand-500)', label: 'one cell = one transition probability P(state′ | state)' },
        ]}
      />

      <label className="mb-slider">
        <span className="mb-slider-top">
          <span>k — boolean state features</span>
          <span className="mono">{k}</span>
        </span>
        <input
          type="range"
          min={1}
          max={MAX_K}
          step={1}
          value={k}
          onChange={(e) => setK(e.currentTarget.valueAsNumber)}
        />
      </label>

      <div className="mb-stats">
        <Stat label="mega-variable values" value={`2^${k} = ${b.states}`} />
        <Stat label="transition-matrix cells" value={`${b.states}² = ${b.cells.toLocaleString()}`} />
        <Stat label="free parameters" value={b.freeParams.toLocaleString()} accent="warn" />
        <Stat label="factored model (independent)" value={`${factored}`} accent="good" />
      </div>

      <div className="mb-compare">
        Flattened HMM needs <strong className="mb-big">{b.freeParams.toLocaleString()}</strong>{' '}
        parameters; a factored model with {k} independent feature{k > 1 ? 's' : ''} needs{' '}
        <strong className="mb-small">{factored}</strong>. That’s a{' '}
        <strong>{Math.round(b.freeParams / factored).toLocaleString()}×</strong> gap at k = {k}.
      </div>

      <div className="mb-grid-wrap">
        <div className="mb-grid-caption mono">
          T : {b.states} × {b.states}
        </div>
        <div
          className="mb-grid"
          style={{
            gridTemplateColumns: `repeat(${b.states}, 1fr)`,
            // shrink cells as the matrix grows so it stays on screen
            ['--cell' as string]: `${Math.max(6, Math.round(220 / b.states))}px`,
          }}
        >
          {Array.from({ length: b.cells }, (_, i) => {
            const r = Math.floor(i / b.states)
            const c = i % b.states
            const shade = 0.18 + 0.5 * ((r + c) / (2 * (b.states - 1) || 1))
            return <span key={i} className="mb-cell" style={{ opacity: shade }} />
          })}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: 'warn' | 'good' }) {
  return (
    <div className={`mb-stat${accent ? ` mb-stat--${accent}` : ''}`}>
      <span className="mb-stat-value mono">{value}</span>
      <span className="mb-stat-label">{label}</span>
    </div>
  )
}
