import { useState } from 'react'
import { motion } from 'framer-motion'
import { bayesTest } from '@/lib/probability'
import { FormulaBlock } from '@/components/FormulaBlock'
import { VizGuide } from '@/components/VizGuide'
import './BayesMassFlow.css'

function Slider({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <label className="bmf-slider">
      <span className="bmf-slider-top">
        <span>{label}</span>
        <span className="mono">{(value * 100).toFixed(1)}%</span>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        step={0.1}
        value={value * 100}
        onChange={(e) => onChange(e.currentTarget.valueAsNumber / 100)}
      />
    </label>
  )
}

const pct = (v: number) => `${Math.max(0, v) * 100}%`

export function BayesMassFlow() {
  const [prior, setPrior] = useState(0.01)
  const [sens, setSens] = useState(0.9)
  const [fpr, setFpr] = useState(0.096)
  const r = bayesTest(prior, sens, fpr)

  const f = (n: number) => n.toFixed(3)
  const tex = String.raw`P(D\mid+)=\frac{P(+\mid D)\,P(D)}{P(+\mid D)P(D)+P(+\mid\lnot D)P(\lnot D)}=\frac{${f(
    sens,
  )}\cdot${f(prior)}}{${f(sens)}\cdot${f(prior)}+${f(fpr)}\cdot${f(1 - prior)}}=${f(r.posterior)}`

  return (
    <div className="bmf">
      <VizGuide
        what={
          <>
            <strong>Bayes’ rule</strong> flips a test result into a diagnosis. Even an accurate test
            for a <em>rare</em> disease yields a surprisingly low posterior — because the few true
            positives are swamped by false positives from the huge healthy population (the{' '}
            <strong>base-rate fallacy</strong>).
          </>
        }
        how="Drag the sliders. Watch the green (true-positive) mass shrink against the amber (false-positive) mass as the disease gets rarer."
        legend={[
          { color: 'var(--success)', label: 'true positives (have disease, test +)' },
          { color: 'var(--warning)', label: 'false positives (healthy, test +)' },
          { color: 'var(--surface-4)', label: 'test negative' },
        ]}
      />

      <div className="bmf-sliders">
        <Slider label="P(disease) — prior" value={prior} onChange={setPrior} />
        <Slider label="Sensitivity  P(+ | disease)" value={sens} onChange={setSens} />
        <Slider label="False positive  P(+ | ¬disease)" value={fpr} onChange={setFpr} />
      </div>

      <div className="bmf-flow">
        <div className="bmf-row">
          <span className="bmf-row-label">Population</span>
          <div className="bmf-bar">
            <div className="bmf-seg bmf-seg--disease" style={{ width: pct(prior) }}>
              {prior > 0.08 && <span>disease</span>}
            </div>
            <div className="bmf-seg bmf-seg--healthy" style={{ width: pct(1 - prior) }}>
              healthy
            </div>
          </div>
        </div>

        <div className="bmf-row">
          <span className="bmf-row-label">Tested positive</span>
          <div className="bmf-bar">
            <motion.div
              className="bmf-seg bmf-seg--tp"
              animate={{ width: pct(r.truePositive) }}
              initial={false}
              transition={{ duration: 0.3 }}
            />
            <div className="bmf-seg bmf-seg--neg" style={{ width: pct(prior - r.truePositive) }} />
            <motion.div
              className="bmf-seg bmf-seg--fp"
              animate={{ width: pct(r.falsePositiveMass) }}
              initial={false}
              transition={{ duration: 0.3 }}
            />
            <div
              className="bmf-seg bmf-seg--neg"
              style={{ width: pct(1 - prior - r.falsePositiveMass) }}
            />
          </div>
        </div>
      </div>

      <div className="bmf-posterior">
        <div className="bmf-posterior-head">
          <span>Among everyone who tests positive, the fraction who actually have the disease:</span>
          <span className="bmf-posterior-val mono">{(r.posterior * 100).toFixed(1)}%</span>
        </div>
        <div className="bmf-bar bmf-bar--post">
          <motion.div
            className="bmf-seg bmf-seg--tp"
            animate={{ width: pct(r.posterior) }}
            initial={false}
            transition={{ duration: 0.3 }}
          >
            {r.posterior > 0.12 && <span>P(D|+)</span>}
          </motion.div>
          <motion.div
            className="bmf-seg bmf-seg--fp"
            animate={{ width: pct(1 - r.posterior) }}
            initial={false}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <FormulaBlock tex={tex} ariaLabel="Bayes' rule posterior" />
    </div>
  )
}
