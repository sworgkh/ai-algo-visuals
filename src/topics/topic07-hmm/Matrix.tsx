import './Matrix.css'

type Fmt = (n: number) => string
const f2: Fmt = (n) => (n === 0 ? '0' : n.toFixed(2))

interface MatrixViewProps {
  values: number[][]
  rowLabels?: string[]
  colLabels?: string[]
  /** "r,c" keys to accent. */
  highlight?: Set<string>
  dimZero?: boolean
  format?: Fmt
  label?: string
}

export function MatrixView({
  values,
  rowLabels,
  colLabels,
  highlight,
  dimZero,
  format = f2,
  label,
}: MatrixViewProps) {
  return (
    <figure className="mx">
      {colLabels && (
        <div className="mx-collabels" style={{ gridTemplateColumns: `repeat(${values[0].length}, 1fr)` }}>
          {colLabels.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
      )}
      <div className="mx-body">
        {rowLabels && (
          <div className="mx-rowlabels">
            {rowLabels.map((r) => (
              <span key={r}>{r}</span>
            ))}
          </div>
        )}
        <div className="mx-bracket">
          <div
            className="mx-grid"
            style={{ gridTemplateColumns: `repeat(${values[0].length}, minmax(44px, 1fr))` }}
          >
            {values.flatMap((row, r) =>
              row.map((v, c) => {
                const on = highlight?.has(`${r},${c}`)
                const dim = dimZero && v === 0
                return (
                  <span key={`${r},${c}`} className={`mx-cell mono${on ? ' is-on' : ''}${dim ? ' is-dim' : ''}`}>
                    {format(v)}
                  </span>
                )
              }),
            )}
          </div>
        </div>
      </div>
      {label && <figcaption className="mx-label">{label}</figcaption>}
    </figure>
  )
}

interface VecViewProps {
  values: number[]
  labels?: string[]
  highlight?: Set<number>
  accent?: 'brand' | 'pink' | 'green'
  format?: Fmt
  label?: string
}

export function VecView({ values, labels, highlight, accent = 'brand', format = f2, label }: VecViewProps) {
  return (
    <figure className={`vx vx--${accent}`}>
      <div className="vx-body">
        <div className="mx-bracket">
          <div className="vx-col">
            {values.map((v, i) => (
              <span key={i} className={`vx-cell mono${highlight?.has(i) ? ' is-on' : ''}`}>
                {format(v)}
              </span>
            ))}
          </div>
        </div>
        {labels && (
          <div className="vx-labels">
            {labels.map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </div>
        )}
      </div>
      {label && <figcaption className="vx-label">{label}</figcaption>}
    </figure>
  )
}

/** A standalone operator glyph between matrices/vectors (×, =, ·α). */
export function Op({ children }: { children: React.ReactNode }) {
  return <span className="mx-op">{children}</span>
}
