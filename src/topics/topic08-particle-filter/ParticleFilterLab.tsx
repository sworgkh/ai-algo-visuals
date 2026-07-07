import { useCallback, useEffect, useRef, useState } from 'react'
import {
  type FilterStep,
  type Particle,
  histogram,
  makeRng,
  mapEstimate,
  step as pfStep,
  uniformParticles,
} from '@/lib/particleFilter'
import { VizGuide } from '@/components/VizGuide'
import { CORRIDOR, MOTION, P_HIT, SEED } from './domain'
import './ParticleFilterLab.css'

const W = CORRIDOR

const MAX_AUTO_STEPS = 24

export function ParticleFilterLab() {
  const [n, setN] = useState(400)
  const [particles, setParticles] = useState<Particle[]>(() => uniformParticles(400, W.size))
  const [truePos, setTruePos] = useState(0)
  const [stepCount, setStepCount] = useState(0)
  const [last, setLast] = useState<FilterStep | null>(null)
  const [playing, setPlaying] = useState(false)
  // Refs are the source of truth for the simulation; state just drives rendering.
  const rngRef = useRef(makeRng(SEED))
  const posRef = useRef(0)
  const particlesRef = useRef<Particle[]>(uniformParticles(400, W.size))
  const stepsRef = useRef(0)

  const reset = useCallback((count: number) => {
    rngRef.current = makeRng(SEED)
    posRef.current = 0
    particlesRef.current = uniformParticles(count, W.size)
    stepsRef.current = 0
    setParticles(particlesRef.current)
    setTruePos(0)
    setStepCount(0)
    setLast(null)
    setPlaying(false)
  }, [])

  const doStep = useCallback(() => {
    const next = (posRef.current + 1) % W.size
    posRef.current = next
    const obs = W.doors[next]
    const s = pfStep(W, particlesRef.current, obs, rngRef.current, MOTION, P_HIT)
    particlesRef.current = s.resampled
    stepsRef.current += 1
    setTruePos(next)
    setParticles(s.resampled)
    setLast(s)
    setStepCount(stepsRef.current)
  }, [])

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      if (stepsRef.current >= MAX_AUTO_STEPS) {
        setPlaying(false)
        return
      }
      doStep()
    }, 700)
    return () => clearInterval(id)
  }, [playing, doStep])

  const hist = histogram(particles, W.size)
  const maxCount = Math.max(1, ...hist)
  const est = mapEstimate(particles, W.size)
  const localized = stepCount > 0 && est === truePos

  const applyN = (v: number) => {
    setN(v)
    reset(v)
  }

  return (
    <div className="pf">
      <VizGuide
        what={
          <>
            A robot drives along a ring of cells, some of which are{' '}
            <strong>doors</strong>, and can only sense <em>door / no-door</em> (noisily). A{' '}
            <strong>particle filter</strong> represents its belief as a cloud of guesses. Each step:{' '}
            <strong>predict</strong> (every particle drives forward), <strong>weight</strong> (by how
            well it matches the reading), <strong>resample</strong> (duplicate good guesses, drop
            bad ones). The cloud collapses onto the truth.
          </>
        }
        how="Press Step (or Play) and watch the histogram concentrate on the robot. Then drop N to ~30 and Reset to see particle deprivation — the cloud can lose the robot entirely."
        legend={[
          { color: 'var(--viz-4)', label: 'true robot position' },
          { color: 'var(--brand-500)', label: 'particles per cell (the belief)' },
          { swatch: <span className="pf-door-key">🚪</span>, label: 'door cell (landmark)' },
        ]}
      />

      <div className="pf-controls">
        <button className="pf-btn pf-btn--primary" onClick={doStep} disabled={playing}>
          Step ▶
        </button>
        <button className="pf-btn" onClick={() => setPlaying((p) => !p)}>
          {playing ? 'Pause ⏸' : 'Play ⏵⏵'}
        </button>
        <button className="pf-btn" onClick={() => reset(n)}>
          Reset ↺
        </button>
        <label className="pf-nslider">
          <span>
            N = <span className="mono">{n}</span> particles
          </span>
          <input
            type="range"
            min={10}
            max={1500}
            step={10}
            value={n}
            onChange={(e) => applyN(e.currentTarget.valueAsNumber)}
          />
        </label>
        <div className="pf-status">
          step <span className="mono">{stepCount}</span> · MAP estimate{' '}
          <span className="mono">cell {est}</span>{' '}
          {localized ? <span className="pf-ok">✓ localized</span> : <span className="pf-wait">…</span>}
        </div>
      </div>

      <div className="pf-corridor">
        {Array.from({ length: W.size }, (_, i) => (
          <div key={i} className={`pf-cellcol${i === truePos ? ' is-true' : ''}`}>
            <div className="pf-bar-area">
              <div className="pf-bar" style={{ height: `${(hist[i] / maxCount) * 100}%` }} />
              {i === truePos && <span className="pf-robot">🤖</span>}
            </div>
            <div className={`pf-cell${W.doors[i] ? ' is-door' : ''}`}>
              {W.doors[i] ? '🚪' : ''}
            </div>
            <span className="pf-cell-idx mono">{i}</span>
          </div>
        ))}
      </div>

      {last && (
        <div className="pf-laststep">
          <span className="pf-laststep-label">
            last step — sensed <strong>{last.obs ? 'a door 🚪' : 'a wall'}</strong>:
          </span>
          <div className="pf-phases">
            <PhaseRow title="1 · predict (drive forward)" particles={last.predicted} weighted={false} />
            <PhaseRow title="2 · weight (match the reading)" particles={last.weighted} weighted />
            <PhaseRow title="3 · resample (survival of the fittest)" particles={last.resampled} weighted={false} />
          </div>
        </div>
      )}
    </div>
  )
}

function PhaseRow({
  title,
  particles,
  weighted,
}: {
  title: string
  particles: Particle[]
  weighted: boolean
}) {
  const size = W.size
  const mass = weighted
    ? beliefByCell(particles, size)
    : histogram(particles, size).map((c) => c / Math.max(1, particles.length))
  const max = Math.max(1e-9, ...mass)
  return (
    <div className="pf-phase">
      <span className="pf-phase-title">{title}</span>
      <div className="pf-phase-bars">
        {mass.map((m, i) => (
          <div key={i} className="pf-phase-cell">
            <div
              className={`pf-phase-bar${weighted ? ' is-weighted' : ''}`}
              style={{ height: `${(m / max) * 100}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function beliefByCell(particles: Particle[], size: number): number[] {
  const h = new Array(size).fill(0)
  for (const p of particles) h[p.pos] += p.weight
  return h
}
