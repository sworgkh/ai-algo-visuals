import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { computeSchedule } from '@/lib/cpm'
import type { CpmTask } from '@/lib/cpm'
import { useStepPlayer } from '@/hooks/useStepPlayer'
import { StepPlayer } from '@/components/StepPlayer'
import { CAR_ASSEMBLY } from './domain'
import './CriticalPathLab.css'

const NODE_W = 128
const NODE_H = 82
const COL_W = 200
const ROW_H = 126
const PAD = 20

interface Placed {
  id: string
  x: number
  y: number
}

function layout(tasks: CpmTask[]): { pos: Map<string, Placed>; width: number; height: number } {
  const byId = new Map(tasks.map((t) => [t.id, t]))
  const layer = new Map<string, number>(tasks.map((t) => [t.id, 0]))
  for (let iter = 0; iter <= tasks.length; iter++) {
    let changed = false
    for (const t of tasks) {
      for (const d of t.deps) {
        if (!byId.has(d)) continue
        if ((layer.get(t.id) ?? 0) < (layer.get(d) ?? 0) + 1) {
          layer.set(t.id, (layer.get(d) ?? 0) + 1)
          changed = true
        }
      }
    }
    if (!changed) break
  }
  const cols = new Map<number, string[]>()
  for (const t of tasks) {
    const l = layer.get(t.id)!
    cols.set(l, [...(cols.get(l) ?? []), t.id])
  }
  const maxRows = Math.max(...[...cols.values()].map((c) => c.length))
  const maxLayer = Math.max(...[...layer.values()])
  const pos = new Map<string, Placed>()
  for (const [l, ids] of cols) {
    const offset = ((maxRows - ids.length) * ROW_H) / 2
    ids.forEach((id, i) => pos.set(id, { id, x: PAD + l * COL_W, y: PAD + offset + i * ROW_H }))
  }
  return {
    pos,
    width: PAD * 2 + maxLayer * COL_W + NODE_W,
    height: PAD * 2 + maxRows * ROW_H - (ROW_H - NODE_H),
  }
}

