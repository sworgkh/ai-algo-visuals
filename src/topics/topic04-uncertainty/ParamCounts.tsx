import { useState } from 'react'
import { fullJointParams, naiveBayesParams } from '@/lib/probability'
import { VizGuide } from '@/components/VizGuide'
import './ParamCounts.css'

const MAX_N = 20
const NS = Array.from({ length: MAX_N }, (_, i) => i + 1)
const maxLog = Math.log10(fullJointParams(MAX_N) + 1)
const logH = (v: number) => `${(Math.log10(v + 1) / maxLog) * 100}%`

const fmt = (n: number) => n.toLocaleString('en-US')

export function ParamCounts() {
  const [n, setN] = useState(10)
  const joint = fullJointParams(n)
  const naive = naiveBayesParams(n)

  return (
    <div className="pc">
      <VizGuide
        what={
          <>
            A full joint distribution over <em>n</em> boolean variables needs{' '}
            <strong>2ⁿ − 1</strong> independent numbers — it <strong>doubles</strong> with each new
            variable. Assuming conditional independence (naïve Bayes) needs only{' '}
            <strong>2n + 1</strong>, which grows <em>linearly</em>. That gap is why we exploit
            independence.
          </>
        }
        how="Drag n and watch the full-joint bar shoot up a log axis while naïve Bayes barely moves."
        legend={[
          { color: 'var(--brand-500)', label: 'full joint · 2ⁿ − 1' },
          { color: 'var(--success)', label: 'naïve Bayes · 2n + 1' },
        ]}
      />

      <div className="pc-readout">
        <label className="pc-slider">
          <span className="pc-slider-top">
            <span>variables n</span>
            <span className="mono">{n}</span>
          </span>
          <input type="range" min={1} max={MAX_N} value={n} onChange={(e) => setN(e.currentTarget.valueAsNumber)} />
        </label>
        <div className="pc-nums">
          <div className="pc-num pc-num--joint">
            <span className="pc-num-label">Full joint · 2ⁿ − 1</span>
            <span className="pc-num-val mono">{fmt(joint)}</span>
          </div>
          <div className="pc-num pc-num--naive">
            <span className="pc-num-label">Naïve Bayes · 2n + 1</span>
            <span className="pc-num-val mono">{fmt(naive)}</span>
          </div>
          <div className="pc-num pc-num--ratio">
            <span className="pc-num-label">Ratio</span>
            <span className="pc-num-val mono">{fmt(Math.round(joint / naive))}×</span>
          </div>
        </div>
      </div>

      <div className="pc-chart">
        <div className="pc-chart-axis">log₁₀ scale</div>
        <div className="pc-bars">
          {NS.map((k) => (
            <button
              key={k}
              className={`pc-col${k === n ? ' is-active' : ''}`}
              onClick={() => setN(k)}
              title={`n=${k}: joint ${fmt(fullJointParams(k))}, naïve ${fmt(naiveBayesParams(k))}`}
            >
              <span className="pc-col-bars">
                <span className="pc-col-bar pc-col-bar--joint" style={{ height: logH(fullJointParams(k)) }} />
                <span className="pc-col-bar pc-col-bar--naive" style={{ height: logH(naiveBayesParams(k)) }} />
              </span>
              <span className="pc-col-n">{k}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
