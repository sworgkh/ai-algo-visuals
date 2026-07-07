import { useState } from 'react'
import { blowup } from '@/lib/hmmMatrix'
import { VizGuide } from '@/components/VizGuide'
import './DbnVsHmm.css'

const MAX_K = 6

export function DbnVsHmm() {
  const [k, setK] = useState(3)
  const hmm = blowup(k)
  // DBN: each of k boolean state vars depends only on its own previous value
  // → one 2-row CPT per variable → 2 free params each.
  const dbnParams = 2 * k

  return (
    <div className="dvh">
      <VizGuide
        what={
          <>
            The same world, two ways. A <strong>DBN</strong> keeps the{' '}
            <strong>k state variables separate</strong>, each with its own little CPT — parameters
            grow <em>linearly</em> in k. An <strong>HMM</strong> folds them into one mega-variable of{' '}
            <strong>2ᵏ</strong> values, so its transition matrix — and its parameters — grow{' '}
            <em>exponentially</em>. Same blow-up as Topic 7, now seen as network structure.
          </>
        }
        how="Slide k and compare the two graphs and their parameter counts. The DBN stays sparse; the HMM's single node balloons."
        legend={[
          { color: 'var(--viz-4)', label: 'DBN — factored, one node per variable' },
          { color: 'var(--warning, #fbbf24)', label: 'HMM — one mega-variable (2ᵏ values)' },
        ]}
      />

      <label className="dvh-slider">
        <span>
          k — boolean state variables: <span className="mono">{k}</span>
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

      <div className="dvh-panels">
        <div className="dvh-panel dvh-panel--dbn">
          <h4 className="dvh-panel-title">DBN — factored</h4>
          <svg className="dvh-svg" viewBox="0 0 240 220" role="img" aria-label="DBN factored structure">
            <defs>
              <marker id="dvh-a1" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <path d="M0,0 L7,3.5 L0,7 z" fill="var(--text-muted)" />
              </marker>
            </defs>
            {Array.from({ length: Math.min(k, MAX_K) }, (_, i) => {
              const y = 26 + (i * 168) / Math.max(1, Math.min(k, MAX_K) - 1 || 1)
              const yy = k === 1 ? 100 : y
              return (
                <g key={i}>
                  <line x1={78} y1={yy} x2={158} y2={yy} className="dvh-edge dvh-edge--dbn" markerEnd="url(#dvh-a1)" />
                  <g className="dvh-node dvh-node--dbn">
                    <circle cx={60} cy={yy} r={16} />
                    <text x={60} y={yy + 4} textAnchor="middle">{`v${i + 1}`}</text>
                  </g>
                  <g className="dvh-node dvh-node--dbn">
                    <circle cx={176} cy={yy} r={16} />
                    <text x={176} y={yy + 4} textAnchor="middle">{`v${i + 1}′`}</text>
                  </g>
                </g>
              )
            })}
            <text x={60} y={212} textAnchor="middle" className="dvh-tlabel">t−1</text>
            <text x={176} y={212} textAnchor="middle" className="dvh-tlabel">t</text>
          </svg>
          <div className="dvh-count">
            <span className="dvh-count-num mono">{dbnParams}</span>
            <span className="dvh-count-lbl">transition parameters · <span className="mono">2k</span></span>
          </div>
        </div>

        <div className="dvh-panel dvh-panel--hmm">
          <h4 className="dvh-panel-title">HMM — flattened</h4>
          <svg className="dvh-svg" viewBox="0 0 240 220" role="img" aria-label="HMM mega-variable structure">
            <defs>
              <marker id="dvh-a2" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <path d="M0,0 L7,3.5 L0,7 z" fill="var(--text-muted)" />
              </marker>
            </defs>
            <line x1={94} y1={100} x2={146} y2={100} className="dvh-edge dvh-edge--hmm" markerEnd="url(#dvh-a2)" />
            <g className="dvh-node dvh-node--hmm">
              <circle cx={62} cy={100} r={30} />
              <text x={62} y={96} textAnchor="middle">S</text>
              <text x={62} y={112} textAnchor="middle" className="dvh-mega mono">{hmm.states} vals</text>
            </g>
            <g className="dvh-node dvh-node--hmm">
              <circle cx={178} cy={100} r={30} />
              <text x={178} y={96} textAnchor="middle">S′</text>
              <text x={178} y={112} textAnchor="middle" className="dvh-mega mono">{hmm.states} vals</text>
            </g>
            <text x={62} y={212} textAnchor="middle" className="dvh-tlabel">t−1</text>
            <text x={178} y={212} textAnchor="middle" className="dvh-tlabel">t</text>
          </svg>
          <div className="dvh-count">
            <span className="dvh-count-num mono">{hmm.freeParams.toLocaleString()}</span>
            <span className="dvh-count-lbl">transition parameters · <span className="mono">2ᵏ(2ᵏ−1)</span></span>
          </div>
        </div>
      </div>

      <div className="dvh-verdict">
        At k = {k}: the factored DBN needs <strong className="dvh-good">{dbnParams}</strong> parameters,
        the flattened HMM needs <strong className="dvh-bad">{hmm.freeParams.toLocaleString()}</strong> —
        a <strong>{Math.round(hmm.freeParams / dbnParams).toLocaleString()}×</strong> difference, and
        it widens fast. Factoring the state is the whole point of a DBN.
      </div>
    </div>
  )
}