export function CriticalPathLab() {
  const [durations, setDurations] = useState<Record<string, number>>(() =>
    Object.fromEntries(CAR_ASSEMBLY.map((t) => [t.id, t.duration])),
  )
  const tasks = useMemo<CpmTask[]>(
    () => CAR_ASSEMBLY.map((t) => ({ ...t, duration: durations[t.id] })),
    [durations],
  )
  const schedule = useMemo(() => computeSchedule(tasks), [tasks])
  const { pos, width, height } = useMemo(() => layout(tasks), [tasks])
  const byId = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks])

  const N = schedule.order.length
  const [params] = useSearchParams()
  const initialStep = Math.max(0, Number(params.get('step') ?? 0) || 0)
  const player = useStepPlayer(2 * N + 1, { initialIndex: initialStep })
  const idx = player.index

  const revOrder = useMemo(() => [...schedule.order].reverse(), [schedule.order])
  const fwdRevealed = new Set(idx < N ? schedule.order.slice(0, idx + 1) : schedule.order)
  const bwdRevealed = new Set(
    idx >= 2 * N ? schedule.order : idx >= N ? revOrder.slice(0, idx - N + 1) : [],
  )

  const setDur = (id: string, v: number) => {
    setDurations((d) => ({ ...d, [id]: Math.max(0, Math.min(999, v || 0)) }))
    player.reset()
  }
  const resetDur = () => {
    setDurations(Object.fromEntries(CAR_ASSEMBLY.map((t) => [t.id, t.duration])))
    player.reset()
  }

  const succOf = (id: string) => tasks.filter((t) => t.deps.includes(id)).map((t) => t.id)

  const caption = (() => {
    if (idx < N) {
      const id = schedule.order[idx]
      const t = byId.get(id)!
      const r = schedule.tasks[id]
      const preds = t.deps.filter((d) => byId.has(d))
      const es = preds.length
        ? `max(${preds.map((d) => `EF ${byId.get(d)!.label}=${schedule.tasks[d].ef}`).join(', ')}) = ${r.es}`
        : `0 (no predecessors)`
      return `Forward · ${t.label}: ES = ${es}; EF = ${r.es} + ${t.duration} = ${r.ef}.`
    }
    if (idx < 2 * N) {
      const id = revOrder[idx - N]
      const t = byId.get(id)!
      const r = schedule.tasks[id]
      const succ = succOf(id)
      const lf = succ.length
        ? `min(${succ.map((s) => `LS ${byId.get(s)!.label}=${schedule.tasks[s].ls}`).join(', ')}) = ${r.lf}`
        : `${schedule.projectDuration} (project end)`
      return `Backward · ${t.label}: LF = ${lf}; LS = ${r.lf} − ${t.duration} = ${r.ls}. Slack = ${r.ls} − ${r.es} = ${r.slack}.`
    }
    const cp = schedule.criticalPath.map((id) => byId.get(id)!.label).join(' → ')
    return `Project duration = ${schedule.projectDuration}. Critical path (zero slack): ${cp}. The other tasks have slack — they can start late without delaying the project.`
  })()

  const stepLabel = idx < N ? 'Forward pass' : idx < 2 * N ? 'Backward pass' : 'Critical path'

  return (
    <div className="cpm">
      <div className="cpm-guide">
        <div className="cpm-guide-text">
          <p>
            Every task has a <strong>duration</strong>. The <strong>forward pass</strong> finds
            the <em>earliest</em> each task can start and finish (<span className="cpm-k cpm-k--e">ES</span> /
            <span className="cpm-k cpm-k--e"> EF</span>); the <strong>backward pass</strong> finds the{' '}
            <em>latest</em> it can start/finish without delaying the project (
            <span className="cpm-k cpm-k--l">LS</span> / <span className="cpm-k cpm-k--l">LF</span>).
            Then <strong>slack = LS − ES</strong>: tasks with <em>zero</em> slack form the{' '}
            <strong className="cpm-k--crit">critical path</strong> — delay any one and the whole
            project slips. Press play to watch each number get computed.
          </p>
        </div>
        <div className="cpm-guide-legend">
          <div className="cpm-node cpm-node--legend" aria-hidden="true">
            <div className="cpm-node-row cpm-node-top">
              <span>ES</span>
              <span>EF</span>
            </div>
            <div className="cpm-node-mid">
              <span className="cpm-node-label">task</span>
              <span className="cpm-node-dur">d</span>
            </div>
            <div className="cpm-node-row cpm-node-bot">
              <span>LS</span>
              <span>LF</span>
            </div>
          </div>
          <ul className="cpm-key">
            <li><span className="cpm-k cpm-k--e">ES · EF</span> earliest start / finish</li>
            <li><span className="cpm-k cpm-k--l">LS · LF</span> latest start / finish</li>
            <li><i className="cpm-kswatch cpm-kswatch--crit" /> critical (0 slack)</li>
            <li><i className="cpm-kswatch cpm-kswatch--slack" /> slack (can slip)</li>
          </ul>
        </div>
      </div>

      <div className="cpm-editor">
        <span className="cpm-editor-title">Durations</span>
        {tasks.map((t) => (
          <label key={t.id} className="cpm-dur">
            <span>{t.label}</span>
            <input
              type="number"
              min={0}
              value={durations[t.id]}
              onChange={(e) => setDur(t.id, e.currentTarget.valueAsNumber)}
            />
          </label>
        ))}
        <button className="cpm-reset" onClick={resetDur}>
          Reset
        </button>
      </div>

      {/* DAG of activity nodes */}
      <div className="cpm-dag-wrap">
        <div className="cpm-dag" style={{ width, height }}>
          <svg className="cpm-edges" width={width} height={height}>
            <defs>
              <marker id="cpm-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
                <path d="M0,0 L9,4.5 L0,9 z" fill="var(--border-strong)" />
              </marker>
            </defs>
            {tasks.flatMap((t) =>
              t.deps
                .filter((d) => byId.has(d))
                .map((d) => {
                  const a = pos.get(d)!
                  const b = pos.get(t.id)!
                  const critical = schedule.tasks[d].critical && schedule.tasks[t.id].critical
                  return (
                    <line
                      key={`${d}-${t.id}`}
                      x1={a.x + NODE_W}
                      y1={a.y + NODE_H / 2}
                      x2={b.x}
                      y2={b.y + NODE_H / 2}
                      className={`cpm-edge${idx >= 2 * N && critical ? ' is-critical' : ''}`}
                      markerEnd="url(#cpm-arrow)"
                    />
                  )
                }),
            )}
          </svg>
          {tasks.map((t) => {
            const r = schedule.tasks[t.id]
            const showF = fwdRevealed.has(t.id)
            const showB = bwdRevealed.has(t.id)
            const critical = showF && showB && r.critical
            const p = pos.get(t.id)!
            return (
              <div
                key={t.id}
                className={`cpm-node${critical ? ' is-critical' : ''}`}
                style={{ left: p.x, top: p.y, width: NODE_W, height: NODE_H }}
              >
                <div className="cpm-node-row cpm-node-top">
                  <span title="Earliest start">{showF ? r.es : '·'}</span>
                  <span title="Earliest finish">{showF ? r.ef : '·'}</span>
                </div>
                <div className="cpm-node-mid">
                  <span className="cpm-node-label">{t.label}</span>
                  <span className="cpm-node-dur">d = {t.duration}</span>
                  {showF && showB && r.slack > 0 && (
                    <span className="cpm-node-slack">slack {r.slack}</span>
                  )}
                </div>
                <div className="cpm-node-row cpm-node-bot">
                  <span title="Latest start">{showB ? r.ls : '·'}</span>
                  <span title="Latest finish">{showB ? r.lf : '·'}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Gantt with slack */}
      <Gantt
        tasks={tasks}
        schedule={schedule}
        fwdRevealed={fwdRevealed}
        bwdRevealed={bwdRevealed}
      />

      <StepPlayer player={player} stepLabel={stepLabel} caption={caption} />
    </div>
  )
}

function Gantt({
  tasks,
  schedule,
  fwdRevealed,
  bwdRevealed,
}: {
  tasks: CpmTask[]
  schedule: ReturnType<typeof computeSchedule>
  fwdRevealed: Set<string>
  bwdRevealed: Set<string>
}) {
  const total = Math.max(1, schedule.projectDuration)
  const pct = (v: number) => `${(v / total) * 100}%`
  const ticks = niceTicks(total)
  return (
    <div className="cpm-gantt">
      <div className="cpm-gantt-title">
        <span>
          Schedule · project duration <strong>{schedule.projectDuration}</strong>
        </span>
        <span className="cpm-gantt-legend">
          <span><i className="cpm-kswatch cpm-kswatch--bar" /> scheduled (ES→EF)</span>
          <span><i className="cpm-kswatch cpm-kswatch--slack" /> slack (up to LS)</span>
        </span>
      </div>
      <div className="cpm-gantt-rows">
        {tasks.map((t) => {
          const r = schedule.tasks[t.id]
          const showBar = fwdRevealed.has(t.id)
          const showSlack = bwdRevealed.has(t.id) && r.slack > 0
          return (
            <div className="cpm-grow" key={t.id}>
              <span className="cpm-grow-label">{t.label}</span>
              <div className="cpm-grow-track">
                {showBar && (
                  <motion.div
                    className={`cpm-bar${r.critical ? ' is-critical' : ''}`}
                    style={{ left: pct(r.es) }}
                    initial={{ width: 0 }}
                    animate={{ width: pct(t.duration) }}
                    transition={{ duration: 0.35 }}
                  />
                )}
                {showSlack && (
                  <div
                    className="cpm-slack"
                    style={{ left: pct(r.ef), width: pct(r.slack) }}
                    title={`slack ${r.slack}`}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
      <div className="cpm-axis">
        {ticks.map((tk) => (
          <span key={tk} className="cpm-tick" style={{ left: pct(tk) }}>
            {tk}
          </span>
        ))}
      </div>
    </div>
  )
}

function niceTicks(total: number): number[] {
  const step = total <= 20 ? 5 : total <= 60 ? 15 : total <= 120 ? 20 : 50
  const out: number[] = []
  for (let v = 0; v <= total; v += step) out.push(v)
  if (out[out.length - 1] !== total) out.push(total)
  return out
}
