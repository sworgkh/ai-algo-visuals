import { useMemo, useState } from 'react'
import { arcCount, minimalParents, paramCount } from '@/lib/bayesnet'
import { VizGuide } from '@/components/VizGuide'
import { BayesNetCanvas } from './BayesNetCanvas'
import { BURGLARY_NET, NODE_LABELS, ORDERINGS } from './domain'
import './VariableOrdering.css'

const CAUSAL_PARAMS = 10

export function VariableOrdering() {
  const [id, setId] = useState('causal')
  const order = ORDERINGS.find((o) => o.id === id)!.order
  const learned = useMemo(() => minimalParents(BURGLARY_NET, order), [order])
  const net = useMemo(() => learned.map((n) => ({ ...n, cpt: {} })), [learned])
  const arcs = arcCount(net)
  const params = paramCount(net)
  const extra = params - CAUSAL_PARAMS

  return (
    <div className="vo">
      <VizGuide
        what={
          <>
            A Bayesian network represents the <em>same</em> distribution under any variable
            ordering — but the <strong>causal</strong> ordering is far more compact. Add variables
            in a non-causal order and each one needs more parents to stay correct, so arcs and
            parameters pile up.
          </>
        }
        how="Switch the ordering and watch the same network gain arcs; the parameter count climbs above the causal 10."
        legend={[
          { color: 'var(--border-strong)', label: 'induced arc' },
          { color: 'var(--brand-400)', label: 'node' },
        ]}
      />

      <div className="vo-orders">
        <span className="vo-orders-label">Add variables in order</span>
        <div className="vo-seg">
          {ORDERINGS.map((o) => (
            <button
              key={o.id}
              className={`vo-seg-btn${id === o.id ? ' is-active' : ''}`}
              onClick={() => setId(o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="vo-main">
        <BayesNetCanvas nodes={net} nodeClass={() => ''} />
        <div className="vo-stats">
          <div className="vo-stat">
            <span className="vo-stat-num mono">{arcs}</span>
            <span className="vo-stat-label">arcs</span>
          </div>
          <div className={`vo-stat${extra > 0 ? ' is-worse' : ' is-best'}`}>
            <span className="vo-stat-num mono">{params}</span>
            <span className="vo-stat-label">parameters</span>
          </div>
          <div className="vo-stat">
            <span className="vo-stat-num mono">{extra > 0 ? `+${extra}` : '✓ minimal'}</span>
            <span className="vo-stat-label">vs causal ({CAUSAL_PARAMS})</span>
          </div>
        </div>
      </div>

      <div className="vo-parents">
        {learned.map((n) => (
          <span className="vo-parent mono" key={n.name}>
            {NODE_LABELS[n.name]}
            {n.parents.length ? ` | ${n.parents.map((p) => NODE_LABELS[p]).join(', ')}` : ' (root)'}
          </span>
        ))}
      </div>
    </div>
  )
}
