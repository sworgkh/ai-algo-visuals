import { useMemo, useState } from 'react'
import { matrixFilter } from '@/lib/hmmMatrix'
import { useChangedKeys } from '@/hooks/useChangedKeys'
import { useStepPlayer } from '@/hooks/useStepPlayer'
import { StepPlayer } from '@/components/StepPlayer'
import { FormulaBlock } from '@/components/FormulaBlock'
import { term } from '@/components/formula'
import { VizGuide } from '@/components/VizGuide'
import { MatrixView, VecView, Op } from './Matrix'
import { DEFAULT_OBS, MX_STATE_LABELS, NOUMB, OBS_LABEL, UMB, UMBRELLA_HMM } from './domain'
import './MatrixFilterView.css'

const TEX = String.raw`\mathbf{f}_{1:t+1} = ${term('alpha', '\\alpha')}\; ${term(
  'sensor',
  '\\mathbf{O}_{t+1}',
)}\; ${term('trans', '\\mathbf{T}^{\\top}')}\, \mathbf{f}_{1:t}`

type Phase = 'trans' | 'sensor' | 'alpha'
const PHASES: Phase[] = ['trans', 'sensor', 'alpha']

export function MatrixFilterView() {
  const [obs, setObs] = useState<string[]>(DEFAULT_OBS)
  const m = useMemo(() => matrixFilter(UMBRELLA_HMM, obs), [obs])

  const player = useStepPlayer(obs.length * 3)
  const idx = player.index
  const day = Math.floor(idx / 3)
  const phase = PHASES[idx % 3]
  const step = m.steps[day]
  const fIn = day === 0 ? m.prior : m.steps[day - 1].updated

  const toggleDay = (i: number) => {
    setObs((o) => o.map((v, j) => (j === i ? (v === UMB ? NOUMB : UMB) : v)))
    player.reset()
  }

  const O = UMBRELLA_HMM.states.map((s, i) =>
    UMBRELLA_HMM.states.map((_, j) => (i === j ? UMBRELLA_HMM.sensor[s][obs[day]] : 0)),
  )
  const reached = (p: Phase) => PHASES.indexOf(p) <= PHASES.indexOf(phase)

  // Named numbers in the worked derivation; `hot` = those that changed this render.
  const nums = {
    a: fIn[0],
    b: fIn[1],
    p0: step.predicted[0],
    p1: step.predicted[1],
    s0: O[0][0],
    s1: O[1][1],
    w0: step.weighted[0],
    w1: step.weighted[1],
    Z: 1 / step.alpha,
    al: step.alpha,
    u0: step.updated[0],
    u1: step.updated[1],
  }
  const hot = useChangedKeys(nums)
  const deriv = buildDerivation(nums, m.Tt, hot)

  const caption =
    phase === 'trans'
      ? `Prediction Tᵀf: roll the belief through the transition matrix → ⟨${step.predicted
          .map((x) => x.toFixed(3))
          .join(', ')}⟩ (unnormalized).`
      : phase === 'sensor'
        ? `Multiply by the diagonal sensor matrix O for ${OBS_LABEL[obs[day]]} → ⟨${step.weighted
            .map((x) => x.toFixed(3))
            .join(', ')}⟩ (still unnormalized).`
        : `Normalize with α = 1/${(1 / step.alpha).toFixed(3)} = ${step.alpha.toFixed(
            3,
          )} → the new forward message ⟨${step.updated.map((x) => x.toFixed(3)).join(', ')}⟩.`

  return (
    <div className="mf">
      <VizGuide
        what={
          <>
            Filtering is one line of linear algebra: the forward message{' '}
            <strong>
              <em>f</em>
            </strong>{' '}
            is a column vector, and each day it’s multiplied by the transpose transition matrix{' '}
            <strong>Tᵀ</strong> (predict), then by the diagonal sensor matrix{' '}
            <strong>Oₑ</strong> (update), then rescaled by <strong>α</strong>. Same numbers as
            Topic 6 — here you watch them flow through the matrices.
          </>
        }
        how="Toggle the evidence, then step through: prediction (×Tᵀ), sensor reweight (×Oₑ), and normalize (×α) light up one at a time."
        legend={[
          { color: 'var(--brand-500)', label: 'forward message f (a belief vector)' },
          { color: 'var(--viz-4)', label: 'normalized result fₜ₊₁' },
        ]}
      />

      <div className="mf-days">
        <span className="mf-days-label">Evidence</span>
        {obs.map((o, i) => (
          <button
            key={i}
            className={`mf-day${o === UMB ? ' is-umb' : ''}${i === day ? ' is-current' : ''}`}
            onClick={() => toggleDay(i)}
            title="Toggle umbrella"
          >
            <span className="mf-day-n">day {i + 1}</span>
            <span className="mf-day-icon">{o === UMB ? '☂' : '☀'}</span>
          </button>
        ))}
      </div>

      <FormulaBlock tex={TEX} activeTerms={[phase]} ariaLabel="Matrix filtering recursion" />

      <div className="mf-consts">
        <MatrixView
          values={m.T}
          rowLabels={MX_STATE_LABELS}
          colLabels={MX_STATE_LABELS}
          label="T  (row = from, col = to)"
        />
        <MatrixView
          values={m.Tt}
          rowLabels={MX_STATE_LABELS}
          colLabels={MX_STATE_LABELS}
          highlight={phase === 'trans' ? allCells(2) : undefined}
          label="Tᵀ  (used to predict)"
        />
        <MatrixView
          values={O}
          rowLabels={MX_STATE_LABELS}
          colLabels={[OBS_LABEL[obs[day]], '']}
          dimZero
          highlight={phase === 'sensor' ? new Set(['0,0', '1,1']) : undefined}
          label={`Oₑ  (day ${day + 1}: ${obs[day] === UMB ? '☂' : '☀'})`}
        />
      </div>

      <div className="mf-pipe">
        <VecView values={fIn} labels={MX_STATE_LABELS} label="fₜ  (in)" />
        <Op>× Tᵀ ⟶</Op>
        <div className={`mf-stage${reached('trans') ? ' is-reached' : ''}${phase === 'trans' ? ' is-active' : ''}`}>
          <VecView values={step.predicted} highlight={phase === 'trans' ? new Set([0, 1]) : undefined} label="predicted" />
        </div>
        <Op>× Oₑ ⟶</Op>
        <div className={`mf-stage${reached('sensor') ? ' is-reached' : ''}${phase === 'sensor' ? ' is-active' : ''}`}>
          <VecView values={step.weighted} highlight={phase === 'sensor' ? new Set([0, 1]) : undefined} format={(n) => n.toFixed(3)} label="weighted" />
        </div>
        <Op>× α ⟶</Op>
        <div className={`mf-stage${reached('alpha') ? ' is-reached' : ''}${phase === 'alpha' ? ' is-active' : ''}`}>
          <VecView values={step.updated} accent="green" highlight={phase === 'alpha' ? new Set([0, 1]) : undefined} label="fₜ₊₁ (out)" />
        </div>
      </div>

      <details className="mf-deriv">
        <summary>
          <span className="mf-deriv-caret" aria-hidden>▶</span>
          Show the full calculation for day {day + 1} — every number plugged in
        </summary>
        <div className="mf-deriv-body">
          <div className="mf-deriv-line">
            <span className="mf-deriv-tag mf-deriv-tag--predict">1 · predict</span>
            <FormulaBlock tex={deriv.predict} ariaLabel="prediction expansion with numbers" />
          </div>
          <div className="mf-deriv-line">
            <span className="mf-deriv-tag mf-deriv-tag--sensor">2 · update</span>
            <FormulaBlock tex={deriv.update} ariaLabel="sensor update expansion with numbers" />
          </div>
          <div className="mf-deriv-line">
            <span className="mf-deriv-tag mf-deriv-tag--alpha">3 · normalize</span>
            <FormulaBlock tex={deriv.normalize} ariaLabel="normalization expansion with numbers" />
          </div>
        </div>
      </details>

      <StepPlayer player={player} stepLabel={`Day ${day + 1} · ${phase}`} caption={caption} />
    </div>
  )
}

