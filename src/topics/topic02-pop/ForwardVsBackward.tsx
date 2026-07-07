import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Action, Fluent } from '@/lib/strips'
import { applicableActions, relevantActions } from '@/lib/strips'
import { useStepPlayer } from '@/hooks/useStepPlayer'
import { StepPlayer } from '@/components/StepPlayer'
import { StaticBlocks } from './StaticBlocks'
import { GOAL_STATE, INITIAL_STATE } from './blocksState'
import { GOAL, GROUND_ACTIONS, INITIAL } from './domain'
import './ForwardVsBackward.css'

const initState = new Set<Fluent>(INITIAL)
const goalSet = new Set<Fluent>(GOAL)

interface Child {
  action: Action
  /** Which goal literals this action directly achieves. */
  achieves: Fluent[]
  relevant: boolean
}

function ConceptCard() {
  const [open, setOpen] = useState(false)
  return (
    <section className="fb-concept">
      <div className="fb-concept-head">
        <span className="fb-concept-tag">Concept check · True / False</span>
        <span className="fb-verdict">Verdict: True</span>
      </div>
      <blockquote className="fb-statement">
        “In planning problems, backward search can be more efficient than forward search.”
      </blockquote>
      <p className="fb-model">
        <strong>Why:</strong> True. Regression only expands actions <em>relevant</em> to the goal,
        whereas progression expands <em>all applicable</em> actions; with a small goal and large
        action space this lowers the effective branching factor. It isn’t universal — hence “can
        be”.
      </p>
      <button className="fb-caveat-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? '− Hide' : '+ Why only “can”?'}
      </button>
      <AnimatePresence>
        {open && (
          <motion.p
            className="fb-caveat"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            Regression reasons over <strong>sets</strong> of states (partial goal descriptions),
            which makes strong heuristics harder to compute. In practice, modern planners often run{' '}
            <em>forward</em> with powerful heuristics and beat backward search — so the honest
            answer weighs both directions.
          </motion.p>
        )}
      </AnimatePresence>
    </section>
  )
}

function SearchColumn({
  kind,
  rootLabel,
  rootSub,
  rootState,
  children,
  expanded,
}: {
  kind: 'forward' | 'backward'
  rootLabel: string
  rootSub: string
  rootState: ReadonlySet<Fluent>
  children: Child[]
  expanded: boolean
}) {
  const total = children.length
  return (
    <div className={`fb-col fb-col--${kind}`}>
      <div className="fb-col-head">
        <h3>{kind === 'forward' ? 'Forward (progression)' : 'Backward (regression)'}</h3>
        <p>
          {kind === 'forward'
            ? 'From the initial state — expands every applicable action.'
            : 'From the goal — expands only relevant actions.'}
        </p>
      </div>

      <div className="fb-tree">
        <div className="fb-root">
          <span className="fb-root-label">{rootLabel}</span>
          <StaticBlocks state={rootState} size="sm" />
          <span className="fb-root-sub mono">{rootSub}</span>
        </div>

        {expanded && <div className="fb-trunk" />}

        <AnimatePresence>
          {expanded && (
            <motion.div
              className="fb-children"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {children.map((c, i) => (
                <motion.div
                  key={c.action.name}
                  className={`fb-child${c.relevant ? ' is-relevant' : ' is-irrelevant'}`}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <span className="fb-child-name mono">{c.action.name}</span>
                  {c.relevant ? (
                    <span className="fb-child-tag fb-child-tag--rel">
                      achieves {c.achieves.join(', ')}
                    </span>
                  ) : (
                    <span className="fb-child-tag fb-child-tag--irr">doesn’t touch goal</span>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="fb-counter">
        <span className="fb-counter-num">{expanded ? total : 0}</span>
        <span className="fb-counter-label">
          {kind === 'forward' ? 'applicable actions expanded' : 'relevant actions expanded'}
        </span>
      </div>
    </div>
  )
}

export function ForwardVsBackward() {
  const player = useStepPlayer(2, { initialIndex: 1 })
  const expanded = player.index >= 1

  const forwardChildren: Child[] = useMemo(
    () =>
      applicableActions(GROUND_ACTIONS, initState).map((action) => {
        const achieves = action.add.filter((a) => goalSet.has(a))
        return { action, achieves, relevant: achieves.length > 0 }
      }),
    [],
  )
  const backwardChildren: Child[] = useMemo(
    () =>
      relevantActions(GROUND_ACTIONS, goalSet).map((action) => ({
        action,
        achieves: action.add.filter((a) => goalSet.has(a)),
        relevant: true,
      })),
    [],
  )

  const fwdIrrelevant = forwardChildren.filter((c) => !c.relevant).length

  return (
    <div className="forward-backward">
      <ConceptCard />

      <div className="fb-cols">
        <SearchColumn
          kind="forward"
          rootLabel="Initial state"
          rootSub="On(C,A), On(A,Table), On(B,Table), Clear(C), Clear(B)"
          rootState={INITIAL_STATE}
          children={forwardChildren}
          expanded={expanded}
        />
        <SearchColumn
          kind="backward"
          rootLabel="Goal"
          rootSub="On(A,B) ∧ On(B,C)"
          rootState={GOAL_STATE}
          children={backwardChildren}
          expanded={expanded}
        />
      </div>

      <div className="fb-takeaway">
        <p>
          <strong>The mechanism is relevance.</strong> Forward expands all{' '}
          {forwardChildren.length} applicable actions — {fwdIrrelevant} of which don’t touch the
          goal at all. Backward never even considers those: it only expands the{' '}
          {backwardChildren.length} actions relevant to what’s still needed, out of{' '}
          {GROUND_ACTIONS.length} ground actions.
        </p>
        <p className="fb-note">
          In this tiny 3-block problem the root counts are close; the advantage compounds as the
          action set grows and the search deepens — which is exactly why the statement says
          “can be”, not “is”.
        </p>
      </div>

      <StepPlayer
        player={player}
        stepLabel={expanded ? 'Expanded one level' : 'Roots'}
        caption={
          expanded
            ? 'Forward branches on every applicable action; backward branches only on relevant ones.'
            : 'Press play / next to expand the first level of each search.'
        }
        showProgress={false}
      />
    </div>
  )
}
