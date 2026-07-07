import { describe, expect, it } from 'vitest'
import {
  type Particle,
  type World,
  beliefMass,
  histogram,
  makeRng,
  mapEstimate,
  sensorLikelihood,
  step,
  systematicResample,
  uniformParticles,
  weight,
} from './particleFilter'

const WORLD: World = {
  size: 10,
  doors: [false, true, false, false, true, false, true, false, false, false],
}

describe('sensor model', () => {
  it('rewards agreement with the map by the hit-rate', () => {
    // cell 1 is a door
    expect(sensorLikelihood(WORLD, 1, true, 0.9)).toBeCloseTo(0.9)
    expect(sensorLikelihood(WORLD, 1, false, 0.9)).toBeCloseTo(0.1)
    // cell 0 is a wall
    expect(sensorLikelihood(WORLD, 0, false, 0.9)).toBeCloseTo(0.9)
    expect(sensorLikelihood(WORLD, 0, true, 0.9)).toBeCloseTo(0.1)
  })
})

describe('weighting', () => {
  it('normalizes weights to sum to 1', () => {
    const ps: Particle[] = [
      { pos: 1, weight: 0.5 },
      { pos: 0, weight: 0.5 },
    ]
    const w = weight(ps, WORLD, true, 0.9)
    expect(w.reduce((a, p) => a + p.weight, 0)).toBeCloseTo(1)
    // the door particle should outweigh the wall particle 9:1
    expect(w[0].weight / w[1].weight).toBeCloseTo(9)
  })

  it('falls back to uniform when every particle has zero likelihood', () => {
    const ps: Particle[] = [{ pos: 0, weight: 1 }]
    // impossible reading with pHit=1 → total 0 → uniform fallback
    const w = weight(ps, WORLD, true, 1)
    expect(w[0].weight).toBe(1)
  })
})

describe('systematic resampling', () => {
  it('collapses all particles onto the single high-weight one', () => {
    const ps: Particle[] = [
      { pos: 2, weight: 0 },
      { pos: 5, weight: 1 },
      { pos: 8, weight: 0 },
    ]
    const out = systematicResample(ps, makeRng(1))
    expect(out).toHaveLength(3)
    expect(out.every((p) => p.pos === 5)).toBe(true)
  })

  it('preserves particle count and resets weights to 1/n', () => {
    const ps = uniformParticles(50, WORLD.size).map((p, i) => ({ ...p, weight: (i + 1) / 1275 }))
    const out = systematicResample(ps, makeRng(7))
    expect(out).toHaveLength(50)
    expect(out.every((p) => p.weight === 1 / 50)).toBe(true)
  })
})

describe('histograms', () => {
  it('particle counts sum to N; belief mass sums to ~1', () => {
    const ps = uniformParticles(100, WORLD.size)
    expect(histogram(ps, WORLD.size).reduce((a, b) => a + b, 0)).toBe(100)
    expect(beliefMass(ps, WORLD.size).reduce((a, b) => a + b, 0)).toBeCloseTo(1)
  })
})

describe('end-to-end localization', () => {
  it('converges the cloud onto the true robot position (seeded)', () => {
    const rng = makeRng(42)
    const motion = { step: 1, pExact: 0.9 }
    const pHit = 0.9
    let particles = uniformParticles(2000, WORLD.size)
    let truePos = 0
    // Drive the robot 14 cells; feed the filter the true (noiseless) reading.
    for (let t = 0; t < 14; t++) {
      truePos = (truePos + 1) % WORLD.size
      const obs = WORLD.doors[truePos]
      particles = step(WORLD, particles, obs, rng, motion, pHit).resampled
    }
    // MAP estimate should land on (or adjacent to) the true cell.
    const est = mapEstimate(particles, WORLD.size)
    const circDist = Math.min(
      (est - truePos + WORLD.size) % WORLD.size,
      (truePos - est + WORLD.size) % WORLD.size,
    )
    expect(circDist).toBeLessThanOrEqual(1)
  })
})
