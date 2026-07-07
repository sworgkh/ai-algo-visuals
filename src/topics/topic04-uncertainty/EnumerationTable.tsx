import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { Assignment, Joint } from '@/lib/probability'
import { enumerateQuery } from '@/lib/probability'
import { VizGuide } from '@/components/VizGuide'
import './EnumerationTable.css'

type Tri = 'any' | 'T' | 'F'

const lower = (s: string) => s.toLowerCase()

export function EnumerationTable({ joint }: { joint: Joint }) {
  const [v0, v1, v2] = joint.vars
  // rows = v0, super-columns = v1, sub-columns = v2
  const COLS = useMemo(
    () => [
      { a: true, b: true },
      { a: true, b: false },
      { a: false, b: true },
      { a: false, b: false },
    ],
    [],
  )

  const cellP = useMemo(() => {
    const m = new Map<string, number>()
    for (const e of joint.entries) m.set(`${e.assign[v0]}|${e.assign[v1]}|${e.assign[v2]}`, e.p)
    return (r: boolean, a: boolean, b: boolean) => m.get(`${r}|${a}|${b}`) ?? 0
  }, [joint, v0, v1, v2])

  const [queryVar, setQueryVar] = useState<string>(v0)
  const [evidence, setEvidence] = useState<Record<string, Tri>>({ [v1]: 'T' })

  const others = joint.vars.filter((v) => v !== queryVar)
  const ev: Assignment = useMemo(() => {
    const a: Assignment = {}
    for (const v of others) {
      const t = evidence[v]
      if (t === 'T') a[v] = true
      else if (t === 'F') a[v] = false
    }
    return a
  }, [evidence, others])

  const result = useMemo(() => enumerateQuery(joint, queryVar, ev), [joint, queryVar, ev])

  const classify = (rv: boolean, av: boolean, bv: boolean): 'true' | 'false' | 'out' => {
    const assign: Assignment = { [v0]: rv, [v1]: av, [v2]: bv }
    if (!Object.entries(ev).every(([v, val]) => assign[v] === val)) return 'out'
    return assign[queryVar] ? 'true' : 'false'
  }

  const evText = Object.entries(ev)
    .map(([v, val]) => (val ? lower(v) : `¬${lower(v)}`))
    .join(' ∧ ')
  const q = lower(queryVar)

  return (
    <div className="enum">
      <VizGuide
        what={
          <>
            The full <strong>joint distribution</strong> over {joint.vars.join(', ')} (8 numbers
            summing to 1). Any query is answered by <strong>enumeration</strong>: sum the cells
            consistent with the query, then <strong>normalize</strong> by α = 1/Σ so the answer
            sums to 1.
          </>
        }
        how="Choose a query variable and pin evidence; the matching cells light up and the sums normalize into the answer."
        legend={[
          { color: '#818cf8', label: 'cells where query = true' },
          { color: '#f472b6', label: 'cells where query = false' },
          { color: 'var(--surface-3)', label: 'excluded by evidence' },
        ]}
      />

      <div className="enum-controls">
        <div className="enum-ctl">
          <span className="enum-ctl-label">Query</span>
          <div className="enum-seg">
            {joint.vars.map((v) => (
              <button
                key={v}
                className={`enum-seg-btn${queryVar === v ? ' is-active' : ''}`}
                onClick={() => {
                  setQueryVar(v)
                  setEvidence((e) => {
                    const { [v]: _drop, ...rest } = e
                    void _drop
                    return rest
                  })
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        {others.map((v) => (
          <div className="enum-ctl" key={v}>
            <span className="enum-ctl-label">{v}</span>
            <div className="enum-seg">
              {(['any', 'T', 'F'] as Tri[]).map((t) => (
                <button
                  key={t}
                  className={`enum-seg-btn${(evidence[v] ?? 'any') === t ? ' is-active' : ''}`}
                  onClick={() => setEvidence((e) => ({ ...e, [v]: t }))}
                >
                  {t === 'any' ? 'any' : t === 'T' ? 'true' : 'false'}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="enum-table-wrap">
        <table className="enum-table">
          <thead>
            <tr>
              <th rowSpan={2} className="enum-corner" />
              <th colSpan={2}>{lower(v1)}</th>
              <th colSpan={2}>¬{lower(v1)}</th>
            </tr>
            <tr>
              <th>{lower(v2)}</th>
              <th>¬{lower(v2)}</th>
              <th>{lower(v2)}</th>
              <th>¬{lower(v2)}</th>
            </tr>
          </thead>
          <tbody>
            {[true, false].map((rv) => (
              <tr key={String(rv)}>
                <th className="enum-rowhead">{rv ? lower(v0) : `¬${lower(v0)}`}</th>
                {COLS.map(({ a, b }) => {
                  const p = cellP(rv, a, b)
                  const cls = classify(rv, a, b)
                  return (
                    <td key={`${a}-${b}`} className={`enum-cell enum-cell--${cls}`}>
                      <span className="enum-cell-p mono">{p.toFixed(3)}</span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="enum-result">
        <div className="enum-expr mono">
          P({q}
          {evText ? ` | ${evText}` : ''}) = α · Σ ={' '}
          {result.alpha ? `1/${(1 / result.alpha).toFixed(3)}` : '—'} · [
          {result.branches[0].sum.toFixed(3)}, {result.branches[1].sum.toFixed(3)}]
        </div>
        <div className="enum-bars">
          {result.branches.map((b) => (
            <div className="enum-bar-row" key={String(b.value)}>
              <span className="enum-bar-label mono">{b.value ? q : `¬${q}`}</span>
              <div className="enum-bar-track">
                <motion.div
                  className={`enum-bar-fill enum-bar-fill--${b.value ? 'true' : 'false'}`}
                  initial={false}
                  animate={{ width: `${b.normalized * 100}%` }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <span className="enum-bar-val mono">{b.normalized.toFixed(3)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
