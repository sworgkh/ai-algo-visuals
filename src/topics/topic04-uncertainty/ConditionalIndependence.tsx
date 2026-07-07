import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Assignment, Joint } from '@/lib/probability'
import { condProb } from '@/lib/probability'
import { VizGuide } from '@/components/VizGuide'
import './ConditionalIndependence.css'

type Cond = 'off' | 'yes' | 'no'
const lower = (s: string) => s.toLowerCase()

export function ConditionalIndependence({ joint }: { joint: Joint }) {
  const [cause, e1, e2] = joint.vars
  const [cond, setCond] = useState<Cond>('off')
  const base: Assignment = cond === 'yes' ? { [cause]: true } : cond === 'no' ? { [cause]: false } : {}

  const withE1 = condProb(joint, { [e2]: true }, { [e1]: true, ...base })
  const withoutE1 = condProb(joint, { [e2]: true }, { [e1]: false, ...base })
  const independent = Math.abs(withE1 - withoutE1) < 1e-9

  const condLabel = cond === 'off' ? '' : cond === 'yes' ? `, ${lower(cause)}` : `, ¬${lower(cause)}`
  const rows = [
    { label: `P(${lower(e2)} | ${lower(e1)}${condLabel})`, p: withE1 },
    { label: `P(${lower(e2)} | ¬${lower(e1)}${condLabel})`, p: withoutE1 },
  ]

  return (
    <div className="ci">
      <VizGuide
        what={
          <>
            {e1} and {e2} share a common cause ({cause}), so they look{' '}
            <strong>correlated</strong>. But once you <strong>know {lower(cause)}</strong>, learning{' '}
            {lower(e1)} tells you <em>nothing</em> more about {lower(e2)}: they’re{' '}
            <strong>conditionally independent given {cause}</strong>. The common cause screens them
            off.
          </>
        }
        how="Toggle what you condition on. With no conditioning the two bars differ (correlated); condition on the cause and they snap equal (independent)."
        legend={[
          { color: 'var(--viz-3)', label: `P(${lower(e2)} | ${lower(e1)})` },
          { color: 'var(--viz-5)', label: `P(${lower(e2)} | ¬${lower(e1)})` },
        ]}
      />

      <div className="ci-controls">
        <span className="ci-ctl-label">Condition on</span>
        <div className="ci-seg">
          {(
            [
              ['off', 'nothing'],
              ['yes', lower(cause)],
              ['no', `¬${lower(cause)}`],
            ] as [Cond, string][]
          ).map(([v, label]) => (
            <button
              key={v}
              className={`ci-seg-btn${cond === v ? ' is-active' : ''}`}
              onClick={() => setCond(v)}
            >
              {label}
            </button>
          ))}
        </div>
        <span className={`ci-verdict${independent ? ' is-indep' : ' is-corr'}`}>
          {independent ? '✓ independent — bars equal' : '✗ correlated — bars differ'}
        </span>
      </div>

      <div className="ci-bars">
        {rows.map((r, i) => (
          <div className="ci-bar-row" key={r.label}>
            <span className="ci-bar-label mono">{r.label}</span>
            <div className="ci-bar-track">
              <motion.div
                className="ci-bar-fill"
                style={{ background: i === 0 ? 'var(--viz-3)' : 'var(--viz-5)' }}
                initial={false}
                animate={{ width: `${r.p * 100}%` }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
              <span className="ci-bar-val mono">{r.p.toFixed(3)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
