import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { BayesNet, World } from '@/lib/bayesnet'
import { enumerationAsk, enumerationTerms } from '@/lib/bayesnet'
import { VizGuide } from '@/components/VizGuide'
import { BayesNetCanvas } from './BayesNetCanvas'
import { BURGLARY_NET, NODE_LABELS } from './domain'
import './EnumerationInference.css'

type Tri = 'any' | 'T' | 'F'
const ALL = ['B', 'E', 'A', 'J', 'M']
const short = (n: string) => n.toLowerCase()

const MAX_TERMS = 8

function cloneNet(net: BayesNet): BayesNet {
  return net.map((n) => ({ ...n, parents: [...n.parents], cpt: { ...n.cpt } }))
}

function keyLabel(node: BayesNet[number], key: string): string {
  if (node.parents.length === 0) return ''
  return node.parents.map((p, i) => (key[i] === 'T' ? short(p) : `¬${short(p)}`)).join(',')
}

export function EnumerationInference() {
  const [net, setNet] = useState<BayesNet>(() => cloneNet(BURGLARY_NET))
  const [queryVar, setQueryVar] = useState('B')
  const [evidence, setEvidence] = useState<Record<string, Tri>>({ J: 'T', M: 'T' })

  const others = ALL.filter((v) => v !== queryVar)
  const ev: World = useMemo(() => {
    const a: World = {}
    for (const v of others) {
      const t = evidence[v]
      if (t === 'T') a[v] = true
      else if (t === 'F') a[v] = false
    }
    return a
  }, [evidence, others])

  const result = useMemo(() => enumerationAsk(net, queryVar, ev), [net, queryVar, ev])
  const termsTrue = useMemo(() => enumerationTerms(net, queryVar, true, ev), [net, queryVar, ev])
  const termsFalse = useMemo(() => enumerationTerms(net, queryVar, false, ev), [net, queryVar, ev])

  const setDur = (nodeName: string, key: string, v: number) => {
    setNet((prev) =>
      prev.map((n) =>
        n.name === nodeName ? { ...n, cpt: { ...n.cpt, [key]: Math.max(0, Math.min(1, v || 0)) } } : n,
      ),
    )
  }

  const evText = Object.entries(ev)
    .map(([v, val]) => (val ? short(v) : `¬${short(v)}`))
    .join(', ')
  const q = short(queryVar)

  const nodeClass = (name: string) => {
    if (name === queryVar) return 'is-query'
    if (name in ev) return 'is-evidence'
    return ''
  }

  const renderBranch = (value: boolean, terms: typeof termsTrue) => (
    <div className="bn-branch">
      <div className="bn-branch-head mono">
        Σ for {value ? q : `¬${q}`} = <strong>{terms.sum.toExponential(3)}</strong>
      </div>
      <div className="bn-terms">
        {terms.terms.slice(0, MAX_TERMS).map((t, i) => (
          <motion.div
            className="bn-term mono"
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.03 }}
          >
            <span className="bn-term-factors">
              {t.factors
                .map((f) => `${f.value ? '' : '¬'}${short(f.node)}${f.given.length ? '|' : ''}${f.given
                  .map((g) => (g.value ? short(g.name) : `¬${short(g.name)}`))
                  .join('')}=${Number(f.p.toFixed(3))}`)
                .join(' · ')}
            </span>
            <span className="bn-term-prod">{t.product.toExponential(2)}</span>
          </motion.div>
        ))}
        {terms.terms.length > MAX_TERMS && (
          <div className="bn-term-more">+{terms.terms.length - MAX_TERMS} more terms</div>
        )}
      </div>
    </div>
  )

  return (
    <div className="bn-enum">
      <VizGuide
        what={
          <>
            A <strong>Bayesian network</strong> factors the joint as{' '}
            <span className="mono">∏ P(xᵢ | parents)</span>. A query is answered by{' '}
            <strong>enumeration</strong>: sum that product over every setting of the hidden
            variables, for each value of the query, then normalize by α.
          </>
        }
        how="Pick a query and evidence; edit any CPT entry to see the answer recompute. The query node glows, evidence nodes are green."
        legend={[
          { color: 'var(--brand-400)', label: 'query variable' },
          { color: 'var(--success)', label: 'evidence (observed)' },
        ]}
      />

      <div className="bn-controls">
        <div className="bn-ctl">
          <span className="bn-ctl-label">Query</span>
          <div className="bn-seg">
            {ALL.map((v) => (
              <button
                key={v}
                className={`bn-seg-btn${queryVar === v ? ' is-active' : ''}`}
                onClick={() => {
                  setQueryVar(v)
                  setEvidence((e) => {
                    const { [v]: _d, ...rest } = e
                    void _d
                    return rest
                  })
                }}
                title={NODE_LABELS[v]}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        {others.map((v) => (
          <div className="bn-ctl" key={v}>
            <span className="bn-ctl-label">{v}</span>
            <div className="bn-seg">
              {(['any', 'T', 'F'] as Tri[]).map((t) => (
                <button
                  key={t}
                  className={`bn-seg-btn${(evidence[v] ?? 'any') === t ? ' is-active' : ''}`}
                  onClick={() => setEvidence((e) => ({ ...e, [v]: t }))}
                >
                  {t === 'any' ? '·' : t}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bn-main">
        <BayesNetCanvas nodes={net} nodeClass={nodeClass} />
        <div className="bn-cpts">
          <div className="bn-cpts-title">CPTs — P(node = true | parents)</div>
          {net.map((node) => (
            <div className="bn-cpt" key={node.name}>
              <span className="bn-cpt-node">{NODE_LABELS[node.name]}</span>
              <div className="bn-cpt-rows">
                {Object.keys(node.cpt).map((key) => (
                  <label className="bn-cpt-cell" key={key}>
                    <span className="bn-cpt-key mono">{keyLabel(node, key) || 'P'}</span>
                    <input
                      type="number"
                      min={0}
                      max={1}
                      step={0.001}
                      value={node.cpt[key]}
                      onChange={(e) => setDur(node.name, key, e.currentTarget.valueAsNumber)}
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bn-result">
        <div className="bn-expr mono">
          P({q}
          {evText ? ` | ${evText}` : ''}) = α · [{result.rawTrue.toExponential(3)},{' '}
          {result.rawFalse.toExponential(3)}] → ⟨{result.true.toFixed(3)}, {result.false.toFixed(3)}⟩
        </div>
        <div className="bn-branches">
          {renderBranch(true, termsTrue)}
          {renderBranch(false, termsFalse)}
        </div>
        <div className="bn-bars">
          {[
            { label: q, v: result.true, cls: 'true' },
            { label: `¬${q}`, v: result.false, cls: 'false' },
          ].map((b) => (
            <div className="bn-bar-row" key={b.label}>
              <span className="bn-bar-label mono">{b.label}</span>
              <div className="bn-bar-track">
                <motion.div
                  className={`bn-bar-fill bn-bar-fill--${b.cls}`}
                  initial={false}
                  animate={{ width: `${b.v * 100}%` }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <span className="bn-bar-val mono">{b.v.toFixed(3)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
