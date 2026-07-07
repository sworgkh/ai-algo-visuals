import { useMemo, useState } from 'react'
import { viterbi } from '@/lib/hmm'
import { VizGuide } from '@/components/VizGuide'
import { DEFAULT_OBS, NORAIN, NOUMB, OBS_LABEL, RAIN, STATE_LABEL, UMB, UMBRELLA_HMM } from './domain'
import './ViterbiTrellis.css'

const COL_W = 168
const PAD_X = 90
const ROW_Y: Record<string, number> = { [RAIN]: 70, [NORAIN]: 200 }
const H = 270
const R = 26

export function ViterbiTrellis() {
  const [obs, setObs] = useState<string[]>(DEFAULT_OBS)
  const res = useMemo(() => viterbi(UMBRELLA_HMM, obs), [obs])
  const toggle = (i: number) => setObs((o) => o.map((v, j) => (j === i ? (v === UMB ? NOUMB : UMB) : v)))

  const W = PAD_X * 2 + (obs.length - 1) * COL_W
  const x = (t: number) => PAD_X + t * COL_W
  const onPath = (t: number, s: string) => res.path[t] === s
  const pathEdge = (t: number, from: string, to: string) => res.path[t] === from && res.path[t + 1] === to

  return (
    <div className="vt">
      <VizGuide
        what={
          <>
            <strong>Viterbi</strong> finds the single <em>most likely state sequence</em> (not the
            per-day marginals). Same trellis as filtering, but it takes a <strong>max</strong> over
            predecessors instead of a sum, and keeps a back-pointer — then traces the winning path
            back from the end.
          </>
        }
        how="Toggle the umbrellas; the thick path is the most likely explanation of the whole sequence."
        legend={[
          { color: 'var(--viz-4)', label: 'most likely path' },
          { color: 'var(--border-strong)', label: 'other transitions' },
        ]}
      />

      <div className="vt-days">
        {obs.map((o, i) => (
          <button key={i} className={`vt-day${o === UMB ? ' is-umb' : ''}`} onClick={() => toggle(i)}>
            day {i + 1}: {o === UMB ? '☂' : '☀'} {OBS_LABEL[o]}
          </button>
        ))}
      </div>

      <div className="vt-canvas-wrap">
        <svg className="vt-canvas" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Viterbi trellis">
          {/* edges */}
          {obs.slice(1).map((_, i) =>
            UMBRELLA_HMM.states.flatMap((from) =>
              UMBRELLA_HMM.states.map((to) => (
                <line
                  key={`${i}-${from}-${to}`}
                  x1={x(i) + R}
                  y1={ROW_Y[from]}
                  x2={x(i + 1) - R}
                  y2={ROW_Y[to]}
                  className={`vt-edge${pathEdge(i, from, to) ? ' is-path' : ''}`}
                />
              )),
            ),
          )}
          {/* nodes */}
          {obs.map((_, t) =>
            UMBRELLA_HMM.states.map((s) => (
              <g key={`${t}-${s}`} className={`vt-node${onPath(t, s) ? ' is-path' : ''}`}>
                <circle cx={x(t)} cy={ROW_Y[s]} r={R} />
                <text className="vt-node-label" x={x(t)} y={ROW_Y[s] - 3} textAnchor="middle">
                  {s === RAIN ? 'Rain' : '¬Rain'}
                </text>
                <text className="vt-node-val mono" x={x(t)} y={ROW_Y[s] + 12} textAnchor="middle">
                  {res.trellis[t][s].toExponential(1)}
                </text>
              </g>
            )),
          )}
          {/* column headers */}
          {obs.map((o, t) => (
            <text key={`h${t}`} className="vt-col-head" x={x(t)} y={24} textAnchor="middle">
              day {t + 1} · {o === UMB ? '☂' : '☀'}
            </text>
          ))}
        </svg>
      </div>

      <p className="vt-path mono">
        Most likely sequence: {res.path.map((s) => STATE_LABEL[s]).join(' → ')}
      </p>
    </div>
  )
}
