import type { Fluent } from '@/lib/strips'
import { stacksOf } from './domain'
import { BLOCK_COLOR, GOAL_STATE, INITIAL_STATE } from './blocksState'
import './StaticBlocks.css'

/**
 * Small, static blocks-world render (no framer-motion layoutIds, so it never
 * conflicts with the animated BlocksView). `size` scales the blocks.
 */
export function StaticBlocks({
  state,
  size = 'md',
}: {
  state: ReadonlySet<Fluent>
  size?: 'sm' | 'md'
}) {
  const stacks = stacksOf(state)
  return (
    <div className={`static-blocks sb-${size}`}>
      <div className="sb-scene">
        {stacks.map((stack, i) => (
          <div className="sb-stack" key={`${stack.join()}-${i}`}>
            {[...stack].reverse().map((b) => (
              <div
                className="sb-block"
                style={{ background: BLOCK_COLOR[b] ?? 'var(--viz-2)' }}
                key={b}
              >
                {b}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="sb-table" />
    </div>
  )
}

/** Initial → Goal reference strip, for views that don't otherwise show state. */
export function ProblemStrip({ className }: { className?: string }) {
  return (
    <div className={`problem-strip${className ? ` ${className}` : ''}`}>
      <div className="ps-item">
        <span className="ps-label">Initial</span>
        <StaticBlocks state={INITIAL_STATE} />
      </div>
      <span className="ps-arrow" aria-hidden="true">
        →
      </span>
      <div className="ps-item">
        <span className="ps-label">Goal</span>
        <StaticBlocks state={GOAL_STATE} />
      </div>
    </div>
  )
}
