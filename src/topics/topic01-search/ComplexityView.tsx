import { useState } from 'react'
import { VizGuide } from '@/components/VizGuide'
import { FormulaBlock } from '@/components/FormulaBlock'
import './ComplexityView.css'

export function ComplexityView() {
  const [b, setB] = useState(3)
  const [d, setD] = useState(6)

  const bfsNodes = (b ** (d + 1) - 1) / (b - 1) // full tree to depth d
  const bfsFrontier = b ** d // widest level ≈ memory
  const dfsMemory = b * d // path + siblings

  const fmt = (n: number) => (n >= 1e6 ? n.toExponential(1) : Math.round(n).toLocaleString())

  return (
    <div className="cx">
      <VizGuide
        what={
          <>
            The cost of blind search is dominated by the <strong>branching factor b</strong> and{' '}
            <strong>depth d</strong>. BFS must hold a whole level of the tree — that frontier grows
            as <strong>bᵈ</strong>, so its memory explodes. DFS only keeps the current path and its
            siblings — <strong>b·m</strong>, linear in depth. That memory gap is why DFS survives
            deep trees that BFS cannot.
          </>
        }
        how="Drag b and d and watch BFS's frontier (bᵈ) run away from DFS's linear b·m memory."
        legend={[
          { color: 'var(--brand-500)', label: 'BFS frontier ≈ bᵈ (exponential)' },
          { color: 'var(--viz-4)', label: 'DFS memory ≈ b·m (linear)' },
        ]}
      />

      <div className="cx-sliders">
        <label className="cx-slider">
          <span>
            branching factor b = <span className="mono">{b}</span>
          </span>
          <input type="range" min={2} max={6} step={1} value={b} onChange={(e) => setB(e.currentTarget.valueAsNumber)} />
        </label>
        <label className="cx-slider">
          <span>
            depth d = <span className="mono">{d}</span>
          </span>
          <input type="range" min={1} max={12} step={1} value={d} onChange={(e) => setD(e.currentTarget.valueAsNumber)} />
        </label>
      </div>

      <div className="cx-stats">
        <div className="cx-stat cx-stat--bfs">
          <span className="cx-stat-num mono">{fmt(bfsFrontier)}</span>
          <span className="cx-stat-lbl">
            BFS frontier · <span className="mono">bᵈ</span>
          </span>
        </div>
        <div className="cx-stat">
          <span className="cx-stat-num mono">{fmt(bfsNodes)}</span>
          <span className="cx-stat-lbl">
            BFS nodes generated · <span className="mono">O(bᵈ)</span>
          </span>
        </div>
        <div className="cx-stat cx-stat--dfs">
          <span className="cx-stat-num mono">{fmt(dfsMemory)}</span>
          <span className="cx-stat-lbl">
            DFS memory · <span className="mono">b·m</span>
          </span>
        </div>
        <div className="cx-stat cx-stat--ratio">
          <span className="cx-stat-num mono">{fmt(bfsFrontier / dfsMemory)}×</span>
          <span className="cx-stat-lbl">BFS / DFS memory</span>
        </div>
      </div>

      <div className="cx-bars">
        <BarRow label="BFS frontier bᵈ" value={bfsFrontier} max={bfsFrontier} cls="bfs" fmt={fmt} />
        <BarRow label="DFS memory b·m" value={dfsMemory} max={bfsFrontier} cls="dfs" fmt={fmt} />
      </div>

      <div className="cx-heuristics">
        <h4 className="cx-h-title">When is A* optimal? Admissible vs. consistent heuristics</h4>
        <div className="cx-h-grid">
          <div className="cx-h-card">
            <span className="cx-h-tag">admissible</span>
            <FormulaBlock tex={String.raw`h(n) \le h^{*}(n)`} display={false} />
            <p>Never overestimates the true remaining cost. Guarantees A* returns an optimal path (tree search).</p>
          </div>
          <div className="cx-h-card">
            <span className="cx-h-tag">consistent</span>
            <FormulaBlock tex={String.raw`h(n) \le c(n, n') + h(n')`} display={false} />
            <p>
              The triangle inequality along every edge. Stronger than admissible — it also keeps A*
              optimal with <em>graph</em> search (no re-expansions needed). Consistent ⟹ admissible.
            </p>
          </div>
        </div>
        <p className="cx-h-note">
          Manhattan distance on this grid is both — which is why the A* in the other tabs is both
          optimal and efficient.
        </p>
      </div>
    </div>
  )
}

function BarRow({
  label,
  value,
  max,
  cls,
  fmt,
}: {
  label: string
  value: number
  max: number
  cls: string
  fmt: (n: number) => string
}) {
  // log scale so the linear bar stays visible next to the exponential one
  const pct = (Math.log10(value + 1) / Math.log10(max + 1)) * 100
  return (
    <div className="cx-bar-row">
      <span className="cx-bar-label mono">{label}</span>
      <div className="cx-bar-track">
        <div className={`cx-bar cx-bar--${cls}`} style={{ width: `${Math.max(2, pct)}%` }} />
      </div>
      <span className="cx-bar-val mono">{fmt(value)}</span>
    </div>
  )
}
