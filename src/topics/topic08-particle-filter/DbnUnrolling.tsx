import { useState } from 'react'
import { VizGuide } from '@/components/VizGuide'
import './DbnUnrolling.css'

type Highlight = 'all' | 'inter' | 'intra'

const ROWS = [
  { key: 'X', label: 'Xₜ', y: 64, evidence: false },
  { key: 'Y', label: 'Yₜ', y: 158, evidence: false },
  { key: 'E', label: 'Eₜ', y: 256, evidence: true },
]
const SLICE_W = 150
const PAD_X = 70
const R = 26

export function DbnUnrolling() {
  const [slices, setSlices] = useState(4)
  const [hl, setHl] = useState<Highlight>('all')

  const x = (t: number) => PAD_X + t * SLICE_W
  const yOf = (k: string) => ROWS.find((r) => r.key === k)!.y
  const W = PAD_X * 2 + (slices - 1) * SLICE_W
  const H = 320

  const showInter = hl !== 'intra'
  const showIntra = hl !== 'inter'

  return (
    <div className="dbn">
      <VizGuide
        what={
          <>
            A <strong>dynamic Bayes net</strong> is one time-slice template repeated forever. Within
            a slice, <strong>intra-slice</strong> arcs link state to evidence; between slices,{' '}
            <strong>inter-slice</strong> arcs carry the state forward (the Markov step). Unrolling it
            over time gives an ordinary — but ever-growing — Bayes net. An HMM is just the special
            case with a <em>single</em> state variable per slice.
          </>
        }
        how="Slide to unroll more slices, and isolate inter- vs intra-slice arcs. Notice the template never changes — only how many times it's stamped."
        legend={[
          { color: 'var(--viz-3)', label: 'inter-slice arc (state persists: Xₜ₋₁ → Xₜ)' },
          { color: 'var(--viz-5)', label: 'intra-slice arc (state → evidence)' },
          { swatch: <span className="dbn-eknob" />, label: 'shaded = observed evidence' },
        ]}
      />

      <div className="dbn-controls">
        <label className="dbn-slider">
          <span>
            slices unrolled: <span className="mono">{slices}</span>
          </span>
          <input
            type="range"
            min={2}
            max={6}
            step={1}
            value={slices}
            onChange={(e) => setSlices(e.currentTarget.valueAsNumber)}
          />
        </label>
        <div className="dbn-seg" role="tablist" aria-label="highlight arcs">
          {(['all', 'inter', 'intra'] as Highlight[]).map((h) => (
            <button key={h} role="tab" aria-selected={hl === h} className={hl === h ? 'is-on' : ''} onClick={() => setHl(h)}>
              {h === 'all' ? 'all arcs' : h === 'inter' ? 'inter-slice' : 'intra-slice'}
            </button>
          ))}
        </div>
      </div>

      <div className="dbn-canvas-wrap">
        <svg className="dbn-canvas" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Unrolled DBN">
          <defs>
            <marker id="dbn-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 z" fill="var(--text-muted)" />
            </marker>
          </defs>

          {/* inter-slice arcs t-1 -> t */}
          {showInter &&
            Array.from({ length: slices - 1 }, (_, t) => (
              <g key={`i${t}`}>
                <Edge x1={x(t) + R} y1={yOf('X')} x2={x(t + 1) - R} y2={yOf('X')} cls="dbn-edge dbn-edge--inter" />
                <Edge x1={x(t) + R} y1={yOf('Y')} x2={x(t + 1) - R} y2={yOf('Y')} cls="dbn-edge dbn-edge--inter" />
                {/* coupling arc X_{t-1} -> Y_t */}
                <Edge x1={x(t) + R * 0.7} y1={yOf('X') + R * 0.7} x2={x(t + 1) - R} y2={yOf('Y') - R * 0.5} cls="dbn-edge dbn-edge--inter" />
              </g>
            ))}

          {/* intra-slice arcs X_t->E_t, Y_t->E_t */}
          {showIntra &&
            Array.from({ length: slices }, (_, t) => (
              <g key={`a${t}`}>
                <Edge x1={x(t)} y1={yOf('X') + R} x2={x(t)} y2={yOf('E') - R} cls="dbn-edge dbn-edge--intra" />
                <Edge x1={x(t) - R * 0.4} y1={yOf('Y') + R} x2={x(t) - R * 0.2} y2={yOf('E') - R} cls="dbn-edge dbn-edge--intra" />
              </g>
            ))}

          {/* nodes */}
          {Array.from({ length: slices }, (_, t) =>
            ROWS.map((r) => (
              <g key={`${t}-${r.key}`} className={`dbn-node${r.evidence ? ' is-ev' : ''}`}>
                <circle cx={x(t)} cy={r.y} r={R} />
                <text x={x(t)} y={r.y + 5} textAnchor="middle" className="dbn-node-label">
                  {r.key}
                  <tspan className="dbn-sub" dy="4" fontSize="11">
                    {t}
                  </tspan>
                </text>
              </g>
            )),
          )}

          {/* slice guides */}
          {Array.from({ length: slices }, (_, t) => (
            <text key={`s${t}`} x={x(t)} y={H - 8} textAnchor="middle" className="dbn-slice-label">
              slice {t}
            </text>
          ))}
        </svg>
      </div>

      <p className="dbn-note">
        <strong>Why exact inference gets hard.</strong> Filtering keeps a belief over the whole state{' '}
        (Xₜ, Yₜ). Even though the network is sparse, marginalizing the past couples the state
        variables together, so the belief factor grows denser every slice — for many variables it
        becomes intractable. That’s the cue to switch from exact inference to{' '}
        <strong>sampling</strong> (the particle filter).
      </p>
    </div>
  )
}

function Edge({ x1, y1, x2, y2, cls }: { x1: number; y1: number; x2: number; y2: number; cls: string }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} className={cls} markerEnd="url(#dbn-arrow)" />
}
