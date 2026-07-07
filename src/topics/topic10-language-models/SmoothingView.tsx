import { useMemo, useState } from 'react'
import { tokenize } from '@/lib/nlp'
import { perplexity } from '@/lib/langmodel'
import { VizGuide } from '@/components/VizGuide'
import { MODEL, PRESETS } from './domain'
import './SmoothingView.css'

const TEST = tokenize(PRESETS[2]) // 'a cat ran in the park' — contains rare/unseen bigrams
const W = 520
const H = 240
const PAD = 46
const ALPHAS = Array.from({ length: 40 }, (_, i) => 0.05 + (i * (2 - 0.05)) / 39)

export function SmoothingView() {
  const [alpha, setAlpha] = useState(1)

  const curve = useMemo(() => ALPHAS.map((a) => ({ a, pp: perplexity(MODEL, TEST, a) })), [])
  const finite = curve.filter((d) => Number.isFinite(d.pp))
  const maxPP = Math.max(...finite.map((d) => d.pp))
  const minEntry = finite.reduce((m, d) => (d.pp < m.pp ? d : m), finite[0])

  const x = (a: number) => PAD + (a / 2) * (W - PAD * 1.4)
  const y = (pp: number) => H - PAD - (pp / maxPP) * (H - PAD * 1.5)

  const curPP = perplexity(MODEL, TEST, alpha)
  const mlePP = perplexity(MODEL, TEST, 0)

  return (
    <div className="sm10">
      <VizGuide
        what={
          <>
            <strong>Perplexity</strong> is the model's average surprise — geometric-mean inverse
            probability per word; lower is better. A single unseen bigram makes raw MLE perplexity{' '}
            <strong>infinite</strong>, so we <strong>smooth</strong>: shift a little mass onto things
            never seen. On this in-corpus sentence the <em>least</em> smoothing that removes the
            zeros wins, and more only over-flattens; on genuinely held-out text the best α sits at an
            interior sweet spot.
          </>
        }
        how="Drag α: pure MLE (α = 0) sits at ∞, the curve is finite the moment you smooth, and it climbs as α over-smooths the seen bigrams."
        legend={[{ color: 'var(--viz-4)', label: 'perplexity vs. smoothing α' }]}
      />

      <div className="sm10-top">
        <div className="sm10-chart">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="perplexity vs alpha">
            <line x1={PAD} y1={H - PAD} x2={W - PAD * 0.4} y2={H - PAD} className="sm10-axis" />
            <line x1={PAD} y1={PAD * 0.5} x2={PAD} y2={H - PAD} className="sm10-axis" />
            <polyline className="sm10-curve" points={finite.map((d) => `${x(d.a)},${y(d.pp)}`).join(' ')} />
            {/* minimum marker */}
            <circle cx={x(minEntry.a)} cy={y(minEntry.pp)} r={4} className="sm10-min" />
            <text x={x(minEntry.a)} y={y(minEntry.pp) - 10} textAnchor="middle" className="sm10-min-label">
              min α≈{minEntry.a.toFixed(2)}
            </text>
            {/* current alpha marker */}
            {Number.isFinite(curPP) && (
              <line x1={x(alpha)} y1={PAD * 0.5} x2={x(alpha)} y2={H - PAD} className="sm10-cur" />
            )}
            <text x={W / 2} y={H - 10} textAnchor="middle" className="sm10-axlabel">smoothing α →</text>
            <text x={14} y={H / 2} textAnchor="middle" className="sm10-axlabel" transform={`rotate(-90 14 ${H / 2})`}>perplexity →</text>
          </svg>
        </div>

        <div className="sm10-side">
          <label className="sm10-slider">
            <span>
              α = <span className="mono">{alpha.toFixed(2)}</span>
            </span>
            <input type="range" min={0} max={2} step={0.05} value={alpha} onChange={(e) => setAlpha(e.currentTarget.valueAsNumber)} />
          </label>
          <div className="sm10-stat">
            <span className="sm10-stat-lbl">perplexity @ α</span>
            <span className={`sm10-stat-num mono${!Number.isFinite(curPP) ? ' is-inf' : ''}`}>
              {Number.isFinite(curPP) ? curPP.toFixed(2) : '∞'}
            </span>
          </div>
          <div className="sm10-stat">
            <span className="sm10-stat-lbl">pure MLE (α = 0)</span>
            <span className="sm10-stat-num mono is-inf">{Number.isFinite(mlePP) ? mlePP.toFixed(2) : '∞'}</span>
          </div>
        </div>
      </div>

      <div className="sm10-methods">
        {[
          { name: 'Laplace (add-α)', desc: 'Add α to every count. Simple; over-smooths large vocabularies by giving too much mass to the unseen.' },
          { name: 'Backoff', desc: 'If an n-gram was never seen, back off to the (n−1)-gram estimate — use the bigram, else the unigram.' },
          { name: 'Interpolation', desc: 'Always blend all orders: λ₁·trigram + λ₂·bigram + λ₃·unigram, with the λ’s summing to 1.' },
        ].map((m) => (
          <div className="sm10-method" key={m.name}>
            <span className="sm10-method-name">{m.name}</span>
            <p>{m.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