function allCells(n: number): Set<string> {
  const s = new Set<string>()
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) s.add(`${r},${c}`)
  return s
}

const fM = (n: number) => n.toFixed(2)

interface Derivation {
  predict: string
  update: string
  normalize: string
}

/**
 * The full worked expansion of one filtering step. Each *varying* number is
 * wrapped in \htmlClass so it can be styled; keys present in `hot` (changed
 * this render) also get `deriv-num--hot`, which flashes just that number.
 */
function buildDerivation(nums: Record<string, number>, Tt: number[][], hot: Set<string>): Derivation {
  // N: a varying number (highlightable). c: a constant model coefficient (plain).
  const N = (key: string, dec = 3) =>
    String.raw`\htmlClass{deriv-num${hot.has(key) ? ' deriv-num--hot' : ''}}{${nums[key].toFixed(dec)}}`
  const c = fM
  const vec = (k0: string, k1: string) => String.raw`\begin{bmatrix} ${N(k0)} \\ ${N(k1)} \end{bmatrix}`

  const predict = String.raw`\mathbf{T}^{\top}\mathbf{f}_t
    = \begin{bmatrix} ${c(Tt[0][0])} & ${c(Tt[0][1])} \\ ${c(Tt[1][0])} & ${c(Tt[1][1])} \end{bmatrix}\!${vec('a', 'b')}
    = \begin{bmatrix} ${c(Tt[0][0])}(${N('a')}) + ${c(Tt[0][1])}(${N('b')}) \\ ${c(Tt[1][0])}(${N('a')}) + ${c(Tt[1][1])}(${N('b')}) \end{bmatrix}
    = ${vec('p0', 'p1')}`

  const update = String.raw`\mathbf{O}_e\,(\mathbf{T}^{\top}\mathbf{f}_t)
    = \begin{bmatrix} ${N('s0', 2)} & 0 \\ 0 & ${N('s1', 2)} \end{bmatrix}\!${vec('p0', 'p1')}
    = \begin{bmatrix} ${N('s0', 2)}(${N('p0')}) \\ ${N('s1', 2)}(${N('p1')}) \end{bmatrix}
    = ${vec('w0', 'w1')}`

  const normalize = String.raw`\alpha = \frac{1}{${N('w0')} + ${N('w1')}} = \frac{1}{${N('Z')}} = ${N('al')}
    \qquad
    \mathbf{f}_{t+1} = \alpha\!${vec('w0', 'w1')} = ${vec('u0', 'u1')}`

  return { predict, update, normalize }
}
