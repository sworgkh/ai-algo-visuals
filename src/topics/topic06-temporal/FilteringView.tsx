import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { type FilterStep, type HMM, filter } from '@/lib/hmm'
import { useStepPlayer } from '@/hooks/useStepPlayer'
import { StepPlayer } from '@/components/StepPlayer'
import { FormulaBlock } from '@/components/FormulaBlock'
import { term } from '@/components/formula'
import { VizGuide } from '@/components/VizGuide'
import { DEFAULT_OBS, NORAIN, NOUMB, OBS_LABEL, RAIN, UMB, UMBRELLA_HMM } from './domain'
import './FilteringView.css'

const TEX = String.raw`P(R_t \mid e_{1:t}) = ${term('update', '\\alpha\\, P(e_t \\mid R_t)')}\; ${term(
  'predict',
  '\\sum_{r} P(R_t \\mid r)\\,P(r \\mid e_{1:t-1})',
)}`

export function FilteringView() {
  const [obs, setObs] = useState<string[]>(DEFAULT_OBS)
  const result = useMemo(() => filter(UMBRELLA_HMM, obs), [obs])

  // 2 steps per day: predict, then update.
  const player = useStepPlayer(obs.length * 2)
  const idx = player.index
  const day = Math.floor(idx / 2)
  const phase: 'predict' | 'update' = idx % 2 === 0 ? 'predict' : 'update'
  const step = result.steps[day]
  const cur = phase === 'predict' ? step.predicted : step.updated

  const toggleDay = (i: number) => {
    setObs((o) => o.map((v, j) => (j === i ? (v === UMB ? NOUMB : UMB) : v)))
    player.reset()
  }
  const addDay = () => setObs((o) => [...o, UMB])
  const removeDay = () => setObs((o) => (o.length > 1 ? o.slice(0, -1) : o))

  const prevRain = day === 0 ? result.prior[RAIN] : result.steps[day - 1].updated[RAIN]
  const caption =
    phase === 'predict'
      ? `Predict day ${day + 1}: P(R) = 0.7·${prevRain.toFixed(3)} + 0.3·${(1 - prevRain).toFixed(
          3,
        )} = ${step.predicted[RAIN].toFixed(3)}. The belief drifts toward 0.5.`
      : `Update with ${OBS_LABEL[obs[day]]}: reweight by the sensor and normalize → P(R) = ${step.updated[
          RAIN
        ].toFixed(3)}.`

  const deriv = buildDerivation(prevRain, step, UMBRELLA_HMM, obs[day])

  return (
    <div className="flt">
      <VizGuide
        what={
          <>
            <strong>Filtering</strong> tracks the belief P(Rainₜ | evidence) one day at a time in
            two moves: <strong>predict</strong> (roll last day’s belief through the transition
            model — it drifts toward 0.5) then <strong>update</strong> (reweight by whether an
            umbrella was seen, and normalize).
          </>
        }
        how="Toggle any day’s umbrella to change the evidence; step through to watch predict then update, with the formula terms glowing in sync."
        legend={[
          { color: 'var(--brand-400)', label: 'predict term (Σ transition)' },
          { color: 'var(--violet-400)', label: 'update term (α · sensor)' },
        ]}
      />

      <div className="flt-days">
        <span className="flt-days-label">Evidence</span>
        {obs.map((o, i) => (
          <button
            key={i}
            className={`flt-day${o === UMB ? ' is-umb' : ''}${i === day ? ' is-current' : ''}`}
            onClick={() => toggleDay(i)}
            title="Toggle umbrella"
          >
            <span className="flt-day-n">day {i + 1}</span>
            <span className="flt-day-icon">{o === UMB ? '☂' : '☀'}</span>
            <span className="flt-day-p mono">{result.steps[i].updated[RAIN].toFixed(3)}</span>
          </button>
        ))}
        <div className="flt-day-ctl">
          <button onClick={addDay} title="Add day">+</button>
          <button onClick={removeDay} title="Remove day">−</button>
        </div>
      </div>

      <FormulaBlock tex={TEX} activeTerms={[phase]} ariaLabel="Filtering recursion" />

      <div className="flt-belief">
        <div className={`flt-phase-tag flt-phase-tag--${phase}`}>
          Day {day + 1} · {phase}
        </div>
        <div className="flt-bars">
          {UMBRELLA_HMM.states.map((s) => (
            <div className="flt-bar-row" key={s}>
              <span className="flt-bar-label">{s === RAIN ? 'Rain' : 'No rain'}</span>
              <div className="flt-bar-track">
                <motion.div
                  className={`flt-bar-fill${s === RAIN ? ' is-rain' : ''}`}
                  initial={false}
                  animate={{ width: `${cur[s] * 100}%` }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <span className="flt-bar-val mono">{cur[s].toFixed(3)}</span>
            </div>
          ))}
        </div>
      </div>

      <details className="flt-deriv">
        <summary>
          <span className="flt-deriv-caret" aria-hidden>▶</span>
          Show the full calculation for day {day + 1} — every number plugged in
        </summary>
        <div className="flt-deriv-body">
          <div className="flt-deriv-line">
            <span className="flt-deriv-tag flt-deriv-tag--predict">1 · predict</span>
            <div className="flt-deriv-anim" key={deriv.predict}>
              <FormulaBlock tex={deriv.predict} ariaLabel="prediction expansion with numbers" />
            </div>
          </div>
          <div className="flt-deriv-line">
            <span className="flt-deriv-tag flt-deriv-tag--update">2 · update</span>
            <div className="flt-deriv-anim" key={deriv.update}>
              <FormulaBlock tex={deriv.update} ariaLabel="sensor update and normalization with numbers" />
            </div>
          </div>
        </div>
      </details>

      <StepPlayer player={player} stepLabel={`Day ${day + 1} · ${phase}`} caption={caption} />
    </div>
  )
}

const f2 = (n: number) => n.toFixed(2)
const f3 = (n: number) => n.toFixed(3)

interface Derivation {
  predict: string
  update: string
}

/** The full scalar expansion of one filtering day with every number plugged in. */
function buildDerivation(prevRain: number, step: FilterStep, hmm: HMM, obs: string): Derivation {
  const pr = prevRain
  const pnr = 1 - prevRain
  const predR = step.predicted[RAIN]
  const predNR = step.predicted[NORAIN]
  const sR = hmm.sensor[RAIN][obs]
  const sNR = hmm.sensor[NORAIN][obs]
  const wR = sR * predR
  const wNR = sNR * predNR
  const Z = wR + wNR
  const updR = step.updated[RAIN]

  const predict = String.raw`\begin{aligned}
    P(R_t \mid e_{1:t-1}) &= \sum_r P(R_t \mid r)\,P(r \mid e_{1:t-1}) \\[2pt]
    &= ${f2(hmm.trans[RAIN][RAIN])}(${f3(pr)}) + ${f2(hmm.trans[NORAIN][RAIN])}(${f3(pnr)}) = \mathbf{${f3(predR)}} \\[2pt]
    P(\lnot R_t \mid e_{1:t-1}) &= ${f2(hmm.trans[RAIN][NORAIN])}(${f3(pr)}) + ${f2(hmm.trans[NORAIN][NORAIN])}(${f3(pnr)}) = \mathbf{${f3(predNR)}}
  \end{aligned}`

  const update = String.raw`\begin{aligned}
    \tilde P(R_t) &= P(e_t \mid R_t)\,P(R_t \mid e_{1:t-1}) = ${f2(sR)}(${f3(predR)}) = ${f3(wR)} \\[2pt]
    \tilde P(\lnot R_t) &= ${f2(sNR)}(${f3(predNR)}) = ${f3(wNR)} \\[2pt]
    \alpha &= \frac{1}{${f3(wR)} + ${f3(wNR)}} = \frac{1}{${f3(Z)}} = ${f3(1 / Z)} \\[2pt]
    P(R_t \mid e_{1:t}) &= \alpha\,\tilde P(R_t) = \mathbf{${f3(updR)}}
  \end{aligned}`

  return { predict, update }
}
