import { useMemo, useState } from 'react'
import { tokenize } from '@/lib/nlp'
import { perplexity, sentenceProb, sentenceSteps } from '@/lib/langmodel'
import { VizGuide } from '@/components/VizGuide'
import { MODEL, PRESETS } from './domain'
import './SentenceScore.css'

export function SentenceScore() {
  const [text, setText] = useState(PRESETS[0])
  const [smooth, setSmooth] = useState(false)
  const alpha = smooth ? 1 : 0

  const tokens = useMemo(() => tokenize(text), [text])
  const steps = useMemo(() => sentenceSteps(MODEL, tokens, alpha), [tokens, alpha])
  const prob = sentenceProb(MODEL, tokens, alpha)
  const pp = perplexity(MODEL, tokens, alpha)
  const hasZero = steps.some((s) => s.p === 0)

  return (
    <div className="ss">
      <VizGuide
        what={
          <>
            To score a whole sentence, multiply the bigram probabilities of each step (the chain
            rule). If <em>any</em> bigram was never seen, its MLE probability is <strong>0</strong>,
            the whole product collapses to 0, and <strong>perplexity becomes ∞</strong>. That's the
            zero-probability problem — and the reason smoothing exists.
          </>
        }
        how="Edit the sentence or pick a preset. Toggle Laplace smoothing to rescue unseen bigrams (red) from zero probability."
        legend={[
          { color: 'var(--viz-4)', label: 'seen bigram (positive probability)' },
          { color: 'var(--danger, #f87171)', label: 'unseen bigram (0 under MLE)' },
        ]}
      />

      <div className="ss-controls">
        <div className="ss-presets">
          {PRESETS.map((p) => (
            <button key={p} className={`ss-preset${text === p ? ' is-on' : ''}`} onClick={() => setText(p)}>
              {p}
            </button>
          ))}
        </div>
        <label className="ss-toggle">
          <input type="checkbox" checked={smooth} onChange={(e) => setSmooth(e.currentTarget.checked)} />
          <span>Laplace smoothing (α = 1)</span>
        </label>
      </div>

      <input
        className="ss-input"
        value={text}
        onChange={(e) => setText(e.currentTarget.value)}
        spellCheck={false}
        aria-label="sentence to score"
      />

      <div className="ss-chain">
        {steps.map((s, i) => (
          <div key={i} className={`ss-step${s.p === 0 ? ' is-zero' : ''}`}>
            <span className="ss-step-prob mono">P({s.word} | {s.ctx})</span>
            <span className="ss-step-eq mono">= {s.p.toFixed(3)}</span>
          </div>
        ))}
      </div>

      <div className="ss-result">
        <div className="ss-stat">
          <span className="ss-stat-lbl">P(sentence)</span>
          <span className="ss-stat-num mono">{prob === 0 ? '0' : prob.toExponential(2)}</span>
        </div>
        <div className={`ss-stat ${pp === Infinity ? 'is-inf' : ''}`}>
          <span className="ss-stat-lbl">perplexity</span>
          <span className="ss-stat-num mono">{pp === Infinity ? '∞' : pp.toFixed(2)}</span>
        </div>
      </div>

      {hasZero && !smooth && (
        <p className="ss-warn">
          ⚠ This sentence contains a bigram the model never saw, so its probability is 0 and
          perplexity is infinite. Turn on smoothing to fix it.
        </p>
      )}
    </div>
  )
}
