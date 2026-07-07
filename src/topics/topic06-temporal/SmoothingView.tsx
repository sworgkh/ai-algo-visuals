import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { smooth } from '@/lib/hmm'
import { VizGuide } from '@/components/VizGuide'
import { DEFAULT_OBS, NOUMB, RAIN, UMB } from './domain'
import { UMBRELLA_HMM } from './domain'
import './SmoothingView.css'

export function SmoothingView() {
  const [obs, setObs] = useState<string[]>(DEFAULT_OBS)
  const { filtered, smoothed } = useMemo(() => smooth(UMBRELLA_HMM, obs), [obs])
  const toggle = (i: number) => setObs((o) => o.map((v, j) => (j === i ? (v === UMB ? NOUMB : UMB) : v)))

  return (
    <div className="sm">
      <VizGuide
        what={
          <>
            <strong>Smoothing</strong> re-estimates a past state using <em>all</em> the evidence —
            past <em>and</em> future (forward–backward). Later observations revise earlier beliefs:
            they can <strong>reinforce</strong> an estimate (a following umbrella makes yesterday’s
            rain more certain) or <strong>pull it back</strong> (a following sunny day makes it less
            certain). It’s always the better-informed estimate — never worse than filtering.
          </>
        }
        how="Toggle the umbrellas. Compare the filtered bar (evidence up to that day) with the smoothed bar (all days). The last day is identical — it has no future to look at."
        legend={[
          { color: 'var(--brand-500)', label: 'filtered  P(Rainₜ | e₁:ₜ)' },
          { color: '#f472b6', label: 'smoothed  P(Rainₜ | e₁:T)' },
        ]}
      />

      <div className="sm-days">
        {obs.map((o, i) => (
          <button key={i} className={`sm-day${o === UMB ? ' is-umb' : ''}`} onClick={() => toggle(i)}>
            <span className="sm-day-n">day {i + 1}</span>
            <span className="sm-day-icon">{o === UMB ? '☂' : '☀'}</span>
          </button>
        ))}
      </div>

      <div className="sm-chart">
        {obs.map((_, i) => (
          <div className="sm-group" key={i}>
            <div className="sm-pair">
              {[
                { v: filtered[i][RAIN], cls: 'filt' },
                { v: smoothed[i][RAIN], cls: 'smooth' },
              ].map((b, j) => (
                <div className="sm-bar-col" key={j}>
                  <span className="sm-bar-val mono">{b.v.toFixed(2)}</span>
                  <div className="sm-bar-track">
                    <motion.div
                      className={`sm-bar sm-bar--${b.cls}`}
                      initial={false}
                      animate={{ height: `${b.v * 100}%` }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <span className="sm-group-label">day {i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
