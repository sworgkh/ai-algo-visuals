import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { filter } from '@/lib/hmm'
import { useStepPlayer } from '@/hooks/useStepPlayer'
import { StepPlayer } from '@/components/StepPlayer'
import { FormulaBlock } from '@/components/FormulaBlock'
import { term } from '@/components/formula'
import { VizGuide } from '@/components/VizGuide'
import { DEFAULT_OBS, NOUMB, OBS_LABEL, RAIN, UMB, UMBRELLA_HMM } from './domain'
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

      <StepPlayer player={player} stepLabel={`Day ${day + 1} · ${phase}`} caption={caption} />
    </div>
  )
}
