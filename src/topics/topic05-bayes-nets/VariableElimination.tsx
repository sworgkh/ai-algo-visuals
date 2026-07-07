import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { enumerationAsk } from '@/lib/bayesnet'
import { useStepPlayer } from '@/hooks/useStepPlayer'
import { StepPlayer } from '@/components/StepPlayer'
import { VizGuide } from '@/components/VizGuide'
import { BURGLARY_NET, NODE_LABELS } from './domain'
import './VariableElimination.css'

interface Factor {
  id: string
  scope: string[]
}
interface VEStep {
  caption: string
  factors: Factor[]
  combining: string[]
  produced: string | null
}

/** Scope-level trace of variable elimination for P(B | j, m), eliminating E then A. */
function buildTrace(): VEStep[] {
  const steps: VEStep[] = []
  let factors: Factor[] = [
    { id: 'fB', scope: ['B'] },
    { id: 'fE', scope: ['E'] },
    { id: 'fA', scope: ['A', 'B', 'E'] },
    { id: 'fJ', scope: ['A'] }, // J fixed by evidence → scope {A}
    { id: 'fM', scope: ['A'] }, // M fixed by evidence → scope {A}
  ]
  steps.push({
    caption:
      'Start with one factor per CPT. Evidence (JohnCalls, MaryCalls) is fixed, so those factors keep only {Alarm} in scope.',
    factors,
    combining: [],
    produced: null,
  })

  const eliminate = (v: string, newId: string, caption: string) => {
    const involved = factors.filter((f) => f.scope.includes(v))
    const scope = [...new Set(involved.flatMap((f) => f.scope))].filter((x) => x !== v).sort()
    const next: Factor[] = [...factors.filter((f) => !f.scope.includes(v)), { id: newId, scope }]
    steps.push({ caption, factors: next, combining: involved.map((f) => f.id), produced: newId })
    factors = next
  }

  eliminate(
    'E',
    'f1',
    'Eliminate Earthquake: multiply every factor mentioning E, then sum E out → a new factor over {Alarm, Burglary}.',
  )
  eliminate(
    'A',
    'f2',
    'Eliminate Alarm: multiply every factor mentioning A, then sum A out → a factor over {Burglary}.',
  )

  const r = enumerationAsk(BURGLARY_NET, 'B', { J: true, M: true })
  steps.push({
    caption: `Multiply the remaining {Burglary} factors and normalize → P(Burglary | j, m) = ⟨${r.true.toFixed(
      3,
    )}, ${r.false.toFixed(3)}⟩. Largest factor built: 8 rows — far less work than enumerating the full 32-row joint.`,
    factors: [{ id: 'f3', scope: ['B'] }],
    combining: ['fB', 'f2'],
    produced: 'f3',
  })
  return steps
}

const fscope = (scope: string[]) => scope.map((s) => s[0]).join(',')

export function VariableElimination() {
  const trace = useMemo(() => buildTrace(), [])
  const player = useStepPlayer(trace.length)
  const step = trace[player.index]

  return (
    <div className="ve">
      <VizGuide
        what={
          <>
            <strong>Variable elimination</strong> avoids re-computing shared subexpressions.
            Instead of summing over the whole joint, it keeps a set of <strong>factors</strong> and
            repeatedly picks a hidden variable, multiplies the factors that mention it, and{' '}
            <strong>sums it out</strong> — shrinking the problem step by step.
          </>
        }
        how="Step through the elimination. Factors being combined glow; the new (smaller) factor is highlighted. Watch the scopes shrink."
        legend={[
          { color: 'var(--brand-400)', label: 'factor being combined' },
          { color: 'var(--success)', label: 'new factor (summed out)' },
        ]}
      />

      <div className="ve-stage">
        {step.factors.map((f) => {
          const state = step.produced === f.id ? 'new' : step.combining.includes(f.id) ? 'combine' : ''
          return (
            <motion.div layout key={f.id} className={`ve-factor${state ? ` is-${state}` : ''}`}>
              <span className="ve-factor-name mono">f({fscope(f.scope)})</span>
              <span className="ve-factor-size">{2 ** f.scope.length} rows</span>
              <span className="ve-factor-vars">
                {f.scope.map((s) => NODE_LABELS[s]).join(', ')}
              </span>
            </motion.div>
          )
        })}
      </div>

      <StepPlayer
        player={player}
        stepLabel={
          player.index === 0
            ? 'Initial factors'
            : player.index === trace.length - 1
              ? 'Normalize'
              : 'Eliminate'
        }
        caption={step.caption}
      />
    </div>
  )
}
