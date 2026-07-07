import { useMemo, useState } from 'react'
import { matrixSmooth } from '@/lib/hmmMatrix'
import { FormulaBlock } from '@/components/FormulaBlock'
import { VizGuide } from '@/components/VizGuide'
import { VecView } from './Matrix'
import { DEFAULT_OBS, MX_STATE_LABELS, NOUMB, UMB, UMBRELLA_HMM } from './domain'
import './ForwardBackwardView.css'

const TEX = String.raw`\underbrace{\mathbf{s}_k}_{\text{smoothed}} = \alpha\; \underbrace{\mathbf{f}_{1:k}}_{\text{forward}} \odot \underbrace{\mathbf{b}_{k+1:t}}_{\text{backward}}`

export function ForwardBackwardView() {
  const [obs, setObs] = useState<string[]>(DEFAULT_OBS)
  const { forwards, backwards, smoothed } = useMemo(() => matrixSmooth(UMBRELLA_HMM, obs), [obs])
  const toggle = (i: number) => setObs((o) => o.map((v, j) => (j === i ? (v === UMB ? NOUMB : UMB) : v)))

  const days = obs.map((_, i) => i + 1)

  return (
    <div className="fb">
      <VizGuide
        what={
          <>
            <strong>Smoothing</strong> runs two message passes over the same chain: a{' '}
            <strong>forward</strong> pass (the filtering vectors <em>f</em>, left→right) and a{' '}
            <strong>backward</strong> pass (<em>b</em> = T·Oₑ·<em>b</em>, right→left, starting from{' '}
            <strong>⟨1, 1⟩</strong>). Multiply them element-wise and normalize — that’s the smoothed
            belief, informed by past <em>and</em> future.
          </>
        }
        how="Toggle any day’s umbrella and watch both passes recompute. Read down each column: forward × backward → smoothed."
        legend={[
          { color: 'var(--brand-500)', label: 'forward message f (evidence so far)' },
          { color: '#f472b6', label: 'backward message b (future evidence)' },
          { color: 'var(--viz-4)', label: 'smoothed = α (f ⊙ b)' },
        ]}
      />

      <div className="fb-days">
        {obs.map((o, i) => (
          <button key={i} className={`fb-day${o === UMB ? ' is-umb' : ''}`} onClick={() => toggle(i)}>
            <span className="fb-day-n">day {i + 1}</span>
            <span className="fb-day-icon">{o === UMB ? '☂' : '☀'}</span>
          </button>
        ))}
      </div>

      <FormulaBlock tex={TEX} ariaLabel="Smoothing as forward times backward" />

      <div className="fb-grid-wrap">
        <div className="fb-grid" style={{ gridTemplateColumns: `auto repeat(${days.length}, 1fr)` }}>
          <div className="fb-rowhead fb-rowhead--fwd">forward <span>→</span></div>
          {days.map((d) => (
            <div className="fb-cell" key={`f${d}`}>
              <VecView values={forwards[d]} accent="brand" format={(n) => n.toFixed(2)} />
            </div>
          ))}

          <div className="fb-rowhead fb-rowhead--bwd"><span>←</span> backward</div>
          {days.map((d) => (
            <div className="fb-cell" key={`b${d}`}>
              <VecView values={backwards[d]} accent="pink" format={(n) => n.toFixed(2)} />
            </div>
          ))}

          <div className="fb-rowhead fb-rowhead--sm">= smoothed</div>
          {days.map((d) => (
            <div className="fb-cell" key={`s${d}`}>
              <VecView values={smoothed[d - 1]} accent="green" labels={MX_STATE_LABELS} format={(n) => n.toFixed(2)} />
            </div>
          ))}

          <div className="fb-rowhead fb-rowhead--day" />
          {days.map((d) => (
            <div className="fb-daylabel" key={`d${d}`}>
              day {d} {obs[d - 1] === UMB ? '☂' : '☀'}
            </div>
          ))}
        </div>
      </div>

      <p className="fb-note">
        Boundary conditions: the forward pass starts from the prior ⟨0.5, 0.5⟩; the backward pass
        starts from ⟨1, 1⟩ (there’s no evidence after the last day). The last day’s smoothed value
        therefore equals its filtered value.
      </p>
    </div>
  )
}
