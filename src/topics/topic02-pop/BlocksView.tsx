import { motion } from 'framer-motion'
import type { Fluent } from '@/lib/strips'
import { stacksOf } from './domain'
import './BlocksView.css'

const COLOR: Record<string, string> = {
  A: 'var(--viz-1)',
  B: 'var(--viz-3)',
  C: 'var(--viz-5)',
}

/** Blocks-world state as stacks on a table. Animates as blocks move. */
export function BlocksView({ state, caption }: { state: ReadonlySet<Fluent>; caption?: string }) {
  const stacks = stacksOf(state)
  return (
    <figure className="blocks-view">
      <div className="bv-scene">
        {stacks.map((stack, i) => (
          <div className="bv-stack" key={`${stack.join()}-${i}`}>
            {[...stack].reverse().map((b) => (
              <motion.div
                key={b}
                layout
                layoutId={`block-${b}`}
                className="bv-block"
                style={{ background: COLOR[b] ?? 'var(--viz-2)' }}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              >
                {b}
              </motion.div>
            ))}
          </div>
        ))}
      </div>
      <div className="bv-table" />
      {caption && <figcaption className="bv-caption">{caption}</figcaption>}
    </figure>
  )
}
