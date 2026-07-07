import { motion } from 'framer-motion'
import { useStepPlayer } from '@/hooks/useStepPlayer'
import { StepPlayer } from '@/components/StepPlayer'
import { VizGuide } from '@/components/VizGuide'
import { CONSUMABLE_START, REUSABLE_CAPACITY, RESOURCE_OPS } from './domain'
import './ResourceTimeline.css'

export function ResourceTimeline() {
  const N = RESOURCE_OPS.length
  const player = useStepPlayer(N + 1)
  const idx = player.index
  const done = idx >= N

  const op = done ? null : RESOURCE_OPS[idx]
  const consumedSoFar = RESOURCE_OPS.slice(0, done ? N : idx + 1).reduce((a, o) => a + o.bolts, 0)
  const remaining = CONSUMABLE_START - consumedSoFar
  const remainingPct = (remaining / CONSUMABLE_START) * 100

  const caption = done
    ? `All operations complete. The welding robot is free again — a reusable resource returns to the pool after every use. ${remaining} / ${CONSUMABLE_START} bolts remain; consumed bolts never come back.`
    : `${op!.name}: occupies the welding robot for the duration (released afterwards)${
        op!.bolts > 0
          ? `, and permanently consumes ${op!.bolts} bolts → ${remaining} left.`
          : ` — it needs no bolts.`
      }`

  return (
    <div className="res">
      <VizGuide
        what={
          <>
            Two kinds of resources behave very differently. A <strong>reusable</strong> resource (a
            robot, a runway, a tool) is <em>occupied</em> during an action and <em>released</em>{' '}
            afterwards — its count returns to the pool. A <strong>consumable</strong> resource
            (fuel, bolts, money) is spent and <em>never</em> returns.
          </>
        }
        how="Step through the operations: the robot frees up after each one, while the bolt count only ever drops."
        legend={[
          { color: 'var(--brand-500)', label: 'reusable — returns to the pool' },
          { color: 'var(--warning)', label: 'consumable — spent forever' },
        ]}
      />

      <div className="res-cards">
        {/* Reusable */}
        <div className="res-card">
          <div className="res-card-head">
            <span className="res-kind res-kind--reuse">Reusable</span>
            <h3>Welding robot ×{REUSABLE_CAPACITY}</h3>
          </div>
          <div className="res-slot-row">
            {Array.from({ length: REUSABLE_CAPACITY }, (_, i) => (
              <div key={i} className={`res-slot${op ? ' is-busy' : ''}`}>
                {op ? <span className="res-slot-op">{op.name}</span> : <span className="res-slot-free">available</span>}
              </div>
            ))}
          </div>
          <p className="res-note">
            {op ? 'In use — will be released when the action finishes.' : 'Idle and available.'}{' '}
            Count returns to the pool after use.
          </p>
        </div>

        {/* Consumable */}
        <div className="res-card">
          <div className="res-card-head">
            <span className="res-kind res-kind--consume">Consumable</span>
            <h3>Bolts</h3>
          </div>
          <div className="res-meter">
            <motion.div
              className="res-meter-fill"
              initial={false}
              animate={{ width: `${Math.max(0, remainingPct)}%` }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            />
            <span className="res-meter-value mono">
              {remaining} / {CONSUMABLE_START}
            </span>
          </div>
          <p className="res-note">
            Monotonically decreasing — {consumedSoFar} spent so far, and none of it comes back.
          </p>
        </div>
      </div>

      <StepPlayer player={player} stepLabel={done ? 'Done' : `Operation ${idx + 1}`} caption={caption} />
    </div>
  )
}
