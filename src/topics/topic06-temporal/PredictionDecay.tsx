import { useState } from 'react'
import { predictAhead } from '@/lib/hmm'
import { VizGuide } from '@/components/VizGuide'
import { NORAIN, RAIN, UMBRELLA_HMM } from './domain'
import './PredictionDecay.css'

const K = 12

export function PredictionDecay() {
  const [start, setStart] = useState(1)
  const seq = predictAhead(UMBRELLA_HMM, { [RAIN]: start, [NORAIN]: 1 - start }, K)

  return (
    <div className="pd">
      <VizGuide
        what={
          <>
            With <strong>no new evidence</strong>, repeated prediction just rolls the belief through
            the transition model over and over. It converges to the model’s{' '}
            <strong>stationary distribution</strong> — here ⟨0.5, 0.5⟩ — and stays there. Prediction
            without observation forgets where it started.
          </>
        }
        how="Set the starting belief and watch P(Rain) march toward 0.5, faster the closer the transition model is to random."
        legend={[{ color: 'var(--brand-500)', label: 'P(Rain) after k prediction steps' }]}
      />

      <label className="pd-slider">
        <span className="pd-slider-top">
          <span>Start P(Rain₀)</span>
          <span className="mono">{start.toFixed(2)}</span>
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={start}
          onChange={(e) => setStart(e.currentTarget.valueAsNumber)}
        />
      </label>

      <div className="pd-chart">
        <div className="pd-stationary" style={{ bottom: '50%' }}>
          <span>stationary 0.5</span>
        </div>
        <div className="pd-bars">
          {seq.map((d, k) => (
            <div className="pd-col" key={k} title={`step ${k}: P(Rain)=${d[RAIN].toFixed(3)}`}>
              <div className="pd-bar-wrap">
                <div className="pd-bar" style={{ height: `${d[RAIN] * 100}%` }} />
              </div>
              <span className="pd-col-k mono">{k}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="pd-note mono">
        P(Rain) = {seq.map((d) => d[RAIN].toFixed(2)).join(' → ')}
      </p>
    </div>
  )
}
