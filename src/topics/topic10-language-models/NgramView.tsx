import { useMemo, useState } from 'react'
import { BOS, nextWordDist } from '@/lib/langmodel'
import { FormulaBlock } from '@/components/FormulaBlock'
import { VizGuide } from '@/components/VizGuide'
import { MODEL } from './domain'
import './NgramView.css'

const CHAIN = String.raw`P(w_{1:n}) = \prod_i P(w_i \mid w_{1:i-1}) \;\approx\; \prod_i P(w_i \mid w_{i-1})`

export function NgramView() {
  const contexts = useMemo(
    () => [BOS, ...MODEL.vocab.filter((w) => w !== '</s>' && MODEL.counts.has(w))].sort(),
    [],
  )
  const [ctx, setCtx] = useState('the')
  const [alpha, setAlpha] = useState(0)

  const dist = useMemo(() => nextWordDist(MODEL, ctx, alpha), [ctx, alpha])
  const maxP = Math.max(...dist.map((d) => d.p), 0.001)
  const total = MODEL.contextTotals.get(ctx) ?? 0

  return (
    <div className="ng">
      <VizGuide
        what={
          <>
            A language model gives the probability of the next word given what came before. The full{' '}
            <strong>chain rule</strong> conditions on the entire history — intractable — so an{' '}
            <strong>n-gram</strong> model makes a <strong>Markov assumption</strong>: only the last{' '}
            n−1 words matter. A <strong>bigram</strong> uses just the previous word, estimated by{' '}
            <strong>MLE</strong>: P(w | prev) = count(prev, w) / count(prev).
          </>
        }
        how="Pick a context word to see its next-word distribution (bar = probability, number = raw count). Raise α to Laplace-smooth — probability mass spreads to unseen words and the peaks flatten."
        legend={[{ color: 'var(--brand-500)', label: 'P(next word | context)' }]}
      />

      <FormulaBlock tex={CHAIN} ariaLabel="chain rule and bigram approximation" />

      <div className="ng-controls">
        <div className="ng-ctx">
          <span className="ng-ctx-label">context word:</span>
          <div className="ng-ctx-chips">
            {contexts.map((c) => (
              <button key={c} className={`ng-chip mono${ctx === c ? ' is-on' : ''}`} onClick={() => setCtx(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <label className="ng-alpha">
          <span>
            smoothing α = <span className="mono">{alpha.toFixed(2)}</span>{' '}
            {alpha === 0 ? '(MLE)' : '(Laplace)'}
          </span>
          <input type="range" min={0} max={2} step={0.25} value={alpha} onChange={(e) => setAlpha(e.currentTarget.valueAsNumber)} />
        </label>
      </div>

      <div className="ng-dist">
        <div className="ng-dist-head mono">
          P( · | {ctx}) — context seen {total} time{total === 1 ? '' : 's'}
        </div>
        {dist.slice(0, 12).map((d) => (
          <div className="ng-row" key={d.word}>
            <span className="ng-word mono">{d.word}</span>
            <div className="ng-bar-track">
              <div className="ng-bar" style={{ width: `${(d.p / maxP) * 100}%` }} />
            </div>
            <span className="ng-p mono">{d.p.toFixed(3)}</span>
            <span className="ng-count mono">×{d.count}</span>
          </div>
        ))}
        {dist.length > 12 && <div className="ng-more">+{dist.length - 12} more (smoothed) …</div>}
      </div>
    </div>
  )
}
