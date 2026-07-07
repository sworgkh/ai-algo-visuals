import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { VizGuide } from '@/components/VizGuide'
import { HTN_NODES, HTN_ROOT } from './domain'
import './HtnTree.css'

function NodeView({
  id,
  chosen,
  toggle,
}: {
  id: string
  chosen: Record<string, number>
  toggle: (id: string, i: number) => void
}) {
  const node = HTN_NODES[id]
  const pick = chosen[id]
  return (
    <div className="htn-node-wrap">
      <div className={`htn-node${node.primitive ? ' is-prim' : ' is-hla'}`}>
        <span className="htn-tag">{node.primitive ? 'primitive' : 'HLA'}</span>
        <span className="htn-label mono">{node.label}</span>
      </div>

      {!node.primitive && node.refinements && (
        <div className="htn-refs">
          <span className="htn-refs-label">Refinements</span>
          {node.refinements.map((r, i) => (
            <button
              key={r.name}
              className={`htn-ref-btn${pick === i ? ' is-active' : ''}`}
              onClick={() => toggle(id, i)}
              aria-pressed={pick === i}
            >
              {r.name}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {!node.primitive && node.refinements && pick != null && pick >= 0 && (
          <motion.div
            className="htn-children"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {node.refinements[pick].steps.map((sid) => (
              <NodeView key={sid} id={sid} chosen={chosen} toggle={toggle} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function HtnTree() {
  const [chosen, setChosen] = useState<Record<string, number>>({})
  const toggle = (id: string, i: number) =>
    setChosen((c) => ({ ...c, [id]: c[id] === i ? -1 : i }))

  return (
    <div className="htn">
      <VizGuide
        what={
          <>
            A <strong>high-level action</strong> (HLA) isn’t executable directly — it has one or
            more <strong>refinements</strong>, each a sequence of sub-actions. Refining recursively
            until every leaf is a <strong>primitive</strong> yields an executable plan.
          </>
        }
        how="Click a refinement to expand an HLA; keep expanding until only primitives remain."
        legend={[
          { color: '#8b5cf6', label: 'HLA — must be refined' },
          { color: 'var(--success)', label: 'primitive — directly executable' },
        ]}
      />
      <div className="htn-tree">
        <NodeView id={HTN_ROOT} chosen={chosen} toggle={toggle} />
      </div>
    </div>
  )
}
