import type { Fluent } from '@/lib/strips'
import './OperatorCard.css'

export interface OperatorCardProps {
  label: string
  precond: Fluent[]
  add: Fluent[]
  del: Fluent[]
  /** Preconditions still unsatisfied (glow amber). */
  openLiterals?: Fluent[]
  /** Literals to spotlight (e.g. the threatened literal). */
  highlight?: Fluent[]
  className?: string
}

function Chips({
  items,
  kind,
  open,
  highlight,
}: {
  items: Fluent[]
  kind: 'pre' | 'add' | 'del'
  open?: Fluent[]
  highlight?: Fluent[]
}) {
  if (items.length === 0) return <span className="oc-empty">∅</span>
  const openSet = new Set(open ?? [])
  const hiSet = new Set(highlight ?? [])
  const sign = kind === 'add' ? '+' : kind === 'del' ? '−' : ''
  return (
    <span className="oc-chips">
      {items.map((f) => (
        <span
          key={f}
          className={`oc-chip oc-chip--${kind}${openSet.has(f) ? ' is-open' : ''}${
            hiSet.has(f) ? ' is-hi' : ''
          }`}
        >
          {sign && <span className="oc-sign">{sign}</span>}
          {f}
        </span>
      ))}
    </span>
  )
}

/** STRIPS operator annotation: PRECOND / ADD / DELETE, color-coded. */
export function OperatorCard({
  label,
  precond,
  add,
  del,
  openLiterals,
  highlight,
  className,
}: OperatorCardProps) {
  return (
    <div className={`operator-card${className ? ` ${className}` : ''}`}>
      <div className="oc-name mono">{label}</div>
      <dl className="oc-rows">
        <div className="oc-row">
          <dt>PRE</dt>
          <dd>
            <Chips items={precond} kind="pre" open={openLiterals} highlight={highlight} />
          </dd>
        </div>
        <div className="oc-row">
          <dt>ADD</dt>
          <dd>
            <Chips items={add} kind="add" highlight={highlight} />
          </dd>
        </div>
        <div className="oc-row">
          <dt>DEL</dt>
          <dd>
            <Chips items={del} kind="del" highlight={highlight} />
          </dd>
        </div>
      </dl>
    </div>
  )
}
