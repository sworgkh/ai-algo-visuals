import { useMemo, useState } from 'react'
import { matrixViterbi, obsVec, transitionMatrix, transpose } from '@/lib/hmmMatrix'
import { useStepPlayer } from '@/hooks/useStepPlayer'
import { StepPlayer } from '@/components/StepPlayer'
import { VizGuide } from '@/components/VizGuide'
import { DEFAULT_OBS, MX_STATE_LABELS, NOUMB, OBS_LABEL, UMB, UMBRELLA_HMM } from './domain'
import './MatrixViterbiView.css'

type Mode = 'max' | 'sum'
const S = UMBRELLA_HMM.states

export function MatrixViterbiView() {
  const [obs, setObs] = useState<string[]>(DEFAULT_OBS)
  const [mode, setMode] = useState<Mode>('max')
  const res = useMemo(() => matrixViterbi(UMBRELLA_HMM, obs), [obs])
  const Tt = useMemo(() => transpose(transitionMatrix(UMBRELLA_HMM)), [])

  const player = useStepPlayer(obs.length)
  const day = player.index
  const step = res.steps[day]
  const mInVec = day === 0 ? S.map((s) => UMBRELLA_HMM.prior[s]) : res.steps[day - 1].message

  const toggle = (i: number) => {
    setObs((o) => o.map((v, j) => (j === i ? (v === UMB ? NOUMB : UMB) : v)))
    player.reset()
  }

  const O = obsVec(UMBRELLA_HMM, obs[day])

  return (
    <div className="mv2">
      <VizGuide
        what={
          <>
            Filtering and Viterbi are the <strong>same recursion</strong> on the same trellis —
            multiply the incoming message by <strong>Tᵀ</strong>, then apply the sensor. They differ
            in <em>one operator</em>: filtering <strong>sums</strong> over predecessors (total
            probability of a state), Viterbi takes the <strong>max</strong> (probability of the best
            single path to it) and remembers the winner.
          </>
        }
        how="Flip the operator to see sum vs. max on identical products. In max mode, the winning predecessor (arrow) and the recovered best path light up."
        legend={[
          { color: 'var(--viz-4)', label: 'max winner / best path (Viterbi)' },
          { color: 'var(--brand-500)', label: 'Σ — the filtering alternative' },
        ]}
      />

      <div className="mv2-controls">
        <div className="mv2-days">
          {obs.map((o, i) => (
            <button
              key={i}
              className={`mv2-day${o === UMB ? ' is-umb' : ''}${i === day ? ' is-current' : ''}`}
              onClick={() => toggle(i)}
            >
              <span className="mv2-day-n">day {i + 1}</span>
              <span className="mv2-day-icon">{o === UMB ? '☂' : '☀'}</span>
            </button>
          ))}
        </div>
        <div className="mv2-mode" role="tablist" aria-label="reduction operator">
          <button role="tab" aria-selected={mode === 'max'} className={mode === 'max' ? 'is-on' : ''} onClick={() => setMode('max')}>
            max (Viterbi)
          </button>
          <button role="tab" aria-selected={mode === 'sum'} className={mode === 'sum' ? 'is-on' : ''} onClick={() => setMode('sum')}>
            Σ (filtering)
          </button>
        </div>
      </div>

      {day === 0 ? (
        <div className="mv2-base">
          <p>
            <strong>Base case (day 1).</strong> The prior over the previous day is marginalized
            (this first step is a sum either way), then reweighted by the sensor for{' '}
            {OBS_LABEL[obs[0]]}:
          </p>
          <div className="mv2-msg">
            {S.map((s, i) => (
              <span key={s} className="mv2-msg-cell mono">
                m₁({MX_STATE_LABELS[i]}) = {step.message[i].toFixed(3)}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="mv2-targets">
          {S.map((s, si) => {
            const products = S.map((_, fi) => Tt[si][fi] * mInVec[fi])
            const maxVal = Math.max(...products)
            const argmax = products.indexOf(maxVal)
            const sumVal = products.reduce((a, x) => a + x, 0)
            const chosen = mode === 'max' ? maxVal : sumVal
            return (
              <div key={s} className={`mv2-card mv2-card--${mode}`}>
                <div className="mv2-card-head">
                  target <strong>{MX_STATE_LABELS[si]}</strong> (day {day + 1})
                </div>
                <div className="mv2-prods">
                  {S.map((from, fi) => (
                    <div
                      key={from}
                      className={`mv2-prod mono${mode === 'max' && fi === argmax ? ' is-winner' : ''}`}
                    >
                      <span className="mv2-prod-src">from {MX_STATE_LABELS[fi]}</span>
                      <span className="mv2-prod-calc">
                        {Tt[si][fi].toFixed(2)} · {mInVec[fi].toFixed(3)} = {products[fi].toFixed(4)}
                      </span>
                      {mode === 'max' && fi === argmax && <span className="mv2-prod-arrow">◀ best</span>}
                    </div>
                  ))}
                </div>
                <div className="mv2-reduce mono">
                  <span className="mv2-reduce-op">{mode === 'max' ? 'max' : 'Σ'}</span> = {chosen.toFixed(4)}
                  <span className="mv2-reduce-sensor">
                    {' '}
                    × O({OBS_LABEL[obs[day]]}={O[si].toFixed(1)}) ={' '}
                    <strong>{(chosen * O[si]).toFixed(4)}</strong>
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {mode === 'max' && (
        <div className="mv2-path">
          <span className="mv2-path-label">best path so far:</span>
          {res.path.slice(0, day + 1).map((s, i) => (
            <span key={i} className="mv2-path-node mono">
              {MX_STATE_LABELS[S.indexOf(s)]}
              {i < day && <span className="mv2-path-arrow"> → </span>}
            </span>
          ))}
          {day === obs.length - 1 && <span className="mv2-path-done">✓ complete</span>}
        </div>
      )}

      <StepPlayer
        player={player}
        stepLabel={`Day ${day + 1}`}
        caption={
          mode === 'max'
            ? day === 0
              ? 'Viterbi starts like filtering: marginalize the prior, apply the sensor.'
              : `Viterbi keeps only the single best predecessor for each state (the arrow). Filtering would instead sum both rows.`
            : 'Summing the two products for each target gives the (unnormalized) filtering recursion — the exact same trellis, different operator.'
        }
      />
    </div>
  )
}
