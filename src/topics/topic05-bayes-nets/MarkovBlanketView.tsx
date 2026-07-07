import { useState } from 'react'
import { markovBlanket } from '@/lib/bayesnet'
import { VizGuide } from '@/components/VizGuide'
import { BayesNetCanvas } from './BayesNetCanvas'
import { BURGLARY_NET, NODE_LABELS } from './domain'
import './MarkovBlanketView.css'

export function MarkovBlanketView() {
  const [focus, setFocus] = useState<string>('A')
  const mb = markovBlanket(BURGLARY_NET, focus)
  const mbSet = new Set(mb)

  const nodeClass = (name: string) => {
    const base = ' is-hoverable'
    if (name === focus) return 'is-focus' + base
    if (mbSet.has(name)) return 'is-blanket' + base
    return 'is-dim' + base
  }
  const arcClass = (from: string, to: string) => {
    const touches = (n: string) => n === focus || mbSet.has(n)
    return touches(from) && touches(to) ? 'is-active' : 'is-dim'
  }

  return (
    <div className="mb">
      <VizGuide
        what={
          <>
            A node’s <strong>Markov blanket</strong> is its parents, its children, and its
            children’s other parents. Given its blanket, a node is{' '}
            <strong>conditionally independent of every other node</strong> in the network — so the
            blanket is all you need to know to predict it.
          </>
        }
        how="Hover any node to light up its Markov blanket; everything outside dims."
        legend={[
          { color: 'var(--brand-300)', label: 'the node' },
          { color: 'var(--violet-400)', label: 'its Markov blanket' },
        ]}
      />

      <BayesNetCanvas
        nodes={BURGLARY_NET}
        nodeClass={nodeClass}
        arcClass={arcClass}
        onNodeEnter={setFocus}
      />

      <div className="mb-readout">
        <span className="mb-readout-label">Markov blanket of</span>
        <span className="mb-focus mono">{NODE_LABELS[focus]}</span>
        <span className="mb-eq">=</span>
        <span className="mb-set">
          {'{ '}
          {mb.map((n) => (
            <span className="mb-chip mono" key={n}>
              {NODE_LABELS[n]}
            </span>
          ))}
          {' }'}
        </span>
      </div>
    </div>
  )
}
